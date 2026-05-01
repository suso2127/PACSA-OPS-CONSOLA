
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
  Lock
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera Táctica */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase">
            Panel de Control Operativo - GRUPSA-CONTROL
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="h-3 w-3 text-primary/60" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              REQUERIMIENTOS PARA HOY: <span className="text-primary">{currentDay}</span>
            </span>
          </div>
        </div>
        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[8px] font-black tracking-widest py-1 px-3">
          <Lock className="h-2.5 w-2.5 mr-1.5" />
          DATOS LOCALES PROTEGIDOS
        </Badge>
      </div>

      {/* Grid de Métricas Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Guardias Requeridos */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Guardias Requeridos</p>
                <h4 className="text-3xl font-black text-white">{stats.required}</h4>
              </div>
              <Users className="h-5 w-5 text-blue-500 opacity-60" />
            </div>
            <div className="h-1 w-full bg-blue-500/10 rounded-full mt-4" />
          </CardContent>
        </Card>

        {/* Guardias en Puesto */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Guardias en Puesto</p>
                <h4 className="text-3xl font-black text-white">{stats.active}</h4>
              </div>
              <User className="h-5 w-5 text-sky-400 opacity-60" />
            </div>
            <div className="h-1 w-full bg-sky-400/10 rounded-full mt-4" />
          </CardContent>
        </Card>

        {/* En Doble */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">En Doble</p>
                <h4 className="text-3xl font-black text-red-500">{stats.double}</h4>
              </div>
              <Copy className="h-5 w-5 text-red-500 opacity-60" />
            </div>
            <div className="h-1 w-full bg-red-500/10 rounded-full mt-4" />
          </CardContent>
        </Card>

        {/* Faltantes */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Faltantes</p>
                <h4 className="text-3xl font-black text-orange-500">{stats.missing}</h4>
              </div>
              <UserMinus className="h-5 w-5 text-orange-500 opacity-60" />
            </div>
            <div className="h-1 w-full bg-orange-500/10 rounded-full mt-4" />
          </CardContent>
        </Card>

        {/* Cobertura */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1 w-full">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cobertura</p>
                <div className="flex items-center justify-between">
                  <h4 className="text-3xl font-black text-green-500">{stats.coverage}%</h4>
                  <TrendingUp className="h-5 w-5 text-green-500 opacity-60" />
                </div>
                <Progress value={stats.coverage} className="h-1.5 mt-2 bg-green-500/10" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paneles de Visualización Central */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Estado de Fuerza */}
        <Card className="lg:col-span-4 bg-[#1a1b2e] border-white/5 h-[350px]">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Estado de Fuerza</h3>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Distribución de estados hoy</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center h-[200px] text-center opacity-40">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xs font-medium italic">No hay turnos registrados hoy.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-6">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[8px] font-black text-muted-foreground uppercase">Activos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-[8px] font-black text-muted-foreground uppercase">Dobles</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[8px] font-black text-muted-foreground uppercase">Cerrados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cobertura por Proyecto */}
        <Card className="lg:col-span-8 bg-[#1a1b2e] border-white/5 h-[350px]">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Cobertura por Proyecto</h3>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Visualización de fuerza instalada hoy</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-[240px] text-center opacity-40">
              <p className="text-xs font-medium italic">Cargue proyectos para visualizar la cobertura.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Cobertura */}
      <Card className={`bg-card border-l-4 ${stats.missing > 0 ? 'border-l-red-500' : 'border-l-green-500'} shadow-xl`}>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className={`h-5 w-5 ${stats.missing > 0 ? 'text-red-500' : 'text-green-500'}`} />
            <div>
              <h3 className={`text-sm font-bold ${stats.missing > 0 ? 'text-red-500' : 'text-green-500'} uppercase tracking-tight`}>
                Alertas de Cobertura (Personal Faltante - {currentDay.toLowerCase()})
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium">
                Listado de proyectos con déficit de personal según la planilla del día de hoy.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
              <ShieldCheck className="h-10 w-10 text-green-500" />
            </div>
            <p className="text-xs font-black text-green-500 uppercase tracking-[0.2em]">
              COBERTURA COMPLETA PARA EL DÍA DE HOY
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
