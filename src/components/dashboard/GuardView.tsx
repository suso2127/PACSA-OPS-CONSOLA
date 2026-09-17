
"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  LogIn, 
  LogOut, 
  Camera, 
  MapPin, 
  Navigation, 
  Loader2, 
  CheckCircle2, 
  Building2, 
  Radio, 
  Clock,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface ProjectData {
  id: string;
  code: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  mappedAt?: any;
}

export function GuardView() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [projectCode, setProjectCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('project-code') || 'PRJ-NSE-001';
    }
    return 'PRJ-NSE-001';
  });
  const [capturingGps, setCapturingGps] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isShiftActive, setIsShiftActive] = useState<boolean>(false);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  const { toast } = useToast();

  // Guardar en sessionStorage 'project-code' cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined' && projectCode) {
      sessionStorage.setItem('project-code', projectCode);
    }
  }, [projectCode]);

  // Reloj en tiempo real
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Escuchar colección 'projects' desde Firestore
  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as ProjectData[];

      setProjects(fetched);

      // Si el código actual no existe entre los proyectos y hay proyectos disponibles, seleccionar el primero
      if (fetched.length > 0) {
        setProjectCode(prev => {
          const stored = typeof window !== 'undefined' ? sessionStorage.getItem('project-code') : null;
          if (stored && fetched.some(p => p.code?.toUpperCase() === stored.toUpperCase())) {
            return stored;
          }
          const exists = fetched.some(p => p.code?.toUpperCase() === prev.toUpperCase());
          const chosen = exists ? prev : (fetched[0].code || prev);
          if (typeof window !== 'undefined' && chosen) {
            sessionStorage.setItem('project-code', chosen);
          }
          return chosen;
        });
      }
    }, (error) => {
      console.warn("Error al escuchar proyectos:", error);
    });

    return () => unsubscribe();
  }, []);

  // Buscar el proyecto actual usando el projectCode actual
  const currentProject = projects.find(
    p => p.code?.toUpperCase() === projectCode.trim().toUpperCase() || p.id === projectCode.trim().toUpperCase()
  );

  // Capturar ubicación GPS y actualizar el documento en Firestore con updateDoc
  const handleCaptureLocation = async () => {
    const code = projectCode.trim().toUpperCase();
    if (!code) {
      toast({
        title: "CÓDIGO REQUERIDO",
        description: "Debe ingresar o seleccionar el código de puesto (projectCode).",
        variant: "destructive"
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "SIN ACCESO GPS",
        description: "El dispositivo o navegador no soporta geolocalización.",
        variant: "destructive"
      });
      return;
    }

    setCapturingGps(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          // Localizar el documento en Firestore colección 'projects' con el projectCode actual
          let targetDocRef: any = null;

          if (currentProject?.id) {
            targetDocRef = doc(db, 'projects', currentProject.id);
          } else {
            const q = query(collection(db, 'projects'), where('code', '==', code));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
              targetDocRef = doc(db, 'projects', snapshot.docs[0].id);
            } else {
              const directRef = doc(db, 'projects', code);
              const directDoc = await getDoc(directRef);
              if (directDoc.exists()) {
                targetDocRef = directRef;
              }
            }
          }

          if (!targetDocRef) {
            toast({
              title: "PUESTO NO ENCONTRADO",
              description: `No se encontró un documento en la colección 'projects' con el código ${code}.`,
              variant: "destructive"
            });
            setCapturingGps(false);
            return;
          }

          // ACTUALIZAR DOCUMENTO EN FIRESTORE COLECCIÓN 'projects' CON updateDoc
          // Guardar los campos: latitude, longitude y mappedAt con timestamp.
          // El campo name ya existe en el documento, no hace falta guardarlo de nuevo.
          await updateDoc(targetDocRef, {
            latitude: latitude,
            longitude: longitude,
            mappedAt: serverTimestamp()
          });

          toast({
            title: "UBICACIÓN CAPTURADA",
            description: `Coordenadas (${latitude.toFixed(5)}, ${longitude.toFixed(5)}) registradas para el puesto actual. PACSA Console refleja la posición satelital en el mapa.`,
            className: "bg-emerald-950 border-emerald-500 text-white"
          });
        } catch (err) {
          console.error("Error al actualizar ubicación en Firestore:", err);
          toast({
            title: "ERROR AL GUARDAR",
            description: "No se pudo actualizar el documento del puesto en Firestore.",
            variant: "destructive"
          });
        } finally {
          setCapturingGps(false);
        }
      },
      (err) => {
        setCapturingGps(false);
        let errorMsg = "No se pudo obtener la posición satelital del puesto.";
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = "Permiso de geolocalización denegado en el navegador.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = "Señal GPS no disponible temporalmente.";
        } else if (err.code === err.TIMEOUT) {
          errorMsg = "Tiempo de espera agotado al conectar con el sensor GPS.";
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

  // Iniciar turno del guardia
  const handleStartShift = async () => {
    try {
      const docRef = await addDoc(collection(db, 'shift-registrations'), {
        guardName: 'OFICIAL DE GUARDIA',
        projectCode: currentProject?.code || projectCode,
        clientName: currentProject?.name || 'Cliente PACSA',
        projectName: currentProject?.name || 'Puesto Operativo',
        projectLocation: currentProject?.location || 'Ciudad de Panamá',
        shiftType: 'Diurno',
        duration: '12h',
        shiftDuration: '12h',
        entryTime: serverTimestamp(),
        status: 'Activo'
      });
      setIsShiftActive(true);
      setActiveShiftId(docRef.id);
      toast({
        title: "TURNO INICIADO",
        description: `Servicio activo en ${currentProject?.name || projectCode}.`,
        className: "bg-green-950 border-green-500 text-white"
      });
    } catch (e) {
      toast({
        title: "ERROR",
        description: "No se pudo registrar el inicio de turno.",
        variant: "destructive"
      });
    }
  };

  // Finalizar turno del guardia
  const handleEndShift = async () => {
    try {
      if (activeShiftId) {
        await updateDoc(doc(db, 'shift-registrations', activeShiftId), {
          status: 'Completado',
          exitTime: serverTimestamp()
        });
      }
      setIsShiftActive(false);
      setActiveShiftId(null);
      toast({
        title: "TURNO FINALIZADO",
        description: "Salida registrada con éxito.",
      });
    } catch (e) {
      toast({
        title: "ERROR",
        description: "No se pudo cerrar el turno.",
        variant: "destructive"
      });
    }
  };

  // Reportar novedad o incidente rápido
  const handleReportIncident = async () => {
    try {
      await addDoc(collection(db, 'novedades'), {
        code: `NOV-${Date.now().toString().slice(-4)}`,
        title: 'Verificación de Rutina y Puesto',
        description: `Guardia operativo en ${currentProject?.name || projectCode} reporta situación bajo control.`,
        severity: 'Baja',
        status: 'Abierta',
        createdAt: serverTimestamp(),
        puesto: currentProject?.name || projectCode,
        tipoNovedad: 'Relevo / Reporte'
      });
      toast({
        title: "REPORTE ENVIADO",
        description: "El reporte fue recibido en PACSA Console.",
        className: "bg-blue-950 border-blue-500 text-white"
      });
    } catch (e) {
      toast({
        title: "ERROR",
        description: "No se pudo registrar la novedad.",
        variant: "destructive"
      });
    }
  };

  const hasCoords = typeof currentProject?.latitude === 'number' && typeof currentProject?.longitude === 'number';

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">
      {/* Tarjeta del Puesto Actual */}
      <div className="dashboard-card bg-[#151726]/90 border border-primary/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Terminal de Puesto Activo</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <Clock className="h-3 w-3 text-primary" />
            <span>{currentTime || '--:--:--'}</span>
          </div>
        </div>

        {/* Información del Puesto Actual */}
        <div className="space-y-2 text-left">
          <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Puesto Actual</p>
          <h2 id="current-project-name" className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            {currentProject ? currentProject.name : 'Entrada Sector Norte'}
          </h2>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-mono font-bold text-xs uppercase px-2.5 py-0.5">
              CÓDIGO: {currentProject ? currentProject.code : projectCode}
            </Badge>

            {currentProject?.location && (
              <Badge variant="outline" className="text-muted-foreground text-xs font-medium border-white/10 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-red-400" />
                {currentProject.location}
              </Badge>
            )}

            {hasCoords ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                GPS: {currentProject!.latitude!.toFixed(5)}, {currentProject!.longitude!.toFixed(5)}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs font-mono">
                GPS: Sin fijar
              </Badge>
            )}
          </div>

          {currentProject?.mappedAt && (
            <p className="text-[11px] text-muted-foreground font-mono pt-1">
              Última sincronización GPS: {new Date(currentProject.mappedAt.toDate?.() || currentProject.mappedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>

        {/* Selector de Puesto / projectCode */}
        {projects.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label htmlFor="select-puesto" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Cambiar Puesto Asignado:
            </label>
            <div className="relative w-full sm:w-64">
              <select
                id="select-puesto"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="w-full bg-[#1e2034] text-white text-xs font-bold rounded-xl border border-white/15 px-3 py-2 appearance-none focus:outline-none focus:border-primary pr-8"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        )}

        {/* BOTÓN REQUERIDO: 'Capturar ubicación del puesto' */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <Button
            id="btn-capturar-ubicacion-puesto"
            type="button"
            onClick={handleCaptureLocation}
            disabled={capturingGps}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/50 transition-all active:scale-[0.99] cursor-pointer"
          >
            {capturingGps ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span>Capturando posición GPS satelital...</span>
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5 text-white" />
                <span>Capturar ubicación del puesto</span>
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground/80 mt-2 text-center">
            Actualiza el documento del puesto <span className="font-mono text-white">{currentProject?.code || projectCode}</span> en Firestore con las coordenadas GPS en tiempo real.
          </p>
        </div>
      </div>

      {/* Gestión de Deberes */}
      <Card className="bg-card border-border shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base font-black uppercase tracking-tight">
              <ClipboardList className="h-5 w-5 text-primary" />
              Gestión de Deberes
            </span>
            {isShiftActive ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1 text-[10px] font-black uppercase">
                <ShieldCheck className="h-3 w-3" />
                Turno en Curso
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-[10px] font-black uppercase">
                Sin Turno Activo
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Registro de asistencias y novedades directas con el centro de control PACSA.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Button 
            id="btn-iniciar-turno"
            size="lg" 
            onClick={handleStartShift}
            disabled={isShiftActive}
            className="h-20 flex flex-col gap-1.5 text-base font-black uppercase tracking-tight bg-primary hover:bg-primary/90 rounded-2xl shadow-lg"
          >
            <LogIn className="h-5 w-5" />
            <span>Iniciar Turno</span>
          </Button>

          <Button 
            id="btn-finalizar-turno"
            size="lg" 
            variant="outline" 
            onClick={handleEndShift}
            disabled={!isShiftActive}
            className="h-20 flex flex-col gap-1.5 text-base font-black uppercase tracking-tight border-destructive text-destructive hover:bg-destructive/10 rounded-2xl"
          >
            <LogOut className="h-5 w-5" />
            <span>Finalizar Turno</span>
          </Button>

          <Button 
            id="btn-reporte-incidente"
            size="lg" 
            variant="secondary" 
            onClick={handleReportIncident}
            className="h-16 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-tight sm:col-span-2 rounded-2xl"
          >
            <Camera className="h-5 w-5 text-primary" />
            <span>Reportar Novedad / Incidente</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

