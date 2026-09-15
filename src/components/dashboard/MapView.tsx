"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Map as MapIcon, 
  MapPin, 
  Building2, 
  Search,
  Crosshair,
  Maximize2,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Radio,
  User,
  Bike,
  Car,
  Smartphone,
  Wifi,
  RefreshCw,
  Eye,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  code: string;
  name: string;
  location: string;
  type: string;
  lat?: number;
  lng?: number;
  requirements?: {
    lun: number;
    mar: number;
    mie: number;
    jue: number;
    vie: number;
    sab: number;
    dom: number;
  };
}

interface Registration {
  projectCode: string;
  status: string;
}

export interface TrackingUnit {
  id: string;
  name: string;
  type: 'guard' | 'motorcycle' | 'patrol' | 'supervisor';
  code: string;
  lat: number;
  lng: number;
  speed?: number;
  battery?: number;
  status: 'moving' | 'active' | 'idle' | 'offline';
  updatedAt?: any;
  assignedProject?: string;
}

// Default Center: Panama City, Panama
const PANAMA_CENTER: [number, number] = [8.9824, -79.5199];

// Map Tile Sources
const TILE_SOURCES = {
  cartoDark: {
    name: 'CARTO Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd'
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc'
  }
};

export function MapView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [trackingUnits, setTrackingUnits] = useState<TrackingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<TrackingUnit | null>(null);
  const [currentTileSource, setCurrentTileSource] = useState<'cartoDark' | 'osm'>('cartoDark');
  const [tileErrorCount, setTileErrorCount] = useState(0);

  // Layer Visibility Toggles
  const [showProjects, setShowProjects] = useState(true);
  const [showGuards, setShowGuards] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);

  // Local Device GPS Transmitting State
  const [isGpsTransmitting, setIsGpsTransmitting] = useState(false);
  const [myGpsCoords, setMyGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const projectMarkersRef = useRef<Map<string, any>>(new Map());
  const unitMarkersRef = useRef<Map<string, any>>(new Map());
  const tileLayerRef = useRef<any>(null);
  const leafletLRef = useRef<any>(null);

  // Helper to compute realistic coordinates in Panama from project data
  const getProjectCoords = (project: Project): [number, number] => {
    if (typeof project.lat === 'number' && typeof project.lng === 'number' && !isNaN(project.lat) && !isNaN(project.lng)) {
      return [project.lat, project.lng];
    }

    const text = (project.name + ' ' + project.location + ' ' + project.code).toLowerCase();
    
    // Key Panama Location mappings
    if (text.includes('bomba') || text.includes('albrook bomba')) return [8.9742, -79.5528];
    if (text.includes('galera') || text.includes('albrook galera')) return [8.9715, -79.5562];
    if (text.includes('san fernando') || text.includes('plaza san fernando')) return [8.9912, -79.5115];
    if (text.includes('costa del este')) return [9.0081, -79.4728];
    if (text.includes('obarrio') || text.includes('españa') || text.includes('via españa')) return [8.9875, -79.5218];
    if (text.includes('miraflores') || text.includes('canal')) return [8.9985, -79.5910];
    if (text.includes('pacora') || text.includes('este')) return [9.0833, -79.2833];
    if (text.includes('tocumen')) return [9.0800, -79.3833];

    // Panama City Base Offset hash fallback
    const hash = project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const latOffset = (((hash % 100) - 50) * 0.0025);
    const lngOffset = ((((hash * 17) % 100) - 50) * 0.0025);
    return [PANAMA_CENTER[0] + latOffset, PANAMA_CENTER[1] + lngOffset];
  };

  useEffect(() => {
    // 1. Escuchar proyectos desde Firestore
    const qProjects = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(fetched);
      setLoading(false);
    }, (error) => {
      console.warn('Error fetching projects from Firestore:', error);
      setLoading(false);
    });

    // 2. Escuchar registros de turno
    const qRegs = query(
      collection(db, 'shift-registrations'), 
      where('status', 'in', ['Activo', 'Doble'])
    );
    const unsubRegs = onSnapshot(qRegs, (snapshot) => {
      const fetched = snapshot.docs.map(doc => doc.data() as Registration);
      setRegistrations(fetched);
    });

    // 3. Escuchar Unidades en Tiempo Real (Guardias y Vehículos) desde Firestore
    const qUnits = collection(db, 'active_units');
    const unsubUnits = onSnapshot(qUnits, (snapshot) => {
      const fetchedUnits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TrackingUnit[];

      // Filtrar solo unidades con coordenadas válidas y excluir posibles restos de datos demo
      const realUnits = fetchedUnits.filter(
        u => !['unit-g1', 'unit-m1', 'unit-p1', 'unit-g2'].includes(u.id) &&
             !u.name?.includes('Juan Pérez') &&
             !u.name?.includes('Carlos Mendoza') &&
             !u.name?.includes('Moto Patrulla Rápida 01') &&
             !u.name?.includes('Patrulla Móvil 04') &&
             typeof u.lat === 'number' && typeof u.lng === 'number' &&
             !isNaN(u.lat) && !isNaN(u.lng)
      );

      setTrackingUnits(realUnits);
    }, (error) => {
      console.warn('Error fetching active_units realtime:', error);
      setTrackingUnits([]);
    });

    return () => {
      unsubProjects();
      unsubRegs();
      unsubUnits();
    };
  }, []);

  // Limpiar selección de unidad si ya no existe en Firestore
  useEffect(() => {
    if (selectedUnit && !trackingUnits.some(u => u.id === selectedUnit.id)) {
      setSelectedUnit(null);
    }
  }, [trackingUnits, selectedUnit]);

  // Toggle Transmitir GPS Local desde el navegador/celular del guardia
  const toggleGpsTransmission = () => {
    if (isGpsTransmitting) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsGpsTransmitting(false);
      return;
    }

    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por tu navegador/dispositivo.');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const speedKmH = speed ? Math.round(speed * 3.6) : 0;
        setMyGpsCoords({ lat: latitude, lng: longitude });
        setIsGpsTransmitting(true);

        const myUnit: TrackingUnit = {
          id: 'my-device',
          name: 'Mi Dispositivo (Guardia en Vivo)',
          code: 'GPS-LIVE',
          type: 'guard',
          lat: latitude,
          lng: longitude,
          speed: speedKmH,
          battery: 100,
          status: speedKmH > 3 ? 'moving' : 'active',
          updatedAt: new Date().toISOString()
        };

        // Guardar en Firestore para que la consola central lo vea en tiempo real
        try {
          await setDoc(doc(db, 'active_units', 'my-device'), {
            ...myUnit,
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.warn('Error syncing local GPS position to Firestore:', e);
        }

        // Centrar mapa suavemente la primera vez
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 15, { duration: 0.8 });
        }
      },
      (err) => {
        console.error('Error al capturar GPS:', err);
        alert('No se pudo obtener la posición GPS. Revisa los permisos de ubicación en tu navegador.');
        setIsGpsTransmitting(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current = id;
  };

  const projectStatus = useMemo(() => {
    const days = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const today = days[new Date().getDay()] as keyof NonNullable<Project['requirements']>;
    
    return projects.reduce((acc, project) => {
      const required = project.requirements?.[today] || 0;
      const onSite = registrations.filter(r => r.projectCode?.trim().toUpperCase() === project.code?.trim().toUpperCase()).length;
      
      let status: 'red' | 'yellow' | 'green' = 'red';
      if (onSite >= required && required > 0) status = 'green';
      else if (onSite > 0 && onSite < required) status = 'yellow';
      else if (required === 0) status = 'green';

      acc[project.id] = { status, onSite, required };
      return acc;
    }, {} as Record<string, { status: 'red' | 'yellow' | 'green', onSite: number, required: number }>);
  }, [projects, registrations]);

  // Leaflet Map Initialization centered on Panama
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current || mapRef.current) return;

      leafletLRef.current = L;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        center: PANAMA_CENTER,
        zoom: 12,
        zoomControl: false,
        attributionControl: true
      });

      mapRef.current = map;

      // Setup Tile Layer
      const source = TILE_SOURCES[currentTileSource];
      const tileLayer = L.tileLayer(source.url, {
        attribution: source.attribution,
        subdomains: source.subdomains,
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      tileLayer.on('tileerror', (error: any) => {
        console.warn('[Leaflet Tile Error] Failed to load tile:', error?.url, error);
        setTileErrorCount(prev => prev + 1);
      });

      // Ensure map dimensions settle and call invalidateSize()
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 150);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 500);

      // ResizeObserver for container changes
      const observer = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
      observer.observe(mapContainerRef.current);

      return () => {
        observer.disconnect();
      };
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle Tile Source Change
  const handleTileSourceChange = (newSourceKey: 'cartoDark' | 'osm') => {
    setCurrentTileSource(newSourceKey);
    const L = leafletLRef.current;
    if (mapRef.current && L) {
      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }
      const source = TILE_SOURCES[newSourceKey];
      const newLayer = L.tileLayer(source.url, {
        attribution: source.attribution,
        subdomains: source.subdomains,
        maxZoom: 19
      }).addTo(mapRef.current);

      newLayer.on('tileerror', (error: any) => {
        console.warn('[Leaflet Tile Error] Failed to load tile:', error.url, error);
        setTileErrorCount(prev => prev + 1);
      });

      tileLayerRef.current = newLayer;
      mapRef.current.invalidateSize();
    }
  };

  // Synchronize Project Markers (Puestos) on Map
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletLRef.current;
    if (!map || !L) return;

    // Clear old project markers
    projectMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    projectMarkersRef.current.clear();

    if (!showProjects) return;

    projects.forEach((project) => {
      const coords = getProjectCoords(project);
      const status = projectStatus[project.id]?.status || 'red';
      const isSelected = selectedProject?.id === project.id;
      const badgeColor = status === 'green' ? '#22c55e' : status === 'yellow' ? '#eab308' : '#ef4444';
      
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker-wrapper',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: ${isSelected ? '36px' : '28px'};
              height: ${isSelected ? '36px' : '28px'};
              border-radius: 50%;
              background-color: ${badgeColor};
              border: 2px solid white;
              box-shadow: 0 0 ${isSelected ? '20px' : '10px'} ${badgeColor};
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
            ">
              <svg width="${isSelected ? '18' : '14'}" height="${isSelected ? '18' : '14'}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style="
              margin-top: 4px;
              padding: 2px 8px;
              border-radius: 6px;
              background: rgba(15, 16, 29, 0.95);
              border: 1px solid rgba(255, 255, 255, 0.2);
              color: white;
              font-size: 10px;
              font-weight: 900;
              white-space: nowrap;
              letter-spacing: -0.02em;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            ">${project.code}</div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 25]
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedProject(project);
        setSelectedUnit(null);
        map.flyTo(coords, 14, { duration: 0.8 });
      });

      projectMarkersRef.current.set(project.id, marker);
    });
  }, [projects, projectStatus, selectedProject, showProjects]);

  // Synchronize Tracking Unit Markers (Guardias, Motos, Vehículos) on Map
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletLRef.current;
    if (!map || !L) return;

    // Clear old unit markers
    unitMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    unitMarkersRef.current.clear();

    trackingUnits.forEach((unit) => {
      const isGuard = unit.type === 'guard';
      const isVehicle = unit.type === 'motorcycle' || unit.type === 'patrol' || unit.type === 'supervisor';

      if (isGuard && !showGuards) return;
      if (isVehicle && !showVehicles) return;

      const isSelected = selectedUnit?.id === unit.id;
      const isLiveMyDevice = unit.id === 'my-device';

      let bgGradient = 'linear-gradient(135deg, #3b82f6, #1d4ed8)'; // Guard Blue
      let iconSvg = `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`;

      if (unit.type === 'motorcycle') {
        bgGradient = 'linear-gradient(135deg, #f59e0b, #d97706)'; // Motorcycle Amber
        iconSvg = `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`; // Lightning/Speed
      } else if (unit.type === 'patrol' || unit.type === 'supervisor') {
        bgGradient = 'linear-gradient(135deg, #8b5cf6, #6d28d9)'; // Patrol Purple
        iconSvg = `<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`;
      }

      if (isLiveMyDevice) {
        bgGradient = 'linear-gradient(135deg, #10b981, #059669)'; // Emerald Green
      }

      const customIcon = L.divIcon({
        className: 'custom-unit-marker-wrapper',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: ${isSelected ? '38px' : '30px'};
              height: ${isSelected ? '38px' : '30px'};
              border-radius: 50%;
              background: ${bgGradient};
              border: 2px solid #ffffff;
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.25s ease;
            ">
              <svg width="${isSelected ? '20' : '16'}" height="${isSelected ? '20' : '16'}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                ${iconSvg}
              </svg>
            </div>
            ${unit.speed && unit.speed > 0 ? `
              <div style="
                position: absolute;
                top: -6px;
                right: -6px;
                background: #ef4444;
                color: white;
                font-size: 8px;
                font-weight: 900;
                padding: 1px 4px;
                border-radius: 8px;
                border: 1px solid white;
              ">${unit.speed} km/h</div>
            ` : ''}
            <div style="
              margin-top: 4px;
              padding: 2px 6px;
              border-radius: 6px;
              background: rgba(10, 11, 20, 0.95);
              border: 1px solid ${isLiveMyDevice ? '#10b981' : 'rgba(59, 130, 246, 0.4)'};
              color: white;
              font-size: 9px;
              font-weight: 800;
              white-space: nowrap;
              box-shadow: 0 4px 10px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${isLiveMyDevice ? '#10b981' : '#3b82f6'}; display: inline-block;"></span>
              ${unit.code || unit.name}
            </div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 25]
      });

      const marker = L.marker([unit.lat, unit.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedUnit(unit);
        setSelectedProject(null);
        map.flyTo([unit.lat, unit.lng], 15, { duration: 0.8 });
      });

      unitMarkersRef.current.set(unit.id, marker);
    });
  }, [trackingUnits, showGuards, showVehicles, selectedUnit]);

  // Fit Bounds to Panama and all active elements
  const handleFitPanamaBounds = () => {
    const map = mapRef.current;
    const L = leafletLRef.current;
    if (!map || !L) return;

    const bounds = L.latLngBounds([]);

    // Add projects
    projects.forEach((p) => {
      bounds.extend(getProjectCoords(p));
    });

    // Add active tracking units
    trackingUnits.forEach((u) => {
      bounds.extend([u.lat, u.lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    } else {
      map.flyTo(PANAMA_CENTER, 12, { duration: 0.8 });
    }
  };

  // Center or Reset Zoom
  const handleRecenter = () => {
    if (!mapRef.current) return;
    if (selectedProject) {
      const coords = getProjectCoords(selectedProject);
      mapRef.current.flyTo(coords, 14, { duration: 0.8 });
    } else if (selectedUnit) {
      mapRef.current.flyTo([selectedUnit.lat, selectedUnit.lng], 15, { duration: 0.8 });
    } else {
      handleFitPanamaBounds();
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedUnit(null);
    if (mapRef.current) {
      const coords = getProjectCoords(project);
      mapRef.current.flyTo(coords, 14, { duration: 0.8 });
    }
  };

  const handleSelectUnit = (unit: TrackingUnit) => {
    setSelectedUnit(unit);
    setSelectedProject(null);
    if (mapRef.current) {
      mapRef.current.flyTo([unit.lat, unit.lng], 15, { duration: 0.8 });
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnits = trackingUnits.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusText = (projectId: string) => {
    const s = projectStatus[projectId]?.status;
    if (s === 'green') return 'CUBIERTO';
    if (s === 'yellow') return 'POR CUBRIR';
    return 'SIN CUBRIR';
  };

  const activeGuardsCount = trackingUnits.filter(u => u.type === 'guard').length;
  const activeVehiclesCount = trackingUnits.filter(u => u.type === 'motorcycle' || u.type === 'patrol' || u.type === 'supervisor').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5">
              Panamá GPS Live Tracking
            </Badge>
            {isGpsTransmitting && (
              <Badge className="bg-emerald-500 text-white font-black text-[9px] animate-pulse px-2.5 py-0.5">
                • Transmitiendo GPS
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Mapa Operativo</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Geolocalización y monitoreo de puestos, guardias y motos en Panamá</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status indicators */}
          <div className="flex items-center gap-3 bg-[#1a1b2e] px-3.5 py-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Sin Cubrir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Por Cubrir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Cubierto</span>
            </div>
          </div>

          {/* Map Tile Switcher */}
          <div className="flex items-center gap-1.5 bg-[#1a1b2e] p-1 rounded-xl border border-white/5">
            <Button
              size="sm"
              variant={currentTileSource === 'cartoDark' ? 'default' : 'ghost'}
              onClick={() => handleTileSourceChange('cartoDark')}
              className="text-[10px] font-black uppercase h-7 px-3 rounded-lg"
            >
              CARTO Dark
            </Button>
            <Button
              size="sm"
              variant={currentTileSource === 'osm' ? 'default' : 'ghost'}
              onClick={() => handleTileSourceChange('osm')}
              className="text-[10px] font-black uppercase h-7 px-3 rounded-lg"
            >
              OSM Standard
            </Button>
          </div>

          {/* Local GPS Transmitter Button */}
          <Button
            size="sm"
            onClick={toggleGpsTransmission}
            className={`text-[10px] font-black uppercase h-9 px-4 rounded-xl shadow-lg transition-all ${
              isGpsTransmitting 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 mr-1.5" />
            {isGpsTransmitting ? 'GPS Activo (Transmitiendo)' : 'Activar GPS Móvil'}
          </Button>
        </div>
      </div>

      {/* Layer Toggles Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-[#1a1b2e] px-5 py-3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-xs font-black uppercase tracking-wider text-white">Capas de Monitoreo:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={showProjects ? 'default' : 'outline'}
            onClick={() => setShowProjects(!showProjects)}
            className="text-[10px] font-black uppercase h-7 px-3 rounded-lg border-white/10"
          >
            <Building2 className="h-3 w-3 mr-1" />
            Puestos ({projects.length})
          </Button>

          <Button
            size="sm"
            variant={showGuards ? 'default' : 'outline'}
            onClick={() => setShowGuards(!showGuards)}
            className="text-[10px] font-black uppercase h-7 px-3 rounded-lg border-white/10"
          >
            <User className="h-3 w-3 mr-1 text-blue-400" />
            Guardias GPS ({activeGuardsCount})
          </Button>

          <Button
            size="sm"
            variant={showVehicles ? 'default' : 'outline'}
            onClick={() => setShowVehicles(!showVehicles)}
            className="text-[10px] font-black uppercase h-7 px-3 rounded-lg border-white/10"
          >
            <Bike className="h-3 w-3 mr-1 text-amber-400" />
            Vehículos / Motos ({activeVehiclesCount})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleFitPanamaBounds}
            className="text-[10px] font-black uppercase h-7 px-3 rounded-lg text-primary hover:bg-primary/10"
          >
            <Crosshair className="h-3 w-3 mr-1" />
            Ajustar a Panamá
          </Button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Sidebar Lista de Puestos y Unidades GPS */}
        <div className="lg:col-span-3 bg-[#1a1b2e] border border-white/5 rounded-3xl p-6 flex flex-col space-y-5 overflow-hidden">
          <div className="space-y-3">
            <div className="relative">
              <Input 
                placeholder="Buscar puesto o unidad..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0f101d] border-none h-11 pl-11 rounded-xl text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {/* Seccion Puestos */}
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-primary" /> Puestos Panamá
                </span>
                <span className="text-[10px] font-black text-primary">{filteredProjects.length}</span>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 opacity-50">
                    <Activity className="h-5 w-5 animate-pulse text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-tighter">Cargando puestos...</p>
                  </div>
                ) : filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleSelectProject(project)}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all duration-300 border ${
                        selectedProject?.id === project.id 
                          ? 'bg-primary/10 border-primary/40 shadow-lg' 
                          : 'bg-[#25273c] border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          projectStatus[project.id]?.status === 'green' ? 'bg-green-500/20 text-green-500' :
                          projectStatus[project.id]?.status === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{project.code}</p>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${
                              projectStatus[project.id]?.status === 'green' ? 'bg-green-500 text-white' :
                              projectStatus[project.id]?.status === 'yellow' ? 'bg-yellow-500 text-black' :
                              'bg-red-500 text-white'
                            }`}>
                              {projectStatus[project.id]?.onSite}/{projectStatus[project.id]?.required}
                            </span>
                          </div>
                          <p className="text-xs font-bold truncate text-white">{project.name}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] italic text-muted-foreground text-center py-2">No hay puestos coincidentes</p>
                )}
              </div>
            </div>

            {/* Seccion Unidades GPS / Rastreo en Vivo */}
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Radio className="h-3 w-3 text-emerald-400 animate-pulse" /> GPS Rastreables
                </span>
                <span className="text-[10px] font-black text-emerald-400">{filteredUnits.length}</span>
              </div>

              <div className="space-y-2">
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => handleSelectUnit(unit)}
                      className={`w-full text-left p-3 rounded-2xl transition-all duration-300 border ${
                        selectedUnit?.id === unit.id 
                          ? 'bg-blue-500/10 border-blue-500/40 shadow-lg' 
                          : 'bg-[#25273c] border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          unit.type === 'guard' ? 'bg-blue-500/20 text-blue-400' :
                          unit.type === 'motorcycle' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {unit.type === 'guard' ? <User className="h-4 w-4" /> :
                           unit.type === 'motorcycle' ? <Bike className="h-4 w-4" /> :
                           <Car className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-white">{unit.code}</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              GPS LIVE
                            </span>
                          </div>
                          <p className="text-xs font-bold text-muted-foreground truncate">{unit.name}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] italic text-muted-foreground text-center py-3">
                    No hay unidades GPS activas
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenedor Principal del Mapa Leaflet */}
        <div className="lg:col-span-9 bg-[#1a1b2e] border border-white/5 rounded-3xl overflow-hidden relative group">
          {/* Div Leaflet */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Controls */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-[400]">
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={handleRecenter}
              title="Centrar mapa en Panamá"
              className="bg-[#25273c]/90 backdrop-blur-md border-white/10 hover:bg-primary hover:text-primary-foreground h-10 w-10 shadow-lg"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.invalidateSize();
                }
              }}
              title="Recalcular dimensiones de mapa"
              className="bg-[#25273c]/90 backdrop-blur-md border-white/10 hover:bg-primary hover:text-primary-foreground h-10 w-10 shadow-lg"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Warning banner for tile errors */}
          {tileErrorCount > 0 && (
            <div className="absolute top-6 left-6 z-[400] bg-red-500/90 text-white px-3 py-1.5 rounded-lg border border-red-300 text-[10px] font-bold flex items-center gap-2 shadow-xl backdrop-blur-md">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Advertencia: {tileErrorCount} petición(es) de tiles fallaron. Puedes alternar a OSM Standard.</span>
            </div>
          )}

          {/* Card Detalle del Proyecto Seleccionado */}
          {selectedProject && (
            <div className="absolute bottom-6 left-6 right-6 z-[400] bg-[#0f101d]/95 border border-primary/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-xl border ${
                    projectStatus[selectedProject.id]?.status === 'green' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                    projectStatus[selectedProject.id]?.status === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                    'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[8px] font-black uppercase px-2 py-0 border-none ${
                        projectStatus[selectedProject.id]?.status === 'green' ? 'bg-green-500 text-white' :
                        projectStatus[selectedProject.id]?.status === 'yellow' ? 'bg-yellow-500 text-black' :
                        'bg-red-500 text-white'
                      }`}>
                        {getStatusText(selectedProject.id)}
                      </Badge>
                      <span className="text-primary font-black text-xs tracking-tighter uppercase">{selectedProject.code}</span>
                    </div>
                    <h3 className="text-xl font-black text-white">{selectedProject.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-red-500" />
                      {selectedProject.location || 'CIUDAD DE PANAMÁ'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-center px-4 border-r border-white/10">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Estado Fuerza</p>
                    <p className={`text-lg font-black ${
                      projectStatus[selectedProject.id]?.status === 'green' ? 'text-green-500' :
                      projectStatus[selectedProject.id]?.status === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {projectStatus[selectedProject.id]?.onSite}/{projectStatus[selectedProject.id]?.required}
                    </p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tipo Servicio</p>
                    <p className="text-lg font-black text-primary">{selectedProject.type?.toUpperCase() || 'GENERAL'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card Detalle de Unidad GPS Seleccionada */}
          {selectedUnit && (
            <div className="absolute bottom-6 left-6 right-6 z-[400] bg-[#0f101d]/95 border border-blue-500/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-xl border ${
                    selectedUnit.type === 'guard' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                    selectedUnit.type === 'motorcycle' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                    'bg-purple-500/20 border-purple-500/30 text-purple-400'
                  }`}>
                    {selectedUnit.type === 'guard' ? <User className="h-8 w-8" /> :
                     selectedUnit.type === 'motorcycle' ? <Bike className="h-8 w-8" /> :
                     <Car className="h-8 w-8" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase border-none px-2 py-0">
                        • TRANSMISIÓN GPS EN VIVO
                      </Badge>
                      <span className="text-blue-400 font-black text-xs tracking-tighter uppercase">{selectedUnit.code}</span>
                    </div>
                    <h3 className="text-xl font-black text-white">{selectedUnit.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                      <Navigation className="h-3.5 w-3.5 text-blue-400" />
                      Lat: {selectedUnit.lat.toFixed(4)}, Lng: {selectedUnit.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-center px-4 border-r border-white/10">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Velocidad</p>
                    <p className="text-lg font-black text-amber-400">{selectedUnit.speed || 0} km/h</p>
                  </div>
                  <div className="text-center px-4 border-r border-white/10">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Batería</p>
                    <p className="text-lg font-black text-emerald-400">{selectedUnit.battery || 100}%</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Puesto Asignado</p>
                    <p className="text-xs font-black text-white uppercase">{selectedUnit.assignedProject || 'PANAMÁ GENERAL'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
