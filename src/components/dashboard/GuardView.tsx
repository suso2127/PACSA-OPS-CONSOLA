"use client"

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  onSnapshot,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  ClipboardList, 
  LogIn, 
  LogOut, 
  Camera, 
  MapPin, 
  Navigation, 
  Building2, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Shield,
  Radio,
  RefreshCw,
  Search
} from 'lucide-react';

interface ProjectData {
  id: string;
  code: string;
  name: string;
  location?: string;
  client?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  locationCapturedAt?: any;
}

export function GuardView() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  // Guard identity & active post
  const [guardName, setGuardName] = useState('OFICIAL EN SERVICIO');
  const [projectCode, setProjectCode] = useState('PRJ-NSE-001');
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // GPS Capture state
  const [capturingGps, setCapturingGps] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Shift & Incident management
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidentText, setIncidentText] = useState('');
  const [incidentType, setIncidentType] = useState('Novedad General');
  const [savingIncident, setSavingIncident] = useState(false);

  // Clock
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Retrieve saved post preference from localStorage
  useEffect(() => {
    try {
      const savedCode = localStorage.getItem('pacsa_guard_project_code');
      if (savedCode) setProjectCode(savedCode);
      const savedName = localStorage.getItem('pacsa_guard_name');
      if (savedName) setGuardName(savedName);
    } catch {
      // ignore
    }
  }, []);

  // Listen to Firestore 'projects'
  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ProjectData[];
      setProjects(list);
      setLoadingProjects(false);
    }, (err) => {
      console.warn('Error fetching projects in GuardView:', err);
      setLoadingProjects(false);
    });

    return () => unsub();
  }, []);

  // Synchronize current project based on projectCode
  useEffect(() => {
    if (!projectCode) {
      setCurrentProject(null);
      return;
    }
    const cleanCode = projectCode.trim().toUpperCase();
    const found = projects.find(p => p.code?.toUpperCase() === cleanCode || p.id === cleanCode);
    if (found) {
      setCurrentProject(found);
      const lat = found.latitude ?? found.lat;
      const lng = found.longitude ?? found.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        setLastCoords({ lat, lng });
      }
    } else {
      setCurrentProject(null);
    }
  }, [projectCode, projects]);

  // Listen to active shift for this guard / project
  useEffect(() => {
    const cleanCode = projectCode.trim().toUpperCase();
    const qShifts = query(
      collection(db, 'shift-registrations'),
      where('projectCode', '==', cleanCode),
      where('status', 'in', ['Activo', 'Doble'])
    );
    const unsub = onSnapshot(qShifts, (snap) => {
      if (!snap.empty) {
        setActiveShift({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setActiveShift(null);
      }
    });
    return () => unsub();
  }, [projectCode]);

  // Core Functionality: Capturar ubicación del puesto
  const handleCaptureLocation = async () => {
    const cleanCode = projectCode.trim().toUpperCase();
    if (!cleanCode) {
      toast({
        title: "CÓDIGO DE PUESTO REQUERIDO",
        description: "Indique el código del puesto actual antes de capturar la ubicación.",
        variant: "destructive"
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "SIN SOPORTE GPS",
        description: "Su navegador o dispositivo móvil no soporta geolocalización.",
        variant: "destructive"
      });
      return;
    }

    setCapturingGps(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        try {
          // 1. Find the project document in Firestore 'projects'
          const qProj = query(collection(db, 'projects'), where('code', '==', cleanCode));
          const snapshot = await getDocs(qProj);

          if (!snapshot.empty) {
            // Update the matched document
            const projDocRef = doc(db, 'projects', snapshot.docs[0].id);
            await updateDoc(projDocRef, {
              latitude: latitude,
              longitude: longitude,
              lat: latitude,
              lng: longitude,
              gpsAccuracy: accuracy,
              locationCapturedAt: serverTimestamp(),
              lastCapturedBy: guardName || 'Guardia en Turno'
            });
          } else {
            // Check if document exists with id matching cleanCode
            const directDocRef = doc(db, 'projects', cleanCode);
            await setDoc(directDocRef, {
              code: cleanCode,
              name: currentProject?.name || `Puesto ${cleanCode}`,
              location: currentProject?.location || 'Ubicación Registrada en Sitio',
              latitude: latitude,
              longitude: longitude,
              lat: latitude,
              lng: longitude,
              gpsAccuracy: accuracy,
              locationCapturedAt: serverTimestamp(),
              lastCapturedBy: guardName || 'Guardia en Turno',
              createdAt: serverTimestamp()
            }, { merge: true });
          }

          setLastCoords({ lat: latitude, lng: longitude });

          toast({
            title: "UBICACIÓN DE PUESTO ACTUALIZADA",
            description: `Coordenadas guardadas en Firestore (${latitude.toFixed(5)}, ${longitude.toFixed(5)}). El mapa de PACSA Console ahora muestra el puesto en su ubicación real.`,
            className: "bg-emerald-950 border-emerald-500 text-white"
          });
        } catch (error) {
          console.error("Error guardando ubicación en Firestore:", error);
          toast({
            title: "ERROR AL GUARDAR UBICACIÓN",
            description: "No se pudieron registrar las coordenadas en la base de datos de proyectos.",
            variant: "destructive"
          });
        } finally {
          setCapturingGps(false);
        }
      },
      (error) => {
        setCapturingGps(false);
        console.error("Error al capturar GPS:", error);
        let errorMsg = "No se pudo obtener la posición GPS del dispositivo.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Permiso de geolocalización denegado. Habilite el acceso GPS en su navegador.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Señal GPS no disponible actualmente.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Tiempo de espera agotado al consultar el satélite GPS.";
        }
        toast({
          title: "ERROR GPS",
          description: errorMsg,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Iniciar Turno
  const handleStartShift = async () => {
    setShiftLoading(true);
    const cleanCode = projectCode.trim().toUpperCase();
    try {
      await addDoc(collection(db, 'shift-registrations'), {
        guardName: guardName.trim().toUpperCase(),
        projectCode: cleanCode,
        clientName: currentProject?.client || currentProject?.name || 'Cliente PACSA',
        projectName: currentProject?.name || `PUESTO ${cleanCode}`,
        projectLocation: currentProject?.location || 'Ubicación Sitio',
        shiftType: 'Diurno',
        duration: '12h',
        shiftDuration: '12h',
        entryTime: serverTimestamp(),
        status: 'Activo',
        latitude: lastCoords?.lat || null,
        longitude: lastCoords?.lng || null
      });

      toast({
        title: "TURNO INICIADO",
        description: `Se registró el inicio de turno para ${guardName} en ${cleanCode}.`,
        className: "bg-emerald-950 border-emerald-500 text-white"
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "ERROR AL INICIAR TURNO",
        description: "No se pudo sincronizar el inicio de turno.",
        variant: "destructive"
      });
    } finally {
      setShiftLoading(false);
    }
  };

  // Finalizar Turno
  const handleEndShift = async () => {
    if (!activeShift?.id) return;
    setShiftLoading(true);
    try {
      await updateDoc(doc(db, 'shift-registrations', activeShift.id), {
        status: 'Finalizado',
        exitTime: serverTimestamp()
      });
      setActiveShift(null);
      toast({
        title: "TURNO FINALIZADO",
        description: "El turno ha concluido y fue registrado exitosamente.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "ERROR AL FINALIZAR TURNO",
        description: "No se pudo actualizar el estado de turno.",
        variant: "destructive"
      });
    } finally {
      setShiftLoading(false);
    }
  };

  // Reporte de Incidente
  const handleSaveIncident = async () => {
    if (!incidentText.trim()) {
      toast({
        title: "DESCRIPCIÓN REQUERIDA",
        description: "Detalle la novedad o incidente ocurrido.",
        variant: "destructive"
      });
      return;
    }

    setSavingIncident(true);
    const cleanCode = projectCode.trim().toUpperCase();
    try {
      await addDoc(collection(db, 'novedades'), {
        proyectoId: currentProject?.id || cleanCode,
        proyectoCodigo: cleanCode,
        proyectoNombre: currentProject?.name || `Puesto ${cleanCode}`,
        lugar: currentProject?.location || 'Puesto en Sitio',
        tipoIncidente: incidentType,
        severidad: 'Media',
        resumen: incidentText.trim(),
        descripcion: incidentText.trim(),
        oficialReporta: guardName,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
        createdAt: serverTimestamp(),
        estado: 'Pendiente',
        latitude: lastCoords?.lat || null,
        longitude: lastCoords?.lng || null
      });

      toast({
        title: "INCIDENTE REGISTRADO",
        description: "La novedad ha sido enviada al centro de control de PACSA.",
        className: "bg-amber-950 border-amber-500 text-white"
      });

      setIncidentText('');
      setIncidentOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "ERROR AL REGISTRAR INCIDENTE",
        description: "No se pudo guardar el reporte.",
        variant: "destructive"
      });
    } finally {
      setSavingIncident(false);
    }
  };

  const formattedTime = currentTime?.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const formattedDate = currentTime?.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">
      {/* Reloj y Estado de Conexión de Guardia */}
      <div className="bg-[#12121c] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3.5 rounded-2xl border border-primary/30">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-black tracking-widest px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                CONEXIÓN OPERATIVA
              </Badge>
              {activeShift && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black tracking-widest px-2.5 py-0.5">
                  TURNO EN CURSO
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight text-white uppercase mt-1">Terminal de Guardia</h2>
            <p className="text-xs text-muted-foreground capitalize">{formattedDate}</p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Hora Satelital</span>
          <span className="text-2xl font-black text-primary tracking-tight">{formattedTime}</span>
        </div>
      </div>

      {/* PUESTO ACTUAL & CAPTURA DE UBICACIÓN GPS */}
      <div className="bg-[#161726] border-2 border-primary/30 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Puesto Asignado</p>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {currentProject?.name || 'Entrada Sector Norte'}
              </h3>
            </div>
          </div>
          <Badge className="bg-white/10 text-white border-white/15 font-mono text-xs px-3 py-1 font-bold">
            {projectCode}
          </Badge>
        </div>

        {/* Selector de Puesto Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Seleccionar Puesto de Trabajo
            </Label>
            <Select 
              value={projectCode} 
              onValueChange={(val) => {
                setProjectCode(val);
                try { localStorage.setItem('pacsa_guard_project_code', val); } catch {}
              }}
            >
              <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold text-xs">
                <SelectValue placeholder="Elegir Puesto..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1d2e] border-white/15 text-white max-h-56">
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.code} className="text-xs font-bold">
                    {p.code} - {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Nombre de Guardia
            </Label>
            <Input 
              value={guardName}
              onChange={(e) => {
                setGuardName(e.target.value.toUpperCase());
                try { localStorage.setItem('pacsa_guard_name', e.target.value.toUpperCase()); } catch {}
              }}
              placeholder="NOMBRE COMPLETO"
              className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold text-xs uppercase"
            />
          </div>
        </div>

        {/* Estado GPS del Puesto */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${lastCoords ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Coordenadas del Puesto en PACSA Console</p>
              {lastCoords ? (
                <p className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  GPS: {lastCoords.lat.toFixed(5)}, {lastCoords.lng.toFixed(5)}
                </p>
              ) : (
                <p className="text-xs font-bold text-amber-400/90 flex items-center gap-1.5 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Sin coordenadas GPS registradas
                </p>
              )}
            </div>
          </div>

          {currentProject?.location && (
            <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase">
              {currentProject.location}
            </span>
          )}
        </div>

        {/* BOTÓN PRINCIPAL REQUERIDO: Capturar ubicación del puesto */}
        <Button
          id="btn-capturar-ubicacion-puesto"
          size="lg"
          onClick={handleCaptureLocation}
          disabled={capturingGps}
          className="w-full h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-950/40 border border-emerald-400/30 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          {capturingGps ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span>Capturando ubicación GPS del puesto...</span>
            </>
          ) : (
            <>
              <Navigation className="h-6 w-6 text-white animate-bounce" />
              <span>Capturar ubicación del puesto</span>
            </>
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground italic">
          Guarda las coordenadas satelitales en Firestore colección &apos;projects&apos; para que el puesto aparezca en su ubicación real en el mapa de PACSA Console.
        </p>
      </div>

      {/* GESTIÓN DE DEBERES DE TURNO */}
      <Card className="bg-[#12121c] border-white/5 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-black uppercase text-white">
            <ClipboardList className="h-5 w-5 text-primary" />
            Gestión de Deberes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!activeShift ? (
            <Button 
              size="lg" 
              onClick={handleStartShift}
              disabled={shiftLoading}
              className="h-24 flex flex-col gap-2 text-base font-black uppercase rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              {shiftLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogIn className="h-6 w-6" />}
              Iniciar Turno
            </Button>
          ) : (
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleEndShift}
              disabled={shiftLoading}
              className="h-24 flex flex-col gap-2 text-base font-black uppercase rounded-2xl border-destructive/60 text-destructive hover:bg-destructive/10"
            >
              {shiftLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogOut className="h-6 w-6" />}
              Finalizar Turno
            </Button>
          )}

          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => setIncidentOpen(true)}
            className="h-24 flex flex-col gap-2 text-base font-black uppercase rounded-2xl bg-[#1d1f33] hover:bg-[#252842] text-white border border-white/5"
          >
            <Camera className="h-6 w-6 text-amber-400" />
            Reporte de Incidente
          </Button>
        </CardContent>
      </Card>

      {/* Modal Reportar Incidente */}
      <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
        <DialogContent className="bg-[#1a1b2e] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase">
              <Camera className="h-5 w-5 text-amber-400" />
              Reporte de Incidente / Novedad
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Puesto</Label>
              <Input 
                value={`${projectCode} - ${currentProject?.name || 'Puesto Actual'}`}
                disabled
                className="bg-white/5 border-white/10 text-white rounded-xl font-bold text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Tipo de Novedad</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl font-bold text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1c1d2e] border-white/15 text-white">
                  <SelectItem value="Novedad General">Novedad General</SelectItem>
                  <SelectItem value="Control de Acceso">Control de Acceso</SelectItem>
                  <SelectItem value="Rondín Sospechoso">Rondín Sospechoso</SelectItem>
                  <SelectItem value="Emergencia Médica">Emergencia Médica</SelectItem>
                  <SelectItem value="Falla de Equipos">Falla de Equipos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Descripción del Hecho</Label>
              <Textarea 
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
                placeholder="Describa brevemente la novedad..."
                className="bg-white/5 border-white/10 text-white rounded-xl min-h-[100px] text-xs font-normal"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIncidentOpen(false)} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveIncident} 
              disabled={savingIncident}
              className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase rounded-xl"
            >
              {savingIncident ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Registrar Novedad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
