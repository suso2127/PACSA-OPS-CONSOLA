
"use client"

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  User, 
  Copy, 
  UserMinus, 
  TrendingUp, 
  Calendar,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Lock,
  LayoutGrid
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function OperationalDashboard() {
  const [currentDay, setCurrentDay] = useState('');
  const [stats, setStats] = useState({
    required: 0,
    active: 0,
    double: 0,
    missing: 0,
    coverage: 0
  });

  useEffect(() => {
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const d = new Date();
    setCurrentDay(days[d.getDay()]);

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const dayKey = days[d.getDay()].toLowerCase().slice(0, 3) as any;
      const totalReq = snapshot.docs.reduce((acc, doc) => {
        const reqs = doc.data().requirements || {};
        return acc + (reqs[dayKey] || 0);
      }, 0);
      
      const qShifts = query(
        collection(db, 'shift-registrations'),
        where('status', 'in', ['Activo', 'Doble'])
      );

      const unsubShifts = onSnapshot(qShifts, (shiftSnap) => {
        const activeCount = shiftSnap.docs.filter(s => s.data().status === 'Activo').length;
        const doubleCount = shiftSnap.docs.filter(s => s.data().status === 'Doble').length;
        const totalInSite = activeCount + doubleCount;
        const missing = Math.max(0, totalReq - totalInSite);
        const coverage = totalReq > 0 ? Math.round((totalInSite / totalReq) * 100) : 0;

        setStats({
          required: totalReq,
          active: activeCount,
          double: doubleCount,
          missing,
          coverage
        });
      });

      return () => unsubShifts();
    });

    return () => unsubProjects();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Cabecera Táctica Estilo Imagen */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              Panel de Control Operativo
              <span className="text-primary/40 text-xs font-medium">— GRUPSA-CONTROL</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Calendar className="h-3 w-3 text-primary/60" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                REQUERIMIENTOS PARA HOY: <span className="text-primary">{currentDay}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[8px] font-black tracking-widest py-1.5 px-3 rounded-full">
            <Activity className="h-2.5 w-2.5 mr-1.5 animate-pulse" />
            LIVE FEED ACTIVE
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-muted-foreground text-[8px] font-black tracking-widest py-1.5 px-3 rounded-full">
            <Lock className="h-2.5 w-2.5 mr-1.5" />
            SECURE ACCESS
          </Badge>
        </div>
      </div>

      {/* Grid de Métricas Superiores con Impacto Visual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Guardias Requeridos */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group transition-all hover:border-primary/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Guardias Requeridos</p>
                <h4 className="text-4xl font-black text-white">{stats.required}</h4>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="h-1 w-full bg-blue-500/10 rounded-full mt-6" />
            <div className="absolute -bottom-2 -right-2 opacity-5">
              <Users className="h-20 w-20 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Guardias en Puesto */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group transition-all hover:border-sky-400/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Guardias en Puesto</p>
                <h4 className="text-4xl font-black text-white">{stats.active}</h4>
              </div>
              <div className="p-2 bg-sky-400/10 rounded-lg">
                <User className="h-5 w-5 text-sky-400" />
              </div>
            </div>
            <div className="h-1 w-full bg-sky-400/10 rounded-full mt-6" />
            <div className="absolute -bottom-2 -right-2 opacity-5">
              <User className="h-20 w-20 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* En Doble */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group transition-all hover:border-red-500/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">En Doble</p>
                <h4 className="text-4xl font-black text-red-500">{stats.double}</h4>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Copy className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="h-1 w-full bg-red-500/10 rounded-full mt-6" />
            <div className="absolute -bottom-2 -right-2 opacity-5">
              <Copy className="h-20 w-20 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Faltantes */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group transition-all hover:border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Faltantes</p>
                <h4 className="text-4xl font-black text-orange-500">{stats.missing}</h4>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <UserMinus className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="h-1 w-full bg-orange-500/10 rounded-full mt-6" />
            <div className="absolute -bottom-2 -right-2 opacity-5">
              <UserMinus className="h-20 w-20 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Cobertura */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group transition-all hover:border-green-500/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1 w-full">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cobertura Total</p>
                <div className="flex items-center justify-between">
                  <h4 className="text-4xl font-black text-green-500">{stats.coverage}%</h4>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <Progress value={stats.coverage} className="h-2 mt-4 bg-green-500/10" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 opacity-5">
              <TrendingUp className="h-20 w-20 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paneles de Visualización Central (Igual a la imagen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Estado de Fuerza */}
        <Card className="lg:col-span-4 bg-[#1a1b2e] border-white/5 h-[400px] shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Estado de Fuerza</h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Distribución Operativa Hoy</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center h-[240px] text-center border-y border-white/5 bg-white/[0.02] rounded-2xl">
              <div className="p-5 bg-white/5 rounded-full mb-4 animate-pulse">
                <Activity className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 px-8">
                Esperando flujo de registros para generar métricas visuales
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-[9px] font-black text-muted-foreground uppercase">Activos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span className="text-[9px] font-black text-muted-foreground uppercase">Dobles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                <span className="text-[9px] font-black text-muted-foreground uppercase">Histórico</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cobertura por Proyecto */}
        <Card className="lg:col-span-8 bg-[#1a1b2e] border-white/5 h-[400px] shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-sky-400/10 flex items-center justify-center border border-sky-400/20">
                <Activity className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Cobertura por Proyecto</h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Análisis de Despliegue en Tiempo Real</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center h-[280px] text-center bg-white/[0.02] border border-white/5 rounded-3xl group">
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/30 group-hover:text-primary transition-colors duration-500">
                  SINCRONIZANDO BASE DE DATOS ESTRUCTURAL...
                </p>
                <div className="flex justify-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-1 w-8 bg-white/5 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de Alertas Estilo Imagen (Shield icon y banner verde) */}
      <Card className={`bg-[#1a1b2e] border-white/5 border-l-[6px] ${stats.missing > 0 ? 'border-l-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-l-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]'} shadow-2xl transition-all`}>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className={`p-5 rounded-2xl border ${stats.missing > 0 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                <ShieldAlert className="h-10 w-10" />
              </div>
              <div>
                <h3 className={`text-xl font-black ${stats.missing > 0 ? 'text-red-500' : 'text-green-500'} uppercase tracking-tighter mb-1`}>
                  {stats.missing > 0 ? 'Protocolo de Alerta de Cobertura' : 'Sistema de Cobertura Optima'}
                </h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest max-w-md">
                  {stats.missing > 0 
                    ? `Se han detectado ${stats.missing} puestos sin cubrir en la planilla del ${currentDay.toLowerCase()}. Se requiere atención inmediata.`
                    : `Todos los requerimientos operativos para el ${currentDay.toLowerCase()} han sido satisfechos según la planilla central.`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-black/20 p-6 rounded-2xl border border-white/5">
              <div className="text-center px-6 border-r border-white/10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Status</p>
                <p className={`text-lg font-black uppercase ${stats.missing > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {stats.missing > 0 ? 'Déficit' : 'Completo'}
                </p>
              </div>
              <div className="text-center px-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Audit</p>
                <p className="text-lg font-black text-white">Verified</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
