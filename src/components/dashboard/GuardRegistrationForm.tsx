
"use client"

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Search, 
  Building2, 
  Loader2, 
  Shield, 
  Database, 
  Terminal,
  CheckCircle2,
  LogOut,
  Clock as ClockIcon,
  Zap,
  MapPin,
  Navigation
} from 'lucide-react';

export function GuardRegistrationForm() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [capturingGps, setCapturingGps] = useState(false);
  const [detectedProject, setDetectedProject] = useState<{
    id?: string;
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    guardName: '',
    projectCode: '',
    duration: '12h',
    shiftType: 'Diurno'
  });

  const { toast } = useToast();

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const searchProject = async () => {
      const code = formData.projectCode.trim().toUpperCase();
      if (code.length >= 2) {
        setProjectLoading(true);
        try {
          const q = query(collection(db, 'projects'), where('code', '==', code));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setDetectedProject({ 
              id: snapshot.docs[0].id,
              name: data.name, 
              location: data.location || 'UBICACIÓN REGISTRADA',
              latitude: data.latitude ?? data.lat,
              longitude: data.longitude ?? data.lng
            });
          } else {
            setDetectedProject(null);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setProjectLoading(false);
        }
      } else {
        setDetectedProject(null);
      }
    };

    const debounce = setTimeout(searchProject, 500);
    return () => clearTimeout(debounce);
  }, [formData.projectCode]);

  const handleCaptureLocation = async () => {
    const code = formData.projectCode.trim().toUpperCase();
    if (!code) {
      toast({
        title: "CÓDIGO DE PUESTO REQUERIDO",
        description: "Ingrese el código de proyecto para capturar su ubicación GPS.",
        variant: "destructive"
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "SIN GEOLOCALIZACIÓN",
        description: "Su dispositivo no soporta geolocalización.",
        variant: "destructive"
      });
      return;
    }

    setCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        try {
          let targetDocRef: any = null;

          if (detectedProject?.id) {
            targetDocRef = doc(db, 'projects', detectedProject.id);
          } else {
            const q = query(collection(db, 'projects'), where('code', '==', code));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              targetDocRef = doc(db, 'projects', snapshot.docs[0].id);
            } else {
              const directRef = doc(db, 'projects', code);
              const directSnap = await getDoc(directRef);
              if (directSnap.exists()) {
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

          // ACTUALIZAR DOCUMENTO EN FIRESTORE CON updateDoc
          // Guardar SOLO: latitude, longitude y mappedAt con timestamp.
          // El campo name ya existe en el documento, no hace falta guardarlo de nuevo.
          await updateDoc(targetDocRef, {
            latitude,
            longitude,
            mappedAt: serverTimestamp()
          });

          setDetectedProject(prev => prev ? {
            ...prev,
            latitude,
            longitude
          } : null);

          toast({
            title: "UBICACIÓN CAPTURADA",
            description: `Coordenadas (${latitude.toFixed(5)}, ${longitude.toFixed(5)}) guardadas en Firestore para el puesto actual. PACSA Console refleja la posición en el mapa.`,
            className: "bg-emerald-950 border-emerald-500 text-white"
          });
        } catch (err) {
          console.error("Error al guardar GPS:", err);
          toast({
            title: "ERROR AL GUARDAR",
            description: "No se pudieron actualizar las coordenadas en Firestore.",
            variant: "destructive"
          });
        } finally {
          setCapturingGps(false);
        }
      },
      (err) => {
        setCapturingGps(false);
        toast({
          title: "ERROR GPS",
          description: "No se pudo obtener la posición satelital del puesto.",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guardName || !formData.projectCode) {
      toast({
        title: "INFORMACIÓN FALTANTE",
        description: "Debe completar el nombre y el código de proyecto.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'shift-registrations'), {
        guardName: formData.guardName.trim().toUpperCase(),
        projectCode: formData.projectCode.trim().toUpperCase(),
        clientName: detectedProject?.name || 'Cliente por Validar',
        projectName: detectedProject?.name || 'Sitio No Identificado',
        projectLocation: detectedProject?.location || 'UBICACIÓN NO ESPECIFICADA',
        shiftType: formData.shiftType,
        duration: formData.duration,
        shiftDuration: formData.duration,
        entryTime: serverTimestamp(),
        status: formData.duration === '24h' ? 'Doble' : 'Activo'
      });
      
      toast({
        title: "REGISTRO EXITOSO",
        description: `El elemento ${formData.guardName} ha sido sincronizado en el dashboard.`,
        variant: "default"
      });
      
      setFormData({ guardName: '', projectCode: '', duration: '12h', shiftType: 'Diurno' });
      setDetectedProject(null);
    } catch (err) {
      toast({
        title: "ERROR DE CONEXIÓN",
        description: "No se pudo sincronizar el registro con el servidor.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedExit = () => {
    if (!currentTime) return '--:--';
    const hours = parseInt(formData.duration) || 8;
    const exitDate = new Date(currentTime.getTime() + hours * 60 * 60 * 1000);
    return exitDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formattedDate = currentTime?.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const formattedTime = currentTime?.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const durationOptions = Array.from({ length: 17 }, (_, i) => i + 8);

  return (
    <div className="bg-[#12121c] border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-700">
      <div className="p-8 bg-[#1a1b2e]/80 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">Comando Guardia</h2>
            <div className="flex flex-col mt-1">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mt-0.5">Terminal Sincronizada</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black tracking-widest px-3 py-1">
            <Database className="h-2.5 w-2.5 mr-1.5" />
            REAL-TIME SYNC
          </Badge>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex items-center gap-3 text-primary/70">
          <Terminal className="h-5 w-5" />
          <h3 className="text-xs font-black uppercase tracking-[0.3em]">Terminal de Registro Táctico</h3>
        </div>

        <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/30 rounded-2xl border border-white/5">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha Operativa</p>
                <p className="text-base font-black text-white capitalize">{formattedDate}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reloj de Comando</p>
              <p className="text-4xl font-black font-mono text-primary leading-none tracking-tighter">{formattedTime}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-around">
            <div className="text-center space-y-1">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1.5">
                <ClockIcon className="h-3 w-3" /> Hora Entrada
              </p>
              <p className="text-xl font-black text-white font-mono">{formattedTime}</p>
            </div>
            <div className="h-10 w-[1px] bg-white/5" />
            <div className="text-center space-y-1">
              <p className="text-[9px] font-black text-accent uppercase tracking-widest flex items-center justify-center gap-1.5">
                <LogOut className="h-3 w-3" /> Término Turno
              </p>
              <p className="text-xl font-black text-accent font-mono">{getEstimatedExit()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre del Elemento</Label>
            <input 
              placeholder="NOMBRE Y APELLIDO" 
              value={formData.guardName}
              onChange={(e) => setFormData({...formData, guardName: e.target.value.toUpperCase()})}
              className="w-full h-16 bg-[#1a1b2e] border border-white/5 focus:ring-1 focus:ring-primary/50 text-base font-black tracking-tight rounded-2xl pl-6 text-white outline-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Código de Proyecto</Label>
            <div className="relative">
              <input 
                placeholder="ID CLIENTE / CÓDIGO SITIO" 
                value={formData.projectCode}
                onChange={(e) => setFormData({...formData, projectCode: e.target.value.toUpperCase()})}
                className="w-full h-16 bg-[#1a1b2e] border border-white/5 focus:ring-1 focus:ring-primary/50 font-mono text-base font-black tracking-widest rounded-2xl pl-6 text-white outline-none"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                {projectLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Search className="h-6 w-6 text-muted-foreground opacity-50" />
                )}
              </div>
            </div>
          </div>

          <div className={`bg-[#1a1b2e] border-2 border-dashed rounded-3xl p-6 transition-all duration-500 ${detectedProject ? 'border-primary/40 bg-primary/5' : 'border-white/5'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${detectedProject ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-muted-foreground'}`}>
                  {detectedProject ? <CheckCircle2 className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Validación de Destino</span>
                  <p className={`text-sm font-black uppercase italic tracking-tighter mt-1 ${detectedProject ? 'text-white' : 'text-muted-foreground/30'}`}>
                    {detectedProject ? detectedProject.name : 'Esperando ID operativo...'}
                  </p>
                  {detectedProject && (
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">
                        {detectedProject.location}
                      </span>
                      {typeof detectedProject.latitude === 'number' && (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Navigation className="h-2 w-2" />
                          GPS: {detectedProject.latitude.toFixed(4)}, {detectedProject.longitude?.toFixed(4)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {formData.projectCode.trim().length >= 2 && (
                <Button
                  id="btn-capturar-ubicacion-puesto-form"
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={capturingGps}
                  className="h-11 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  {capturingGps ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Capturando GPS...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4" />
                      <span>Capturar ubicación del puesto</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Duración Jornada</Label>
              <Select value={formData.duration} onValueChange={(v) => setFormData({...formData, duration: v})}>
                <SelectTrigger className="h-14 bg-[#1a1b2e] border-white/5 rounded-2xl font-black uppercase text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10 max-h-60">
                  {durationOptions.map((hours) => (
                    <SelectItem key={hours} value={`${hours}h`} className="font-black text-[10px] uppercase">
                      {hours} Horas {hours === 24 ? '(DOBLE)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Turno Operativo</Label>
              <Select value={formData.shiftType} onValueChange={(v) => setFormData({...formData, shiftType: v})}>
                <SelectTrigger className="h-14 bg-[#1a1b2e] border-white/5 rounded-2xl font-black uppercase text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10">
                  <SelectItem value="Diurno" className="font-black text-[10px] uppercase">DIURNO</SelectItem>
                  <SelectItem value="Nocturno" className="font-black text-[10px] uppercase">NOCTURNO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-20 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.4em] rounded-3xl shadow-[0_15px_40px_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] group"
          >
            {loading ? "SINCRONIZANDO..." : (
              <span className="flex items-center gap-3">
                <Zap className="h-5 w-5 fill-primary-foreground group-hover:animate-bounce" />
                REGISTRAR ENTRADA
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
