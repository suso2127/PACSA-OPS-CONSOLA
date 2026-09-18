"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
  Layers,
  MoreVertical,
  Trash2,
  Edit2,
  Compass,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Project {
  id: string;
  code: string;
  name: string;
  location: string;
  type: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  mappedAt?: any;
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
  id?: string;
  guardName?: string;
  projectCode?: string;
  projectName?: string;
  projectId?: string;
  status?: string;
  entryTime?: any;
  exitTime?: any;
  operationDate?: string;
  createdAt?: any;
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

  // States for GPS Unit Actions: Editar, Eliminar, Volver a Mapear
  const [editingUnit, setEditingUnit] = useState<TrackingUnit | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    type: 'guard' as 'guard' | 'motorcycle' | 'patrol' | 'supervisor',
    assignedProject: '',
    status: 'active' as 'active' | 'moving' | 'idle' | 'offline',
    battery: 100,
    speed: 0
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<TrackingUnit | null>(null);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);

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

  // Extraer coordenadas GPS del puesto en Firestore (colección 'projects')
  // Solo se considera mapeado si tiene los campos latitude y longitude numéricos válidos
  const getProjectCoords = (project: Project): [number, number] | null => {
    const rawLat = project.latitude !== undefined && project.latitude !== null ? project.latitude : (project as any).lat;
    const rawLng = project.longitude !== undefined && project.longitude !== null ? project.longitude : (project as any).lng;

    if (rawLat === undefined || rawLat === null || rawLng === undefined || rawLng === null) {
      return null;
    }

    const pLat = typeof rawLat === 'number' ? rawLat : parseFloat(String(rawLat));
    const pLng = typeof rawLng === 'number' ? rawLng : parseFloat(String(rawLng));

    if (!isNaN(pLat) && !isNaN(pLng) && pLat !== 0 && pLng !== 0) {
      return [pLat, pLng];
    }

    return null;
  };

  // Puestos con coordenadas GPS registradas en Firestore
  const mappedProjects = useMemo(() => {
    return projects.filter(p => getProjectCoords(p) !== null);
  }, [projects]);

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

    // 2. Escuchar registros de turno en tiempo real desde Firestore colección 'shift-registrations'
    const unsubRegs = onSnapshot(
      collection(db, 'shift-registrations'),
      (snapshot) => {
        const fetched = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as Registration[];
        setRegistrations(fetched);
      },
      (error) => {
        console.warn('Error escuchando shift-registrations en tiempo real:', error);
      }
    );

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

  // Puesto asignado a la transmisión GPS en vivo
  const [assignedProjectName, setAssignedProjectName] = useState<string>('');
  const [currentProjectCode, setCurrentProjectCode] = useState<string>('');

  // Helper: Leer projectCode de sessionStorage 'project-code' y el nombre del puesto de Firestore colección 'projects'
  const getProjectFromSessionAndFirestore = async (): Promise<{ code: string; name: string; docId: string } | null> => {
    let code = (typeof window !== 'undefined' ? sessionStorage.getItem('project-code') : null)?.trim();

    if (!code && selectedProject?.code) {
      code = selectedProject.code;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('project-code', code);
      }
    } else if (!code && projects.length > 0) {
      code = projects[0].code;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('project-code', code);
      }
    }

    if (!code) return null;

    try {
      // 1. Consultar Firestore colección 'projects' por el código
      const q = query(collection(db, 'projects'), where('code', '==', code.toUpperCase()));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const pDoc = snap.docs[0];
        const data = pDoc.data();
        const pName = data.name || code.toUpperCase();
        setAssignedProjectName(pName);
        setCurrentProjectCode(code.toUpperCase());
        return { code: code.toUpperCase(), name: pName, docId: pDoc.id };
      }

      // 2. Consultar por document ID directo en Firestore
      const directRef = doc(db, 'projects', code);
      const directDoc = await getDoc(directRef);
      if (directDoc.exists()) {
        const data = directDoc.data();
        const pName = data.name || code.toUpperCase();
        setAssignedProjectName(pName);
        setCurrentProjectCode(code.toUpperCase());
        return { code: code.toUpperCase(), name: pName, docId: directDoc.id };
      }

      // 3. Fallback en la lista de projects en memoria
      const inMemory = projects.find(p => p.code?.toUpperCase() === code?.toUpperCase() || p.id === code);
      if (inMemory) {
        setAssignedProjectName(inMemory.name);
        setCurrentProjectCode(inMemory.code);
        return { code: inMemory.code, name: inMemory.name, docId: inMemory.id };
      }
    } catch (err) {
      console.warn('Error leyendo puesto desde Firestore:', err);
    }

    return { code: code.toUpperCase(), name: code.toUpperCase(), docId: code };
  };

  // Cargar nombre del puesto desde sessionStorage y Firestore al iniciar o al recibir proyectos
  useEffect(() => {
    getProjectFromSessionAndFirestore();
  }, [projects]);

  // Toggle Transmitir GPS Local desde el navegador/celular del guardia
  const toggleGpsTransmission = async () => {
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

    // Leer el projectCode del sessionStorage 'project-code' y el nombre del puesto de Firestore colección 'projects'
    const initialProj = await getProjectFromSessionAndFirestore();
    const initialName = initialProj?.name || assignedProjectName || 'Puesto Operativo';

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const speedKmH = speed ? Math.round(speed * 3.6) : 0;
        setMyGpsCoords({ lat: latitude, lng: longitude });
        setIsGpsTransmitting(true);

        // 1. Leer el projectCode y el nombre del puesto para la unidad móvil
        const projData = await getProjectFromSessionAndFirestore();
        const realProjectName = projData?.name || initialName || 'Puesto Operativo';
        const postCode = projData?.code || currentProjectCode || 'GPS-LIVE';

        // 2. Transmitir como unidad móvil rastreable en 'active_units' (SIN sobreescribir las coordenadas fijas del puesto en 'projects')
        const myUnit: TrackingUnit = {
          id: 'my-device',
          name: `Guardia GPS (${realProjectName})`,
          code: postCode,
          type: 'guard',
          lat: latitude,
          lng: longitude,
          speed: speedKmH,
          battery: 100,
          status: speedKmH > 3 ? 'moving' : 'active',
          assignedProject: realProjectName,
          updatedAt: new Date().toISOString()
        };

        // Guardar en Firestore para que la consola central lo vea en tiempo real
        try {
          await setDoc(doc(db, 'active_units', 'my-device'), {
            ...myUnit,
            assignedProject: realProjectName,
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.warn('Error syncing local GPS position to Firestore active_units:', e);
        }

        // Mantener la unidad seleccionada para que la tarjeta muestre el nombre real del puesto en 'Puesto Asignado'
        setSelectedUnit(prev => {
          if (!prev || prev.id === 'my-device') {
            return myUnit;
          }
          return prev;
        });

        // Centrar mapa suavemente la primera vez
        if (mapRef.current && !myGpsCoords) {
          mapRef.current.flyTo([latitude, longitude], 15, { duration: 0.8 });
        }
      },
      (err) => {
        console.error('Error al capturar GPS:', err);
        alert('No se pudo obtener la posición GPS. Revisa los permisos de ubicación en tu navegador.');
        setIsGpsTransmitting(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    watchIdRef.current = id;
  };

  // Cálculo en tiempo real de guardias activos por puesto para el día de hoy
  const projectStatus = useMemo(() => {
    const days = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const now = new Date();
    const today = days[now.getDay()] as keyof NonNullable<Project['requirements']>;
    const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const normalize = (val?: string) => (val || '').trim().toUpperCase().replace(/[\s\-_.]+/g, '');

    // 1. Filtrar registros activos del día de hoy
    const activeTodayRegistrations = registrations.filter((r) => {
      // Si ya tiene hora de salida registrada, no está activo
      if (r.exitTime !== null && r.exitTime !== undefined && r.exitTime !== '') {
        return false;
      }

      // Si el status es completado, finalizado o salida, no está activo
      const st = (r.status || '').toString().trim().toLowerCase();
      if (st === 'completado' || st === 'finalizado' || st === 'completo' || st === 'salida' || st === 'inactivo') {
        return false;
      }

      // 2. Verificar que corresponda al día de hoy
      // A) Por operationDate (YYYY-MM-DD)
      if (r.operationDate) {
        const opDate = String(r.operationDate).split('T')[0].trim();
        if (opDate === todayYMD) return true;
      }

      // B) Por entryTime (Timestamp Firestore, Date o número)
      let entryDate: Date | null = null;
      if (r.entryTime?.toDate) {
        entryDate = r.entryTime.toDate();
      } else if (r.entryTime?.seconds) {
        entryDate = new Date(r.entryTime.seconds * 1000);
      } else if (r.entryTime instanceof Date) {
        entryDate = r.entryTime;
      } else if (typeof r.entryTime === 'string') {
        entryDate = new Date(r.entryTime);
      }

      if (entryDate && !isNaN(entryDate.getTime())) {
        const entryYMD = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        if (entryYMD === todayYMD) return true;
      }

      // C) Por createdAt
      let createdDate: Date | null = null;
      if (r.createdAt?.toDate) {
        createdDate = r.createdAt.toDate();
      } else if (r.createdAt?.seconds) {
        createdDate = new Date(r.createdAt.seconds * 1000);
      } else if (r.createdAt instanceof Date) {
        createdDate = r.createdAt;
      }

      if (createdDate && !isNaN(createdDate.getTime())) {
        const createdYMD = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(createdDate.getDate()).padStart(2, '0')}`;
        if (createdYMD === todayYMD) return true;
      }

      // D) Si no contiene campos explícitos de fecha pero no tiene exitTime y está activo, considerarlo del turno actual
      if (!r.operationDate && !r.entryTime && !r.createdAt) {
        return true;
      }

      return false;
    });

    return projects.reduce((acc, project) => {
      const required = Number(
        project.requirements?.[today] ?? 
        (project as any).planilla_semanal?.[today]?.elementos ?? 
        (project as any).planilla_semanal?.[today]?.elms ?? 
        (project as any).requiredGuards ?? 
        0
      );

      const projCode = (project.code || '').trim().toUpperCase();
      const projName = (project.name || '').trim().toUpperCase();
      const normProjCode = normalize(projCode);
      const normProjName = normalize(projName);

      // Buscar registros activos coincidentes para este puesto
      const matchingActiveRegs = activeTodayRegistrations.filter((r) => {
        const regCode = (r.projectCode || '').trim().toUpperCase();
        const regName = (r.projectName || '').trim().toUpperCase();
        const normRegCode = normalize(regCode);
        const normRegName = normalize(regName);

        // Coincidencia por ID de proyecto
        if (r.projectId && project.id && r.projectId === project.id) return true;

        // Coincidencia directa por projectCode
        if (regCode && projCode && regCode === projCode) return true;
        if (normRegCode && normProjCode && normRegCode === normProjCode) return true;

        // Coincidencia de código con nombre o viceversa
        if (normRegCode && normProjName && normRegCode === normProjName) return true;
        if (normRegName && normProjCode && normRegName === normProjCode) return true;
        if (normRegName && normProjName && normRegName === normProjName) return true;

        return false;
      });

      const onSite = matchingActiveRegs.length;
      const activeGuards = matchingActiveRegs.map(r => r.guardName).filter(Boolean) as string[];
      
      let status: 'red' | 'yellow' | 'green' = 'red';
      if (onSite >= required && required > 0) status = 'green';
      else if (onSite > 0 && onSite < required) status = 'yellow';
      else if (required === 0) status = onSite > 0 ? 'green' : 'green';

      acc[project.id] = { status, onSite, required, activeGuards };
      return acc;
    }, {} as Record<string, { status: 'red' | 'yellow' | 'green', onSite: number, required: number, activeGuards: string[] }>);
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

  // Synchronize Project Markers (Puestos Mapeados) on Map
  // Solo se grafican puestos que tienen los campos latitude y longitude en Firestore
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletLRef.current;
    if (!map || !L) return;

    // Clear old project markers
    projectMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    projectMarkersRef.current.clear();

    if (!showProjects) return;

    mappedProjects.forEach((project) => {
      const coords = getProjectCoords(project);
      if (!coords) return; // Solo puestos con coordenadas válidas

      const status = projectStatus[project.id]?.status || 'red';
      const onSite = projectStatus[project.id]?.onSite || 0;
      const required = projectStatus[project.id]?.required || 0;
      const activeGuardsList = projectStatus[project.id]?.activeGuards || [];
      const isSelected = selectedProject?.id === project.id;
      const badgeColor = status === 'green' ? '#22c55e' : status === 'yellow' ? '#eab308' : '#ef4444';
      
      const customIcon = L.divIcon({
        className: 'custom-project-marker-wrapper',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
            <!-- Icono de Puesto / Base Fija -->
            <div style="
              width: ${isSelected ? '38px' : '32px'};
              height: ${isSelected ? '38px' : '32px'};
              border-radius: 10px;
              background-color: #0d1322;
              border: 2px solid ${badgeColor};
              box-shadow: 0 0 ${isSelected ? '22px' : '12px'} ${badgeColor};
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">
              <svg width="${isSelected ? '20' : '16'}" height="${isSelected ? '20' : '16'}" viewBox="0 0 24 24" fill="none" stroke="${badgeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <!-- Etiqueta del Puesto: Nombre, Código y Contador de guardias activos hoy en tiempo real -->
            <div style="
              margin-top: 5px;
              padding: 4px 8px;
              border-radius: 8px;
              background: rgba(13, 19, 34, 0.96);
              border: 1px solid rgba(255, 255, 255, 0.18);
              color: white;
              box-shadow: 0 4px 14px rgba(0,0,0,0.65);
              min-width: 120px;
              max-width: 220px;
              text-align: center;
              backdrop-filter: blur(6px);
            ">
              <div style="display: flex; align-items: center; justify-content: center; gap: 4px; font-weight: 900; font-size: 11px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <span style="overflow: hidden; text-overflow: ellipsis;">${project.name}</span>
                <span style="color: #60a5fa; font-size: 9px; font-family: monospace; background: rgba(59,130,246,0.18); padding: 1px 4px; border-radius: 4px; font-weight: 800;">[${project.code}]</span>
              </div>
              <div style="margin-top: 2px; font-size: 10px; font-weight: 800; color: ${badgeColor}; display: flex; align-items: center; justify-content: center; gap: 3px;">
                <span>🛡️ ${onSite} ${onSite === 1 ? 'guardia' : 'guardias'} en sitio</span>
                ${required > 0 ? `<span style="color: #94a3b8; font-size: 8px;">/ ${required}</span>` : ''}
              </div>
            </div>
          </div>
        `,
        iconSize: [50, 60],
        iconAnchor: [25, 30]
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);

      // Tooltip informativo con nombre, código y guardias activos en tiempo real
      marker.bindTooltip(`
        <div style="font-family: sans-serif; padding: 4px; min-width: 180px;">
          <div style="font-weight: 900; font-size: 13px; color: #ffffff;">${project.name}</div>
          <div style="font-size: 10px; color: #60a5fa; font-weight: 800; font-family: monospace; margin-top: 1px;">CÓDIGO: ${project.code}</div>
          <div style="font-size: 11px; color: ${badgeColor}; font-weight: 900; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
            🛡️ Guardias en sitio hoy: ${onSite} ${required > 0 ? `(Req: ${required})` : ''}
          </div>
          ${activeGuardsList.length > 0 ? `
            <div style="margin-top: 3px; font-size: 9px; color: #cbd5e1; max-height: 50px; overflow-y: auto;">
              <span style="color: #94a3b8; font-weight: 700;">En turno activo:</span> ${activeGuardsList.join(', ')}
            </div>
          ` : '<div style="margin-top: 3px; font-size: 9px; color: #94a3b8; font-style: italic;">Sin guardias activos hoy</div>'}
          ${project.location ? `<div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">📍 ${project.location}</div>` : ''}
          <div style="font-size: 8px; color: #64748b; margin-top: 3px; font-family: monospace;">GPS: ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}</div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -25],
        opacity: 0.98
      });

      marker.on('click', () => {
        setSelectedProject(project);
        setSelectedUnit(null);
        map.flyTo(coords, 14, { duration: 0.8 });
      });

      projectMarkersRef.current.set(project.id, marker);
    });
  }, [mappedProjects, projectStatus, selectedProject, showProjects]);

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

    // Add mapped projects only
    mappedProjects.forEach((p) => {
      const coords = getProjectCoords(p);
      if (coords) bounds.extend(coords);
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
      if (coords) {
        mapRef.current.flyTo(coords, 14, { duration: 0.8 });
      } else {
        handleFitPanamaBounds();
      }
    } else if (selectedUnit) {
      mapRef.current.flyTo([selectedUnit.lat, selectedUnit.lng], 15, { duration: 0.8 });
    } else {
      handleFitPanamaBounds();
    }
  };

  const getResolvedProjectName = (assigned?: string) => {
    if (!assigned) return assignedProjectName || 'PANAMÁ GENERAL';
    const match = projects.find(
      p => p.code?.toUpperCase() === assigned.toUpperCase() ||
           p.name?.toUpperCase() === assigned.toUpperCase() ||
           p.id === assigned
    );
    return match?.name || assigned;
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedUnit(null);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('project-code', project.code);
    }
    setAssignedProjectName(project.name);
    setCurrentProjectCode(project.code);
    const coords = getProjectCoords(project);
    if (mapRef.current && coords) {
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

  // Accion: Volver a mapear (Centrar, enfocar y actualizar posicion en tiempo real en el mapa)
  const handleRemapUnit = (unit: TrackingUnit) => {
    setSelectedUnit(unit);
    setSelectedProject(null);
    if (mapRef.current) {
      mapRef.current.invalidateSize();
      mapRef.current.flyTo([unit.lat, unit.lng], 17, {
        animate: true,
        duration: 1.2
      });

      // Si existe el marcador en Leaflet, abrir su tooltip
      const marker = unitMarkersRef.current.get(unit.id);
      if (marker && marker.openTooltip) {
        marker.openTooltip();
      }
    }
  };

  // Accion: Editar unidad GPS
  const handleOpenEditUnit = (unit: TrackingUnit) => {
    setEditingUnit(unit);
    setEditFormData({
      name: unit.name || '',
      code: unit.code || '',
      type: unit.type || 'guard',
      assignedProject: unit.assignedProject || '',
      status: unit.status || 'active',
      battery: unit.battery ?? 100,
      speed: unit.speed ?? 0
    });
  };

  const handleSaveEditUnit = async () => {
    if (!editingUnit) return;
    setIsSavingEdit(true);
    try {
      const unitRef = doc(db, 'active_units', editingUnit.id);
      await updateDoc(unitRef, {
        name: editFormData.name,
        code: editFormData.code,
        type: editFormData.type,
        assignedProject: editFormData.assignedProject,
        status: editFormData.status,
        battery: Number(editFormData.battery),
        speed: Number(editFormData.speed),
        updatedAt: serverTimestamp()
      });

      // Actualizar estado local si está seleccionada
      if (selectedUnit?.id === editingUnit.id) {
        setSelectedUnit(prev => prev ? {
          ...prev,
          name: editFormData.name,
          code: editFormData.code,
          type: editFormData.type,
          assignedProject: editFormData.assignedProject,
          status: editFormData.status,
          battery: Number(editFormData.battery),
          speed: Number(editFormData.speed)
        } : null);
      }

      setEditingUnit(null);
    } catch (err) {
      console.error('Error al actualizar unidad GPS:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Accion: Eliminar unidad GPS
  const handleConfirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    setIsDeletingUnit(true);
    try {
      await deleteDoc(doc(db, 'active_units', unitToDelete.id));

      if (selectedUnit?.id === unitToDelete.id) {
        setSelectedUnit(null);
      }

      // Quitar marcador si está presente
      const marker = unitMarkersRef.current.get(unitToDelete.id);
      if (marker && mapRef.current) {
        mapRef.current.removeLayer(marker);
        unitMarkersRef.current.delete(unitToDelete.id);
      }

      setUnitToDelete(null);
    } catch (err) {
      console.error('Error al eliminar unidad GPS:', err);
    } finally {
      setIsDeletingUnit(false);
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
  const totalGuardsOnSite = useMemo(() => {
    return Object.values(projectStatus).reduce((acc, p) => acc + (p.onSite || 0), 0);
  }, [projectStatus]);

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

          {/* Indicador de puesto para transmisión GPS */}
          <div className="hidden sm:flex items-center gap-2 bg-[#151726] border border-white/10 px-3 py-1.5 rounded-xl text-xs">
            <Radio className={`h-3.5 w-3.5 ${isGpsTransmitting ? 'text-emerald-400 animate-pulse' : 'text-muted-foreground'}`} />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Puesto para GPS</span>
              <span className="text-white font-bold text-xs truncate max-w-[190px]">
                {assignedProjectName || currentProjectCode || 'Sin puesto'}
              </span>
            </div>
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
            Puestos Mapeados ({mappedProjects.length}/{projects.length}) • {totalGuardsOnSite} en sitio
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
                            <div className="flex items-center gap-1.5">
                              {getProjectCoords(project) ? (
                                <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  📍 GPS OK
                                </span>
                              ) : (
                                <span className="text-[7px] font-semibold px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                                  Sin GPS
                                </span>
                              )}
                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${
                                projectStatus[project.id]?.status === 'green' ? 'bg-green-500 text-white' :
                                projectStatus[project.id]?.status === 'yellow' ? 'bg-yellow-500 text-black' :
                                'bg-red-500 text-white'
                              }`}>
                                {projectStatus[project.id]?.onSite}/{projectStatus[project.id]?.required}
                              </span>
                            </div>
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
                    <div
                      key={unit.id}
                      onClick={() => handleSelectUnit(unit)}
                      className={`w-full text-left p-3 rounded-2xl transition-all duration-300 border cursor-pointer ${
                        selectedUnit?.id === unit.id 
                          ? 'bg-blue-500/10 border-blue-500/40 shadow-lg' 
                          : 'bg-[#25273c] border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          unit.type === 'guard' ? 'bg-blue-500/20 text-blue-400' :
                          unit.type === 'motorcycle' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {unit.type === 'guard' ? <User className="h-4 w-4" /> :
                           unit.type === 'motorcycle' ? <Bike className="h-4 w-4" /> :
                           <Car className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black text-white truncate">{unit.code}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                GPS LIVE
                              </span>
                              
                              {/* Menú de Acciones: Volver a mapear, Eliminar, Editar */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded-md text-muted-foreground hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                                    title="Acciones"
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                  align="end" 
                                  className="bg-[#1a1b2e] border border-white/10 text-white min-w-[150px] shadow-2xl z-[9999]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleRemapUnit(unit)}
                                    className="text-[10px] font-bold uppercase tracking-wider py-2 cursor-pointer hover:bg-white/5 focus:bg-white/10 text-cyan-400 focus:text-cyan-300"
                                  >
                                    <Compass className="h-3.5 w-3.5 mr-2 text-cyan-400" />
                                    Volver a mapear
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenEditUnit(unit)}
                                    className="text-[10px] font-bold uppercase tracking-wider py-2 cursor-pointer hover:bg-white/5 focus:bg-white/10 text-amber-400 focus:text-amber-300"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 mr-2 text-amber-400" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setUnitToDelete(unit)}
                                    className="text-[10px] font-bold uppercase tracking-wider py-2 cursor-pointer hover:bg-red-500/20 focus:bg-red-500/20 text-red-400 focus:text-red-300"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2 text-red-400" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-muted-foreground truncate">{unit.name}</p>
                        </div>
                      </div>
                    </div>
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
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                        {selectedProject.location || 'CIUDAD DE PANAMÁ'}
                      </p>
                      {getProjectCoords(selectedProject) ? (
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Navigation className="h-2.5 w-2.5" />
                          GPS: {getProjectCoords(selectedProject)![0].toFixed(5)}, {getProjectCoords(selectedProject)![1].toFixed(5)}
                          {selectedProject.mappedAt && (
                            <span className="text-muted-foreground ml-1">
                              • Mapeado
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Sin coordenadas GPS en Firestore (No visible en mapa)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-center px-4 border-r border-white/10">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Guardias en Sitio</p>
                      <p className={`text-lg font-black ${
                        projectStatus[selectedProject.id]?.status === 'green' ? 'text-green-500' :
                        projectStatus[selectedProject.id]?.status === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {projectStatus[selectedProject.id]?.onSite ?? 0}/{projectStatus[selectedProject.id]?.required ?? 0}
                      </p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">
                        {projectStatus[selectedProject.id]?.onSite === 0 ? 'Sin activos' : `${projectStatus[selectedProject.id]?.onSite} activo(s) hoy`}
                      </p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tipo Servicio</p>
                      <p className="text-lg font-black text-primary">{selectedProject.type?.toUpperCase() || 'GENERAL'}</p>
                    </div>
                  </div>

                  {projectStatus[selectedProject.id]?.activeGuards && projectStatus[selectedProject.id]?.activeGuards.length > 0 && (
                    <div className="bg-[#151728] border border-white/10 px-3 py-1.5 rounded-xl text-right max-w-sm">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Guardias con Turno Activo Hoy</p>
                      <p className="text-[11px] font-bold text-emerald-400 truncate">
                        {projectStatus[selectedProject.id].activeGuards.join(', ')}
                      </p>
                    </div>
                  )}
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
                    <p className="text-xs font-black text-white uppercase">
                      {selectedUnit.id === 'my-device' 
                        ? (assignedProjectName || selectedUnit.assignedProject || 'PANAMÁ GENERAL')
                        : (getResolvedProjectName(selectedUnit.assignedProject) || selectedUnit.assignedProject || 'PANAMÁ GENERAL')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Editar Unidad GPS */}
      <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
        <DialogContent className="bg-[#1a1b2e] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Edit2 className="h-4 w-4 text-amber-400" />
              Editar Unidad GPS: {editingUnit?.code}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1.5">
                Código de la Unidad
              </label>
              <Input
                value={editFormData.code}
                onChange={(e) => setEditFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="Ej. GP-008"
                className="bg-[#0f101d] border-white/10 text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1.5">
                Nombre de la Unidad / Guardia
              </label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej. Guardia GPS (CAF RONDING)"
                className="bg-[#0f101d] border-white/10 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1.5">
                  Tipo de Unidad
                </label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-[#0f101d] border border-white/10 rounded-md p-2 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="guard">Guardia</option>
                  <option value="motorcycle">Motocicleta</option>
                  <option value="patrol">Patrulla</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1.5">
                  Estado
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-[#0f101d] border border-white/10 rounded-md p-2 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="active">Activo</option>
                  <option value="moving">En Movimiento</option>
                  <option value="idle">En Espera</option>
                  <option value="offline">Desconectado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1.5">
                Puesto Asignado
              </label>
              <Input
                value={editFormData.assignedProject}
                onChange={(e) => setEditFormData(prev => ({ ...prev, assignedProject: e.target.value }))}
                placeholder="Ej. CAF RONDING o código de puesto"
                className="bg-[#0f101d] border-white/10 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1.5">
                  Batería (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editFormData.battery}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, battery: Number(e.target.value) }))}
                  className="bg-[#0f101d] border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1.5">
                  Velocidad (km/h)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={editFormData.speed}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, speed: Number(e.target.value) }))}
                  className="bg-[#0f101d] border-white/10 text-white text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingUnit(null)}
              className="text-xs font-bold uppercase text-muted-foreground hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditUnit}
              disabled={isSavingEdit}
              className="text-xs font-black uppercase bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Eliminación */}
      <Dialog open={!!unitToDelete} onOpenChange={(open) => !open && setUnitToDelete(null)}>
        <DialogContent className="bg-[#1a1b2e] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black text-red-400">
              <Trash2 className="h-4 w-4 text-red-400" />
              Eliminar Unidad GPS
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground py-2">
            ¿Estás seguro de que deseas eliminar la unidad <span className="font-black text-white">{unitToDelete?.code} ({unitToDelete?.name})</span> del rastreo en tiempo real?
          </p>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUnitToDelete(null)}
              className="text-xs font-bold uppercase text-muted-foreground hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDeleteUnit}
              disabled={isDeletingUnit}
              className="text-xs font-black uppercase bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingUnit ? 'Eliminando...' : 'Eliminar Unidad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
