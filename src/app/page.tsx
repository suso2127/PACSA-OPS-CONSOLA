
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { PinScreen } from '@/components/auth/PinScreen';
import { AdminView } from '@/components/dashboard/AdminView';
import { SupervisorView } from '@/components/dashboard/SupervisorView';
import { GuardView } from '@/components/dashboard/GuardView';
import { LogOut, LayoutDashboard, Shield, Bell, Clock, Activity, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { collection, onSnapshot, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Role = 'Admin' | 'Supervisor' | 'Guard';

export default function Home() {
  const [role, setRole] = useState<Role | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [deficits, setDeficits] = useState<{name: string, count: number, required: number, onSite: number, status: 'uncovered' | 'partial'}[]>([]);
  const prevDeficitCount = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }));
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sistema de Alerta de Cobertura en Tiempo Real
  useEffect(() => {
    if (!role) return;

    const d = new Date();
    const dayNames = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const dayKey = dayNames[d.getDay()];

    const normalize = (str?: string) => (str || '').trim().toUpperCase().replace(/[\s\-_.]+/g, '');
    const isShiftActive = (s: any) => {
      if (s.exitTime) return false;
      if (s.status === 'Finalizado' || s.status === 'Completo' || s.status?.toLowerCase() === 'completado') return false;
      return true;
    };
    const matchesProject = (s: any, p: any) => {
      const sCode = (s.projectCode || '').trim().toUpperCase();
      const sName = (s.projectName || '').trim().toUpperCase();
      const pCode = (p.code || '').trim().toUpperCase();
      const pName = (p.name || '').trim().toUpperCase();

      if (s.projectId && p.id && s.projectId === p.id) return true;
      if (sCode && pCode && sCode === pCode) return true;
      if (sName && pName && sName === pName) return true;
      if (sCode && pName && sCode === pName) return true;
      if (sName && pCode && sName === pCode) return true;

      const normSCode = normalize(sCode);
      const normSName = normalize(sName);
      const normPCode = normalize(pCode);
      const normPName = normalize(pName);

      if (normSCode && normPCode && normSCode === normPCode) return true;
      if (normSName && normPName && normSName === normPName) return true;
      if (normSCode && normPName && normSCode === normPName) return true;
      if (normSName && normPCode && normSName === normPCode) return true;

      return false;
    };

    const unsubProjects = onSnapshot(collection(db, 'projects'), (projectSnap) => {
      const projects = projectSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const unsubShifts = onSnapshot(collection(db, 'shift-registrations'), (shiftSnap) => {
        const rawShifts = shiftSnap.docs.map(doc => doc.data() as any);
        const activeRegs = rawShifts.filter(isShiftActive);
        const newDeficits: {name: string, count: number, required: number, onSite: number, status: 'uncovered' | 'partial'}[] = [];
        
        projects.forEach((p: any) => {
          const required = Number(p.requirements?.[dayKey] ?? p.planilla_semanal?.[dayKey]?.elementos ?? p.planilla_semanal?.[dayKey]?.elms ?? 0);
          const onSite = activeRegs.filter((r: any) => matchesProject(r, p)).length;
          
          if (onSite < required) {
            newDeficits.push({
              name: p.name || p.code,
              count: required - onSite,
              required,
              onSite,
              status: onSite === 0 ? 'uncovered' : 'partial'
            });
          }
        });
        
        // Alarma sonora táctica al detectar nuevos faltantes
        if (newDeficits.length > prevDeficitCount.current) {
          playAlarm();
        }
        
        setDeficits(newDeficits);
        prevDeficitCount.current = newDeficits.length;
      });

      return () => unsubShifts();
    });

    return () => unsubProjects();
  }, [role, refreshKey]);

  const handleRefreshSystem = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // Forzar lectura activa de colecciones clave en Firestore para verificar conectividad y actualizar caché
      const collectionsToPing = ['projects', 'shift-registrations', 'novedades', 'active_units'];
      await Promise.all([
        ...collectionsToPing.map(colName => getDocs(query(collection(db, colName), limit(1)))),
        // Breve retardo para garantizar que las suscripciones reconecten y el usuario aprecie el estado visual
        new Promise(resolve => setTimeout(resolve, 800))
      ]);

      // Incrementar refreshKey para actualizar todas las vistas hijas sin recargar la página completa
      setRefreshKey(prev => prev + 1);

      const nowTime = new Date().toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('system-refresh', { detail: { timestamp: Date.now() } }));
      }

      toast({
        title: "SISTEMA ACTUALIZADO",
        description: `Datos en tiempo real sincronizados exitosamente con Firestore (${nowTime}).`,
        duration: 3500,
      });
    } catch (error) {
      console.error("Error al sincronizar con Firestore:", error);
      toast({
        title: "ERROR DE ACTUALIZACIÓN",
        description: "No se pudo sincronizar con Firestore. Verifique su conexión de red.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const playAlarm = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, context.currentTime);
      gain.gain.setValueAtTime(0.05, context.currentTime);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
    } catch (e) {
      // Audio bloqueado por política de navegador hasta interacción
    }
  };

  const handleLogout = () => setRole(null);

  if (!role) {
    return (
      <>
        <PinScreen onAuthenticated={setRole} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navegación Principal */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase leading-none">PACSA OPS</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <Activity className="h-2.5 w-2.5 text-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">System Online</span>
            </div>
          </div>
        </div>

        {/* Identificación Corporativa Central */}
        <div className="hidden md:flex items-center justify-center flex-1 px-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center gap-3 px-6 py-2.5 bg-card/50 rounded-lg border border-white/5">
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-white tracking-[0.4em] uppercase leading-none">GRUPSA-CONTROL</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">Grupo Pacsa S.A.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Botón Actualizar Sistema */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSystem}
            disabled={isRefreshing}
            className={cn(
              "relative font-black uppercase text-[10px] tracking-wider transition-all duration-300 border h-9 px-3",
              "bg-cyan-950/30 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
              isRefreshing && "opacity-75 cursor-not-allowed border-cyan-400"
            )}
            title="Recargar todos los datos en tiempo real desde Firestore sin recargar la página"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5 shrink-0 transition-transform", isRefreshing && "animate-spin text-cyan-300")} />
            <span className="hidden sm:inline">{isRefreshing ? "Actualizando..." : "Actualizar Sistema"}</span>
            <span className="sm:hidden">{isRefreshing ? "..." : "Actualizar"}</span>
          </Button>

          {/* Campana de Notificaciones con Alerta de Cobertura */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "relative transition-all duration-300", 
                  deficits.length > 0 ? "text-red-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10" : "text-muted-foreground"
                )}
              >
                <Bell className={cn("h-5 w-5", deficits.length > 0 && "animate-pulse")} />
                {deficits.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-card animate-bounce">
                    {deficits.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card border-red-500/20 shadow-2xl p-0 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-red-500/5 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h4 className="font-black text-xs uppercase tracking-widest text-red-500">Alertas de Cobertura</h4>
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {deficits.length > 0 ? (
                  <div className="space-y-1.5">
                    {deficits.map((d, i) => (
                      <div 
                        key={i} 
                        className={`flex justify-between items-center p-3 rounded-xl border transition-all ${
                          d.status === 'uncovered'
                            ? 'bg-red-950/30 border-red-500/30 hover:border-red-500/60'
                            : 'bg-amber-950/30 border-amber-500/30 hover:border-amber-500/60'
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${d.status === 'uncovered' ? 'bg-red-500' : 'bg-amber-400'}`} />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                              {d.status === 'uncovered' ? 'Sin Cubrir' : 'Por Cubrirse'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-white uppercase leading-none mt-1">{d.name}</span>
                        </div>
                        <Badge 
                          variant={d.status === 'uncovered' ? 'destructive' : 'outline'} 
                          className={`text-[9px] font-black px-2 py-0.5 ${
                            d.status === 'uncovered' 
                              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          -{d.count} ({d.onSite}/{d.required})
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                      <Activity className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Sistema Operativo Íntegro</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />
          
          {/* Reloj Robusto */}
          <div className="flex items-center gap-4 px-5 py-2 bg-[#1a1b2e] rounded-xl border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] group">
            <div className="hidden lg:flex flex-col items-end border-r border-white/10 pr-4">
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Standard Time</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">UTC-6 MX</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xl font-black font-mono tracking-tighter tabular-nums text-white group-hover:text-primary transition-colors">
                {currentTime || '00:00:00'}
              </span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive font-bold uppercase text-[10px] tracking-widest">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Log Out</span>
          </Button>
        </div>
      </header>

      {/* Indicador de carga mientras se actualizan los datos */}
      {isRefreshing && (
        <div className="w-full bg-cyan-950/90 border-b border-cyan-500/40 px-6 py-2 flex items-center justify-center gap-2.5 text-cyan-300 text-[11px] font-black uppercase tracking-widest animate-pulse z-40 sticky top-[73px] shadow-lg backdrop-blur-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
          <span>Sincronizando y recargando datos en tiempo real desde Firestore...</span>
        </div>
      )}

      {/* Área de Contenido Principal */}
      <main className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-black tracking-tighter uppercase">
            {role === 'Admin' && 'PACSA-CONTROL-CONSOLE'}
            {role === 'Supervisor' && 'Supervisión de Sitio'}
            {role === 'Guard' && 'Control de Puesto'}
          </h2>
        </div>

        {role === 'Admin' && <AdminView refreshKey={refreshKey} />}
        {role === 'Supervisor' && <SupervisorView refreshKey={refreshKey} />}
        {role === 'Guard' && <GuardView key={refreshKey} />}
      </main>

      {/* Pie de Página */}
      <footer className="border-t bg-card/50 px-6 py-3 flex items-center justify-between text-[10px] uppercase tracking-tighter text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Sistemas Operativos
          </span>
          <span className="font-mono">Srv: Studio-8627810775</span>
        </div>
        <div className="font-bold">
          &copy; {new Date().getFullYear()} Operaciones de Seguridad PACSA
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
