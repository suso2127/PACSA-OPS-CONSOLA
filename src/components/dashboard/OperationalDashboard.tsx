
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
  LayoutGrid,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, YAxis, Pie, PieChart, Cell } from "recharts";

export function OperationalDashboard() {
  const [currentDay, setCurrentDay] = useState('');
  const [deficits, setDeficits] = useState<{name: string, required: number, onSite: number}[]>([]);
  const [projectCoverageData, setProjectCoverageData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    required: 0,
    active: 0,
    double: 0,
    missing: 0,
    coverage: 0
  });

  useEffect(() => {
    const d = new Date();
    const fullDate = d.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).toUpperCase();
    setCurrentDay(fullDate);

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const dayNames = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
      const dayKey = dayNames[d.getDay()];
      
      const qShifts = query(
        collection(db, 'shift-registrations'),
        where('status', 'in', ['Activo', 'Doble'])
      );

      const unsubShifts = onSnapshot(qShifts, (shiftSnap) => {
        const shifts = shiftSnap.docs.map(doc => doc.data());
        const newDeficits: {name: string, required: number, onSite: number}[] = [];
        const coverageData: any[] = [];
        let totalReq = 0;
        let activeCount = 0;
        let doubleCount = 0;

        projects.forEach(p => {
          const req = p.requirements?.[dayKey] || 0;
          totalReq += req;
          const onSite = shifts.filter((s: any) => s.projectCode === p.code).length;
          const actives = shifts.filter((s: any) => s.projectCode === p.code && s.status === 'Activo').length;
          const doubles = shifts.filter((s: any) => s.projectCode === p.code && s.status === 'Doble').length;
          
          activeCount += actives;
          doubleCount += doubles;

          if (onSite < req) {
            newDeficits.push({ name: p.name, required: req, onSite });
          }

          if (req > 0) {
            coverageData.push({
              name: p.code,
              required: req,
              onSite: onSite,
            });
          }
        });

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
        setDeficits(newDeficits);
        setProjectCoverageData(coverageData);
      });

      return () => unsubShifts();
    });

    return () => unsubProjects();
  }, []);

  const forceData = [
    { name: 'Activos', value: stats.active, color: '#3b82f6' },
    { name: 'Dobles', value: stats.double, color: '#ef4444' },
    { name: 'Faltantes', value: stats.missing, color: '#f97316' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Cabecera Táctica */}
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

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Requeridos</p>
                <h4 className="text-4xl font-black text-white">{stats.required}</h4>
              </div>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="h-1 w-full bg-blue-500/10 rounded-full mt-6" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">En Puesto</p>
                <h4 className="text-4xl font-black text-white">{stats.active}</h4>
              </div>
              <User className="h-5 w-5 text-sky-400" />
            </div>
            <div className="h-1 w-full bg-sky-400/10 rounded-full mt-6" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">En Doble</p>
                <h4 className="text-4xl font-black text-red-500">{stats.double}</h4>
              </div>
              <Copy className="h-5 w-5 text-red-500" />
            </div>
            <div className="h-1 w-full bg-red-500/10 rounded-full mt-6" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Faltantes</p>
                <h4 className="text-4xl font-black text-orange-500">{stats.missing}</h4>
              </div>
              <UserMinus className="h-5 w-5 text-orange-500" />
            </div>
            <div className="h-1 w-full bg-orange-500/10 rounded-full mt-6" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group">
          <CardContent className="p-6">
            <div className="space-y-1 w-full">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cobertura</p>
              <div className="flex items-center justify-between">
                <h4 className="text-4xl font-black text-green-500">{stats.coverage}%</h4>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <Progress value={stats.coverage} className="h-2 mt-4 bg-green-500/10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocolo de Alerta de Cobertura */}
      <Card className={`bg-[#1a1b2e] border-white/5 border-l-[6px] ${stats.missing > 0 ? 'border-l-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-l-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]'} shadow-2xl transition-all`}>
        <CardContent className="p-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-6">
              <div className={`p-5 rounded-2xl border ${stats.missing > 0 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                <ShieldAlert className="h-10 w-10" />
              </div>
              <div>
                <h3 className={`text-xl font-black ${stats.missing > 0 ? 'text-red-500' : 'text-green-500'} uppercase tracking-tighter mb-1`}>
                  {stats.missing > 0 ? 'Protocolo de Alerta de Cobertura' : 'Sistema de Cobertura Optima'}
                </h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest max-w-2xl">
                  {stats.missing > 0 
                    ? `Se han detectado ${stats.missing} puestos sin cubrir en la planilla del ${currentDay.toLowerCase()}. Se requiere atención inmediata en los siguientes puestos:`
                    : `Todos los requerimientos operativos para el ${currentDay.toLowerCase()} han sido satisfechos según la planilla central.`
                  }
                </p>
              </div>
            </div>

            {stats.missing > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {deficits.map((d, i) => (
                  <div key={i} className="bg-black/20 p-4 rounded-xl border border-red-500/10 flex items-center justify-between group hover:border-red-500/30 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-red-500/50 uppercase tracking-widest leading-none">Puesto</span>
                      <span className="text-xs font-black text-white uppercase mt-1.5">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-muted-foreground uppercase block leading-none">Faltantes</span>
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-black mt-1.5 px-2">
                        {d.required - d.onSite} DE {d.required}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paneles Centrales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 bg-[#1a1b2e] border-white/5 h-[400px] shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-base font-black text-white uppercase tracking-tight">Estado de Fuerza</h3>
            </div>
            <div className="flex flex-col items-center justify-center h-[280px] text-center bg-white/[0.02] rounded-2xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={forceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {forceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 w-full mt-4">
                {forceData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[8px] font-black uppercase text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 bg-[#1a1b2e] border-white/5 h-[400px] shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-5 w-5 text-sky-400" />
              <h3 className="text-base font-black text-white uppercase tracking-tight">Cobertura por Proyecto</h3>
            </div>
            
            <div className="h-[280px] w-full mt-4">
              {projectCoverageData.length > 0 ? (
                <ChartContainer config={{
                  required: { label: "Requerido", color: "#3b4252" },
                  onSite: { label: "En Puesto", color: "#3b82f6" }
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectCoverageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff05" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="required" fill="#3b4252" radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar dataKey="onSite" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-white/[0.02] border border-white/5 rounded-3xl">
                  <span className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">ANALIZANDO DESPLIEGUE...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
