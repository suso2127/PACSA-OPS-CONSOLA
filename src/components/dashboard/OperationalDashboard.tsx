"use client"

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  User, 
  Copy, 
  UserMinus, 
  TrendingUp, 
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Building2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function OperationalDashboard() {
  const [currentDay, setCurrentDay] = useState('');

  useEffect(() => {
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    setCurrentDay(days[new Date().getDay()]);
  }, []);

  const metrics = [
    { label: 'GUARDIAS REQUERIDOS', value: '0', icon: Users, color: 'border-l-[#2563eb]', textColor: 'text-[#2563eb]' },
    { label: 'GUARDIAS EN PUESTO', value: '0', icon: User, color: 'border-l-[#0ea5e9]', textColor: 'text-[#0ea5e9]' },
    { label: 'EN DOBLE', value: '0', icon: Copy, color: 'border-l-[#ef4444]', textColor: 'text-[#ef4444]' },
    { label: 'FALTANTES', value: '0', icon: UserMinus, color: 'border-l-[#f97316]', textColor: 'text-[#f97316]' },
    { label: 'COBERTURA', value: '0%', icon: TrendingUp, color: 'border-l-[#22c55e]', textColor: 'text-[#22c55e]', hasProgress: true },
  ];

  return (
    <div className="space-y-6 text-foreground">
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">
            Panel de Control Operativo - PACSA OPS
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-3 w-3 text-primary/60" />
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">
              REQUERIMIENTOS PARA HOY: <span className="text-primary">{currentDay}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#1e1b4b] px-3 py-1.5 rounded-md border border-primary/20">
          <Lock className="h-3 w-3 text-primary" />
          <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">Datos Locales Protegidos</span>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className={`bg-[#1e1e2e]/50 border border-white/5 border-l-4 ${metric.color} p-5 rounded-lg shadow-xl`}>
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {metric.label}
              </p>
              <metric.icon className={`h-4 w-4 ${metric.textColor} opacity-60`} />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black tracking-tighter">{metric.value}</span>
              {metric.hasProgress && (
                <div className="mt-4 space-y-1">
                  <Progress value={0} className="h-1 bg-white/5" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sección Media: Gráficos y Estados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado de Fuerza */}
        <div className="lg:col-span-1 bg-[#1e1e2e]/50 border border-white/5 rounded-xl p-6 min-h-[350px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight">Estado de Fuerza</h3>
              <p className="text-[10px] text-muted-foreground">Distribución de estados hoy</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground/40 italic">No hay turnos registrados hoy.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Activos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Dobles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-sky-500" />
              <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Cerrados</span>
            </div>
          </div>
        </div>

        {/* Cobertura por Proyecto */}
        <div className="lg:col-span-2 bg-[#1e1e2e]/50 border border-white/5 rounded-xl p-6 min-h-[350px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Building2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight">Cobertura por Proyecto</h3>
              <p className="text-[10px] text-muted-foreground">Visualización de fuerza instalada hoy</p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground/40 italic">Cargue proyectos para visualizar la cobertura.</p>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Alertas */}
      <div className="bg-[#1e1e2e]/30 border border-red-500/10 rounded-xl p-8">
        <div className="flex items-start gap-4 mb-10">
          <div className="p-2 bg-red-500/10 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-500/60" />
          </div>
          <div>
            <h3 className="text-red-500/80 text-sm font-bold uppercase tracking-tight">
              Alertas de Cobertura (Personal Faltante - {currentDay.toLowerCase()})
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Listado de proyectos con déficit de personal según la planilla del día de hoy.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
            <ShieldCheck className="h-10 w-10 text-green-500" />
          </div>
          <p className="text-green-500 font-black text-sm uppercase tracking-[0.2em]">
            Cobertura completa para el día de hoy
          </p>
        </div>
      </div>
    </div>
  );
}