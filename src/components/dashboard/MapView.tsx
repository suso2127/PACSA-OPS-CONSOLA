"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { 
  Map as MapIcon, 
  MapPin, 
  Building2, 
  Search,
  Crosshair,
  Maximize2,
  Minimize2,
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
  X,
  Satellite,
  Globe,
  Loader2
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
import { cn } from '@/lib/utils';

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

// Interface para búsqueda Nominatim
export interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
}

export type TileSourceKey = 'osm' | 'satellite' | 'cartoDark';

// Códigos de puestos configurables: GP-001 al GP-014
const POST_CODES = Array.from({ length: 14 }, (_, i) => `GP-${String(i + 1).padStart(3, '0')}`);

// Default Center: Panama City, Panama
const PANAMA_CENTER: [number, number] = [8.9824, -79.5199];

// Map Tile Sources con soporte de capa satelital Esri World Imagery gratuita
const TILE_SOURCES: Record<TileSourceKey, {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom?: number;
}> = {
  osm: {
    name: 'Mapa Normal',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19
  },
  satellite: {
    name: 'Vista Satelital (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  },
  cartoDark: {
    name: 'Modo Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }
};

export function MapView() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [trackingUnits, setTrackingUnits] = useState<TrackingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<TrackingUnit | null>(null);
  const [currentTileSource, setCurrentTileSource] = useState<TileSourceKey>('osm');
  const [tileErrorCount, setTileErrorCount] = useState(0);

  // States para Búsqueda de Direcciones con Nominatim
  const [nominatimQuery, setNominatimQuery] = useState('');
  const [nominatimResults, setNominatimResults] = useState<NominatimResult[]>([]);
  const [isSearchingNominatim, setIsSearchingNominatim] = useState(false);
  const [showNominatimResults, setShowNominatimResults] = useState(false);
  const [activeLocationPin, setActiveLocationPin] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchMarkerRef = useRef<any>(null);

  // States y Refs para Asignación de Puesto por Clic en el Mapa
  const [clickedMapCoords, setClickedMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const projectsRef = useRef<Project[]>([]);
  const mapClickPopupRef = useRef<any>(null);

  // States for GPS Unit Actions: Editar, Eliminar, Volver a Mapear
  const [editingUnit, setEditingUnit] = useState<TrackingUnit | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    type: 'guard' as 'guard' | 'motorcycle' | 'patrol' | 'supervisor',
    assignedProject: '',
    status: 'active' as 'active' | 'moving' | 'idle' | 'offline',
    battery: 100,
    speed: 0,
    lat: '',
    lng: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<TrackingUnit | null>(null);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);

  // Layer Visibility Toggles
  const [showProjects, setShowProjects] = useState(true);
  const [showGuards, setShowGuards] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);

  // Fullscreen Mode State & Handlers
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(isFullscreen);
  const toggleFullscreenRef = useRef<() => void>(() => {});

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const nextState = !prev;
      try {
        if (nextState) {
          if (document.fullscreenEnabled && !document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          }
        } else {
          if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          }
        }
      } catch {
        // Fallback gracefully for iframe sandboxes
      }
      return nextState;
    });
  };

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
    toggleFullscreenRef.current = toggleFullscreen;
  }, [isFullscreen]);

  // Tecla ESC para volver al tamaño normal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenRef.current) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sincronizar evento nativo de fullscreen del navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreenRef.current) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Recalcular dimensiones del mapa Leaflet al cambiar a/de pantalla completa
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const timers = [
      setTimeout(() => mapRef.current?.invalidateSize(), 50),
      setTimeout(() => mapRef.current?.invalidateSize(), 150),
      setTimeout(() => mapRef.current?.invalidateSize(), 300),
      setTimeout(() => mapRef.current?.invalidateSize(), 550),
    ];

    return () => {
      document.body.style.overflow = '';
      timers.forEach(clearTimeout);
    };
  }, [isFullscreen]);

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
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectMap = new Map<string, Project>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const code = (data.code || (doc.id.startsWith('GP-') ? doc.id : '') || '').trim().toUpperCase();
        const name = (data.name || data.nombre || '').trim().toUpperCase();
        const key = code || name || doc.id;
        const p = { id: doc.id, ...data, code: code || data.code } as Project;
        if (!projectMap.has(key)) {
          projectMap.set(key, p);
        } else {
          const existing = projectMap.get(key)!;
          if (!existing.planilla_semanal && (p as any).planilla_semanal) {
            projectMap.set(key, p);
          }
        }
      });
      setProjects(Array.from(projectMap.values()));
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

  // Sincronizar projects en ref para los eventos del mapa
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Creador del contenido del popup interactivo al hacer clic en el mapa
  const createMapClickPopup = (
    lat: number,
    lng: number,
    currentProjects: Project[],
    onSave: (code: string, lat: number, lng: number) => Promise<void>
  ) => {
    const container = document.createElement('div');
    container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.style.padding = '4px';
    container.style.color = '#f8fafc';
    container.style.minWidth = '250px';

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <span style="background: #2563eb; color: #fff; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em;">PACSA GPS</span>
        <span style="font-size: 10px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Guardar Puesto</span>
      </div>
      <div style="background: #090a14; padding: 6px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 8px; font-family: monospace; font-size: 11px; color: #38bdf8; line-height: 1.3;">
        <div><strong>Lat:</strong> ${lat.toFixed(6)}</div>
        <div><strong>Lng:</strong> ${lng.toFixed(6)}</div>
      </div>
      <label style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">
        Código del Puesto (GP-001 al GP-014):
      </label>
    `;

    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.background = '#151726';
    select.style.color = '#ffffff';
    select.style.border = '1px solid rgba(255,255,255,0.2)';
    select.style.borderRadius = '6px';
    select.style.padding = '6px 8px';
    select.style.fontSize = '11px';
    select.style.fontWeight = '700';
    select.style.marginBottom = '10px';
    select.style.outline = 'none';

    POST_CODES.forEach((code) => {
      const p = currentProjects.find(item => item.code?.toUpperCase() === code);
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = p?.name ? `${code} - ${p.name}` : `${code}`;
      select.appendChild(opt);
    });
    container.appendChild(select);

    const btn = document.createElement('button');
    btn.textContent = 'Guardar ubicación del puesto';
    btn.style.width = '100%';
    btn.style.background = '#2563eb';
    btn.style.color = '#ffffff';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.padding = '8px 10px';
    btn.style.fontSize = '11px';
    btn.style.fontWeight = '800';
    btn.style.textTransform = 'uppercase';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.4)';
    btn.style.transition = 'all 0.2s ease';

    btn.onmouseover = () => { btn.style.background = '#1d4ed8'; };
    btn.onmouseout = () => { btn.style.background = '#2563eb'; };

    btn.onclick = async (e) => {
      e.stopPropagation();
      btn.disabled = true;
      btn.textContent = 'Guardando en Firestore...';
      btn.style.opacity = '0.7';
      try {
        await onSave(select.value, lat, lng);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Guardar ubicación del puesto';
        btn.style.opacity = '1';
      }
    };
    container.appendChild(btn);

    return container;
  };

  // Guardar ubicación del puesto en Firestore colección 'projects'
  const handleSavePostLocation = async (code: string, lat: number, lng: number) => {
    try {
      const latNum = parseFloat(lat.toFixed(6));
      const lngNum = parseFloat(lng.toFixed(6));
      const formattedCode = code.toUpperCase().trim();

      // 1. Buscar en Firestore colección 'projects' por el campo 'code'
      const q = query(collection(db, 'projects'), where('code', '==', formattedCode));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const pData = docSnap.data();
        const targetDocRef = doc(db, 'projects', docSnap.id);

        await updateDoc(targetDocRef, {
          latitude: latNum,
          longitude: lngNum,
          mappedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        toast({
          title: "UBICACIÓN GUARDADA",
          description: `Puesto ${formattedCode} (${pData.name || 'Puesto'}) asignado a [${latNum}, ${lngNum}].`
        });
      } else {
        // 2. Si no existe documento con ese código, crearlo en Firestore
        await addDoc(collection(db, 'projects'), {
          code: formattedCode,
          name: `PUESTO ${formattedCode}`,
          location: 'Panamá',
          latitude: latNum,
          longitude: lngNum,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          mappedAt: serverTimestamp()
        });

        toast({
          title: "PUESTO CREADO Y GUARDADO",
          description: `Nuevo puesto ${formattedCode} registrado y asignado a [${latNum}, ${lngNum}].`
        });
      }

      if (mapRef.current) {
        mapRef.current.closePopup();
      }
      setClickedMapCoords(null);
    } catch (err: any) {
      console.error("Error guardando ubicación en Firestore:", err);
      toast({
        title: "ERROR AL GUARDAR",
        description: err.message || "No se pudo guardar la ubicación del puesto.",
        variant: "destructive"
      });
      throw err;
    }
  };

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
      const tileOptions: any = {
        attribution: source.attribution,
        maxZoom: source.maxZoom || 19
      };
      if (source.subdomains) {
        tileOptions.subdomains = source.subdomains;
      }
      const tileLayer = L.tileLayer(source.url, tileOptions).addTo(map);

      tileLayerRef.current = tileLayer;

      tileLayer.on('tileerror', (error: any) => {
        console.warn('[Leaflet Tile Error] Failed to load tile:', error?.url, error);
        setTileErrorCount(prev => prev + 1);
      });

      // Evento de clic en el mapa para expandir a pantalla completa o volver al tamaño normal
      map.on('click', () => {
        toggleFullscreenRef.current();
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
      if (searchMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(searchMarkerRef.current);
        searchMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Cerrar dropdown de Nominatim al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowNominatimResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle Tile Source Change (Mapa Normal / Vista Satelital Esri / Modo Oscuro)
  const handleTileSourceChange = (newSourceKey: TileSourceKey) => {
    setCurrentTileSource(newSourceKey);
    const L = leafletLRef.current;
    if (mapRef.current && L) {
      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }
      const source = TILE_SOURCES[newSourceKey];
      const tileOptions: any = {
        attribution: source.attribution,
        maxZoom: source.maxZoom || 19
      };
      if (source.subdomains) {
        tileOptions.subdomains = source.subdomains;
      }
      const newLayer = L.tileLayer(source.url, tileOptions).addTo(mapRef.current);

      newLayer.on('tileerror', (error: any) => {
        console.warn('[Leaflet Tile Error] Failed to load tile:', error.url, error);
        setTileErrorCount(prev => prev + 1);
      });

      tileLayerRef.current = newLayer;
      mapRef.current.invalidateSize();
    }
  };

  // Buscar ubicaciones con Nominatim de OpenStreetMap
  const handleNominatimSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : nominatimQuery).trim();
    if (!q) {
      setNominatimResults([]);
      setShowNominatimResults(false);
      return;
    }

    setIsSearchingNominatim(true);
    setShowNominatimResults(true);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error en Nominatim: ${response.status}`);
      }

      const data: NominatimResult[] = await response.json();
      setNominatimResults(data);
      if (data.length === 0) {
        toast({
          title: "SIN RESULTADOS",
          description: `No se encontraron resultados para "${q}". Intenta con otra dirección o punto de referencia.`
        });
      }
    } catch (error) {
      console.error("Error al buscar en Nominatim:", error);
      toast({
        title: "ERROR DE BÚSQUEDA",
        description: "No se pudo conectar con el servicio Nominatim de OpenStreetMap.",
        variant: "destructive"
      });
    } finally {
      setIsSearchingNominatim(false);
    }
  };

  // Centrar el mapa en la ubicación encontrada con pin marcador
  const handleSelectNominatimLocation = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (isNaN(lat) || isNaN(lon)) return;

    const map = mapRef.current;
    const L = leafletLRef.current;
    if (!map || !L) return;

    // Remover pin previo de búsqueda
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    // Centrar mapa suavemente
    map.setView([lat, lon], 17, { animate: true });

    // Crear pin marcador distintivo
    const searchPinIcon = L.divIcon({
      className: 'nominatim-search-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 44px; height: 44px; background-color: rgba(37, 99, 235, 0.4); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 34px; height: 34px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.6);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22]
    });

    const marker = L.marker([lat, lon], { icon: searchPinIcon }).addTo(map);
    const shortTitle = result.display_name.split(',')[0] || 'Ubicación';

    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 260px;">
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
          <span style="background: #2563eb; color: #fff; font-size: 8px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Nominatim OSM</span>
        </div>
        <div style="font-weight: 800; font-size: 13px; color: #f8fafc; margin-bottom: 4px; line-height: 1.2;">
          ${shortTitle}
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px; line-height: 1.3;">
          ${result.display_name}
        </div>
        <div style="font-size: 10px; color: #38bdf8; font-family: monospace; background: rgba(0,0,0,0.4); padding: 4px 6px; border-radius: 4px;">
          Lat: ${lat.toFixed(5)}, Lng: ${lon.toFixed(5)}
        </div>
      </div>
    `).openPopup();

    searchMarkerRef.current = marker;
    setActiveLocationPin({
      name: result.display_name,
      lat,
      lng: lon
    });
    setShowNominatimResults(false);

    toast({
      title: "UBICACIÓN ENCONTRADA",
      description: `Mapa centrado en: ${shortTitle}`
    });
  };

  // Limpiar búsqueda y remover pin del mapa
  const handleClearNominatimSearch = () => {
    setNominatimQuery('');
    setNominatimResults([]);
    setShowNominatimResults(false);
    if (searchMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }
    setActiveLocationPin(null);
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

      marker.on('click', (e: any) => {
        if (e && e.originalEvent) {
          L.DomEvent.stopPropagation(e.originalEvent);
        }
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

      marker.on('click', (e: any) => {
        if (e && e.originalEvent) {
          L.DomEvent.stopPropagation(e.originalEvent);
        }
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
      speed: unit.speed ?? 0,
      lat: (typeof unit.lat === 'number' && !isNaN(unit.lat)) ? String(unit.lat) : '',
      lng: (typeof unit.lng === 'number' && !isNaN(unit.lng)) ? String(unit.lng) : ''
    });
  };

  const handleSaveEditUnit = async () => {
    if (!editingUnit) return;

    const latRaw = (editFormData.lat || '').toString().trim();
    const lngRaw = (editFormData.lng || '').toString().trim();

    const parsedLat = parseFloat(latRaw);
    const parsedLng = parseFloat(lngRaw);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      toast({
        variant: "destructive",
        title: "COORDENADAS INVÁLIDAS",
        description: "Ingrese valores numéricos válidos para Latitud y Longitud (Ej: 8.9824, -79.5199)."
      });
      return;
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      toast({
        variant: "destructive",
        title: "COORDENADAS FUERA DE RANGO",
        description: "La Latitud debe estar entre -90 y 90, y la Longitud entre -180 y 180."
      });
      return;
    }

    setIsSavingEdit(true);
    try {
      const unitRef = doc(db, 'active_units', editingUnit.id);
      const updatePayload = {
        name: editFormData.name.trim(),
        code: editFormData.code.trim().toUpperCase(),
        type: editFormData.type,
        assignedProject: editFormData.assignedProject.trim(),
        status: editFormData.status,
        battery: Number(editFormData.battery) || 0,
        speed: Number(editFormData.speed) || 0,
        lat: parsedLat,
        lng: parsedLng,
        updatedAt: serverTimestamp()
      };

      await updateDoc(unitRef, updatePayload);

      // Actualizar estado local si está seleccionada
      if (selectedUnit?.id === editingUnit.id) {
        setSelectedUnit(prev => prev ? {
          ...prev,
          name: updatePayload.name,
          code: updatePayload.code,
          type: updatePayload.type,
          assignedProject: updatePayload.assignedProject,
          status: updatePayload.status,
          battery: updatePayload.battery,
          speed: updatePayload.speed,
          lat: parsedLat,
          lng: parsedLng
        } : null);
      }

      // Si el marcador Leaflet existe, reubicar su posición en el mapa
      const marker = unitMarkersRef.current.get(editingUnit.id);
      if (marker && marker.setLatLng) {
        marker.setLatLng([parsedLat, parsedLng]);
      }

      toast({
        title: "UNIDAD ACTUALIZADA",
        description: `Unidad ${updatePayload.code} guardada con éxito.`
      });

      setEditingUnit(null);
    } catch (err: any) {
      console.error('Error al actualizar unidad GPS:', err);
      toast({
        variant: "destructive",
        title: "ERROR AL GUARDAR",
        description: err?.message || "Ocurrió un error al actualizar la unidad."
      });
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
          <div className="flex items-center gap-1 bg-[#1a1b2e] p-1 rounded-xl border border-white/10 shadow-md">
            <Button
              size="sm"
              variant={currentTileSource === 'osm' ? 'default' : 'ghost'}
              onClick={() => handleTileSourceChange('osm')}
              className={`text-[10px] font-black uppercase h-7 px-2.5 rounded-lg flex items-center gap-1 ${
                currentTileSource === 'osm' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-white'
              }`}
              title="Capa estándar OpenStreetMap"
            >
              <Globe className="h-3 w-3" />
              Normal
            </Button>
            <Button
              size="sm"
              variant={currentTileSource === 'satellite' ? 'default' : 'ghost'}
              onClick={() => handleTileSourceChange('satellite')}
              className={`text-[10px] font-black uppercase h-7 px-2.5 rounded-lg flex items-center gap-1 ${
                currentTileSource === 'satellite' ? 'bg-blue-600 text-white shadow' : 'text-muted-foreground hover:text-white'
              }`}
              title="Vista Satelital gratuita con Esri World Imagery"
            >
              <Satellite className="h-3 w-3 text-cyan-300" />
              Satelital
            </Button>
            <Button
              size="sm"
              variant={currentTileSource === 'cartoDark' ? 'default' : 'ghost'}
              onClick={() => handleTileSourceChange('cartoDark')}
              className={`text-[10px] font-black uppercase h-7 px-2.5 rounded-lg flex items-center gap-1 ${
                currentTileSource === 'cartoDark' ? 'bg-slate-700 text-white shadow' : 'text-muted-foreground hover:text-white'
              }`}
              title="Modo Oscuro CARTO"
            >
              <MapIcon className="h-3 w-3" />
              Oscuro
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

          <Button
            size="sm"
            variant={isFullscreen ? 'default' : 'outline'}
            onClick={toggleFullscreen}
            className={cn(
              "text-[10px] font-black uppercase h-7 px-3 rounded-lg border-white/10 transition-all cursor-pointer",
              isFullscreen 
                ? "bg-cyan-500 text-black hover:bg-cyan-400 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                : "text-cyan-400 hover:text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/40"
            )}
            title={isFullscreen ? "Salir de pantalla completa (ESC)" : "Expandir mapa a pantalla completa"}
          >
            {isFullscreen ? <Minimize2 className="h-3 w-3 mr-1" /> : <Maximize2 className="h-3 w-3 mr-1" />}
            {isFullscreen ? "Salir de Pantalla Completa (ESC)" : "Pantalla Completa"}
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
                                    onSelect={() => {
                                      setTimeout(() => handleOpenEditUnit(unit), 50);
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-wider py-2 cursor-pointer hover:bg-white/5 focus:bg-white/10 text-amber-400 focus:text-amber-300"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 mr-2 text-amber-400" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setTimeout(() => setUnitToDelete(unit), 50);
                                    }}
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
        <div 
          className={cn(
            "transition-all duration-300 relative group overflow-hidden",
            isFullscreen 
              ? "fixed inset-0 z-[99999] w-screen h-screen bg-[#0b0c16] rounded-none border-none m-0 p-0" 
              : "lg:col-span-9 bg-[#1a1b2e] border border-white/5 rounded-3xl h-[720px] lg:h-full"
          )}
        >
          {/* Div Leaflet */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Campo de Búsqueda de Ubicaciones con Nominatim de OpenStreetMap */}
          <div 
            ref={searchBoxRef} 
            className="absolute top-4 left-4 z-[400] w-72 sm:w-96 max-w-[calc(100%-120px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative shadow-2xl">
              <div className="relative flex items-center bg-[#151726]/95 border border-white/15 rounded-2xl backdrop-blur-md overflow-hidden focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search className="h-4 w-4 text-primary ml-3.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar dirección en Panamá (Nominatim)..."
                  value={nominatimQuery}
                  onChange={(e) => setNominatimQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNominatimSearch();
                    }
                  }}
                  onFocus={() => {
                    if (nominatimResults.length > 0) setShowNominatimResults(true);
                  }}
                  className="w-full bg-transparent border-none py-2.5 px-3 text-xs text-white placeholder:text-muted-foreground/70 focus:outline-none"
                />
                {isSearchingNominatim ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin mr-3 shrink-0" />
                ) : nominatimQuery ? (
                  <button
                    type="button"
                    onClick={handleClearNominatimSearch}
                    className="p-1 mr-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/10"
                    title="Limpiar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleNominatimSearch()}
                  disabled={isSearchingNominatim || !nominatimQuery.trim()}
                  className="h-8 px-3 mr-1 bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase rounded-xl shrink-0"
                >
                  Buscar
                </Button>
              </div>

              {/* Resultados de Búsqueda Nominatim */}
              {showNominatimResults && nominatimResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#151726]/95 border border-white/15 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-white/5 text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Resultados OpenStreetMap Nominatim</span>
                    <span className="text-primary">{nominatimResults.length} encontrados</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {nominatimResults.map((item) => (
                      <button
                        key={item.place_id}
                        type="button"
                        onClick={() => handleSelectNominatimLocation(item)}
                        className="w-full text-left p-2.5 hover:bg-white/10 transition-colors flex items-start gap-2.5 group"
                      >
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {item.display_name.split(',')[0]}
                          </p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {item.display_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Banner Orientativo Pantalla Completa */}
            <div className="mt-2 hidden sm:flex items-center gap-1.5 bg-[#0b0c16]/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[9px] text-slate-300 shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span>Haz clic en el mapa o en el botón para <strong>Pantalla Completa</strong></span>
            </div>
          </div>

          {/* Indicador Flotante Superior en Pantalla Completa */}
          {isFullscreen && (
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[450] animate-in fade-in slide-in-from-top-3 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#151726]/95 border border-cyan-500/50 text-cyan-300 text-xs font-black uppercase tracking-wider shadow-2xl backdrop-blur-md hover:bg-cyan-950/90 hover:border-cyan-400 hover:text-white transition-all cursor-pointer group"
                title="Salir de pantalla completa (o presiona ESC o haz clic en el mapa)"
              >
                <Minimize2 className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Salir de Pantalla Completa</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-mono border border-white/20">ESC</span>
              </button>
            </div>
          )}

          {/* Filtros Flotantes en Pantalla Completa */}
          {isFullscreen && (
            <div 
              className="absolute top-4 right-20 z-[400] hidden md:flex items-center gap-2 bg-[#151726]/90 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant={showGuards ? 'default' : 'ghost'}
                onClick={() => setShowGuards(!showGuards)}
                className="text-[9px] font-black uppercase h-7 px-2.5 rounded-xl cursor-pointer"
              >
                <User className="h-3 w-3 mr-1 text-blue-400" />
                Guardias ({activeGuardsCount})
              </Button>
              <Button
                size="sm"
                variant={showVehicles ? 'default' : 'ghost'}
                onClick={() => setShowVehicles(!showVehicles)}
                className="text-[9px] font-black uppercase h-7 px-2.5 rounded-xl cursor-pointer"
              >
                <Bike className="h-3 w-3 mr-1 text-amber-400" />
                Vehículos ({activeVehiclesCount})
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFitPanamaBounds}
                className="text-[9px] font-black uppercase h-7 px-2.5 rounded-xl text-primary hover:bg-primary/10 cursor-pointer"
              >
                <Crosshair className="h-3 w-3 mr-1" />
                Ajustar
              </Button>
            </div>
          )}

          {/* Floating Controls */}
          <div 
            className="absolute top-6 right-6 flex flex-col gap-2 z-[400]"
            onClick={(e) => e.stopPropagation()}
          >
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={(e) => {
                e.stopPropagation();
                handleRecenter();
              }}
              title="Centrar mapa en Panamá"
              className="bg-[#25273c]/90 backdrop-blur-md border-white/10 hover:bg-primary hover:text-primary-foreground h-10 w-10 shadow-lg cursor-pointer"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
            
            {/* Botón Pantalla Completa */}
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              title={isFullscreen ? "Salir de pantalla completa (ESC)" : "Pantalla completa"}
              className={cn(
                "backdrop-blur-md border h-10 w-10 shadow-xl transition-all duration-300 cursor-pointer",
                isFullscreen 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 hover:text-white" 
                  : "bg-[#25273c]/90 text-cyan-400 border-cyan-500/40 hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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
            <div 
              className="absolute bottom-6 left-6 right-6 z-[400] bg-[#0f101d]/95 border border-primary/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 cursor-pointer"
                title="Cerrar detalle"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-6">
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
            <div 
              className="absolute bottom-6 left-6 right-6 z-[400] bg-[#0f101d]/95 border border-blue-500/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 cursor-pointer"
                title="Cerrar detalle"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-6">
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
      <Dialog 
        open={!!editingUnit} 
        onOpenChange={(open) => {
          if (!isSavingEdit && !open) {
            setEditingUnit(null);
          }
        }}
      >
        <DialogContent className="bg-[#1a1b2e] border-white/10 text-white max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-white/10">
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Edit2 className="h-4 w-4 text-amber-400" />
              Editar Unidad GPS: {editingUnit?.code}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-5 overflow-y-auto max-h-[calc(90vh-130px)]">
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

            {/* Coordenadas GPS (Latitud y Longitud) */}
            <div className="grid grid-cols-2 gap-3 bg-[#0f101d] p-3.5 rounded-xl border border-white/10">
              <div>
                <label className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  Latitud
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.lat}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, lat: e.target.value }))}
                  placeholder="Ej. 8.982400"
                  className="bg-[#151726] border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Navigation className="h-3.5 w-3.5 text-cyan-400" />
                  Longitud
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editFormData.lng}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, lng: e.target.value }))}
                  placeholder="Ej. -79.519900"
                  className="bg-[#151726] border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
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

          <DialogFooter className="flex items-center justify-end gap-2 p-4 border-t border-white/10 bg-[#161726]">
            <Button
              type="button"
              variant="ghost"
              disabled={isSavingEdit}
              onClick={() => setEditingUnit(null)}
              className="text-xs font-bold uppercase text-muted-foreground hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditUnit}
              disabled={isSavingEdit}
              className="text-xs font-black uppercase bg-primary hover:bg-primary/90 text-primary-foreground min-w-[130px]"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
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
