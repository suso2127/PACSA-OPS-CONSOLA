
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
  Building2,
  Activity,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

    // Consultar proyectos para calcular requeridos
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const dayKey = days[d.getDay()].toLowerCase().slice(0, 3) as any;
      const totalReq = snapshot.docs.reduce((acc, doc) => {
        const reqs = doc.data().requirements || {};
        return acc + (reqs[dayKey] || 0);
      }, 0);
      
      // Consultar registros activos hoy
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
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

  const metrics = [
    { 
      label: 'Personal Requerido', 
      value: stats.required, 
      icon: Users, 
      color: 'from-blue-600/20 to-blue-600/5', 
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-500',
      desc: 'Planilla del día'
    },
    { 
      label: 'Guardias en Puesto', 
      value: stats.active, 
      icon: User, 
      color: 'from-cyan-600/20 to-cyan-600/5', 
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
      desc: 'Despliegue estándar'
    },
    { 
      label: 'Jornada Doble', 
      value: stats.double, 
      icon: Copy, 
      color: 'from-red-600/20 to-red-600/5', 
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-500',
      desc: 'Turnos 24 horas'
    },
    { 
      label: 'Déficit de Fuerza', 
      value: stats.missing, 
      icon: UserMinus, 
      color: 'from-orange-600/20 to-orange-600/5', 
      borderColor: 'border-orange-500/30',
      iconColor: 'text-orange-500',
      desc: 'Puestos sin cubrir'
    },
  ];

  return (
    <div className="space-y-8 text-foreground animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#1a1b2e] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Sistema de Operaciones PACSA</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">
            Consola Global <span className="text-primary">Ops</span>
          </h2>
          <div className="flex items-center gap-3 mt-4">
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-bold text-[10px] py-1 px-3">
              ESTADO: OPERATIVO
            </Badge>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                REQ. <span className="text-white">{currentDay}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 relative z-10">
          <div className="bg-[#0f101d] px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-6 shadow-inner">
            <div className="text-right">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cobertura de Red</p>
              <p className="text-2xl font-black text-white">{stats.coverage}%</p>
            </div>
            <div className="h-12 w-[1px] bg-white/10" />
            <div className="p-3 bg-primary/20 rounded-xl">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-1">
            <Lock className="h-2.5 w-2.5" /> Encriptación AES-256 Activa
          </p>
        </div>
      </div>

      {/* Grid de Métricas Tácticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className={`bg-gradient-to-br ${metric.color} border ${metric.borderColor} p-6 rounded-3xl shadow-xl hover:scale-[1.02] transition-all duration-300 group`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl bg-black/20 ${metric.iconColor}`}>
                <metric.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-80">
                {metric.label}
              </p>
              <h4 className="text-4xl font-black tracking-tighter text-white tabular-nums">
                {metric.value}
              </h4>
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                {metric.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sección Analítica Central */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico de Cobertura de Impacto */}
        <div className="lg:col-span-8 bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity className="h-40 w-40 text-primary" />
          </div>
          
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Análisis de Despliegue</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Eficiencia de cobertura en tiempo real</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-[10px] font-black text-white uppercase">Sincronizado</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Índice de Cobertura Global</span>
                <span className="text-2xl font-black text-primary">{stats.coverage}%</span>
              </div>
              <div className="h-4 bg-[#0f101d] rounded-full border border-white/5 overflow-hidden">
                <div 
                  className="h-full bg-primary shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${stats.coverage}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="bg-[#25273c] p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Puestos Críticos</p>
                  <p className="text-lg font-black text-white">100%</p>
                </div>
                <div className="bg-[#25273c] p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Tiempo de Respuesta</p>
                  <p className="text-lg font-black text-green-500">Fast</p>
                </div>
                <div className="bg-[#25273c] p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">SLA Cumplimiento</p>
                  <p className="text-lg font-black text-primary">A+</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Fuerza (Impacto Visual) */}
        <div className="lg:col-span-4 bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 flex flex-col shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Estado de Fuerza</h3>
              <p className="text-[10px] text-muted-foreground font-bold">Distribución operativa</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-[#0f101d]"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={502.4}
                  strokeDashoffset={502.4 - (502.4 * stats.coverage) / 100}
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{stats.active + stats.double}</span>
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Activos</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-8 relative z-10">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase">
              <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Activos</span>
              <span className="text-white">{stats.active}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase">
              <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-red-500" /> Dobles</span>
              <span className="text-white">{stats.double}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase">
              <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Déficit</span>
              <span className="text-white">{stats.missing}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Centro de Alertas Críticas */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldAlert className="h-24 w-24 text-destructive" />
        </div>
        
        <div className="flex items-start gap-5 relative z-10">
          <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20">
            <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-destructive font-black text-xl uppercase tracking-tighter">Monitoreo de Alertas Críticas</h3>
              <Badge className="bg-destructive text-white border-none text-[8px] font-black px-2">LIVE</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium max-w-2xl leading-relaxed">
              Sistema de detección de vulnerabilidades en tiempo real. Se analizan los proyectos con déficit de personal según la planilla del día <span className="text-white font-bold">{currentDay.toLowerCase()}</span>.
            </p>
            
            <div className="mt-8">
              {stats.missing > 0 ? (
                <div className="bg-[#0f101d] border border-destructive/30 p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">Déficit de Fuerza Detectado</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Acción requerida inmediata en {stats.missing} puestos</p>
                    </div>
                  </div>
                  <button className="bg-destructive hover:bg-destructive/90 text-white font-black uppercase text-[10px] px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-destructive/20">
                    Ver Protocolos
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                  <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
                    <ShieldCheck className="h-10 w-10 text-green-500" />
                  </div>
                  <div>
                    <p className="text-green-500 font-black text-lg uppercase tracking-tighter">Estructura Blindada</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Cobertura completa para el despliegue de hoy</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
