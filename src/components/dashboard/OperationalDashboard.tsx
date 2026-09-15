
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export interface PostCoverageItem {
  id: string;
  name: string;
  code: string;
  required: number;
  onSite: number;
  missing: number;
  status: 'uncovered' | 'partial' | 'covered'; // 'uncovered' = ROJO, 'partial' = AMARILLO/NARANJA, 'covered' = VERDE
}

export function OperationalDashboard() {
  const [currentDay, setCurrentDay] = useState('');
  const [deficits, setDeficits] = useState<{name: string, required: number, onSite: number}[]>([]);
  const [postCoverages, setPostCoverages] = useState<PostCoverageItem[]>([]);
  const [coverageFilter, setCoverageFilter] = useState<'all' | 'uncovered' | 'partial' | 'covered'>('all');
  const [projectCoverageData, setProjectCoverageData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    required: 0,
    active: 0,
    double: 0,
    missing: 0,
    coverage: 0
  });

  useEffect(() => {
    // Evitar problemas de hidratación calculando la fecha en el cliente
    const d = new Date();
    const fullDate = d.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).toUpperCase();
    setCurrentDay(fullDate);

    const dayNames = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const dayKey = dayNames[d.getDay()];

    // Normalizador táctico para coincidencia flexible de proyectos por código o nombre
    const normalize = (str?: string) => (str || '').trim().toUpperCase().replace(/[\s\-_.]+/g, '');
    const isShiftActive = (s: any) => {
      if (s.exitTime) return false;
      if (s.status === 'Finalizado' || s.status === 'Completo') return false;
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

    // Escucha en tiempo real de proyectos para obtener requerimientos
    const unsubProjects = onSnapshot(collection(db, 'projects'), (projectSnap) => {
      const projects = projectSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Escucha en tiempo real de registros de turno (Comando Operaciones)
      const unsubShifts = onSnapshot(collection(db, 'shift-registrations'), (shiftSnap) => {
        const rawShifts = shiftSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeShifts = rawShifts.filter(isShiftActive);

        const newDeficits: {name: string, required: number, onSite: number}[] = [];
        const allCoverages: PostCoverageItem[] = [];
        const coverageData: any[] = [];
        let totalReq = 0;
        let activeCount = 0;
        let doubleCount = 0;

        projects.forEach(p => {
          const req = Number(p.requirements?.[dayKey] ?? p.planilla_semanal?.[dayKey]?.elementos ?? p.planilla_semanal?.[dayKey]?.elms ?? 0);
          totalReq += req;
          
          // Filtrar registros vinculados a este proyecto (por código o nombre)
          const projectShifts = activeShifts.filter((s: any) => matchesProject(s, p));
          const onSite = projectShifts.length;
          const doubles = projectShifts.filter((s: any) => s.status === 'Doble' || s.duration === '24h' || s.shiftDuration === '24h').length;
          const actives = onSite - doubles;
          
          activeCount += actives;
          doubleCount += doubles;

          const missing = Math.max(0, req - onSite);

          // Clasificación semántica estricta por colores:
          // ROJO: Sin cubrir (0 elementos en sitio)
          // AMARILLO O NARANJA: Por cubrirse (cobertura parcial: onSite > 0 y onSite < req)
          // VERDE: Cobertura contemplada (servicio completo: onSite >= req)
          let status: 'uncovered' | 'partial' | 'covered' = 'covered';
          if (req > 0) {
            if (onSite === 0) {
              status = 'uncovered'; // ROJO
            } else if (onSite < req) {
              status = 'partial'; // AMARILLO O NARANJA
            } else {
              status = 'covered'; // VERDE
            }
          } else if (onSite > 0) {
            status = 'covered'; // VERDE
          }

          if (req > 0 || onSite > 0) {
            allCoverages.push({
              id: p.id,
              name: p.name || p.code || 'Sin Nombre',
              code: p.code || '',
              required: req,
              onSite,
              missing,
              status
            });

            // Data para el gráfico de barras de cobertura
            coverageData.push({
              name: p.code || p.name,
              required: req,
              onSite: onSite,
            });
          }

          // Detectar déficit de cobertura
          if (onSite < req) {
            newDeficits.push({ name: p.name || p.code, required: req, onSite });
          }
        });

        // Orden de urgencia: Primero ROJO (Sin cubrir), luego AMARILLO/NARANJA (Por cubrirse), luego VERDE (Contemplado)
        allCoverages.sort((a, b) => {
          const priority = { uncovered: 0, partial: 1, covered: 2 };
          if (priority[a.status] !== priority[b.status]) {
            return priority[a.status] - priority[b.status];
          }
          return b.missing - a.missing;
        });

        const totalInSite = activeCount + doubleCount;
        const missing = Math.max(0, totalReq - totalInSite);
        const coverage = totalReq > 0 ? Math.round((totalInSite / totalReq) * 100) : (totalInSite > 0 ? 100 : 0);

        // Sincronización global de métricas en tiempo real
        setStats({
          required: totalReq,
          active: activeCount,
          double: doubleCount,
          missing,
          coverage
        });
        setDeficits(newDeficits);
        setPostCoverages(allCoverages);
        setProjectCoverageData(coverageData);
      });

      return () => unsubShifts();
    });

    return () => unsubProjects();
  }, []);

  const forceData = [
    { name: 'Activos', value: stats.active, fill: 'hsl(var(--primary))' },
    { name: 'Dobles', value: stats.double, fill: 'hsl(var(--destructive))' },
    { name: 'Faltantes', value: stats.missing, fill: 'hsl(24 95% 53%)' }, // Orange-500 HSL approx
  ];

  const chartConfig = {
    active: { label: "Activos", color: "hsl(var(--primary))" },
    double: { label: "Dobles", color: "hsl(var(--destructive))" },
    missing: { label: "Faltantes", color: "hsl(24 95% 53%)" },
    required: { label: "Requerido", color: "hsl(var(--muted-foreground))" },
    onSite: { label: "En Puesto", color: "hsl(var(--primary))" }
  };

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

      {/* Grid de Métricas con Sincronización Directa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl overflow-hidden relative group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Requeridos</p>
                <h4 className="text-4xl font-black text-white tabular-nums tracking-tighter">{stats.required}</h4>
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
                <h4 className="text-4xl font-black text-white tabular-nums tracking-tighter">{stats.active}</h4>
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
                <h4 className="text-4xl font-black text-red-500 tabular-nums tracking-tighter">{stats.double}</h4>
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
                <h4 className="text-4xl font-black text-orange-500 tabular-nums tracking-tighter">{stats.missing}</h4>
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
                <h4 className="text-4xl font-black text-green-500 tabular-nums tracking-tighter">{stats.coverage}%</h4>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <Progress value={stats.coverage} className="h-2 mt-4 bg-green-500/10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocolo de Alerta de Cobertura Sincronizado con Código Semántico de Colores */}
      {(() => {
        const uncoveredPosts = postCoverages.filter(p => p.status === 'uncovered');
        const partialPosts = postCoverages.filter(p => p.status === 'partial');
        const coveredPosts = postCoverages.filter(p => p.status === 'covered');

        const displayedPosts = postCoverages.filter(p => {
          if (coverageFilter === 'all') return true;
          return p.status === coverageFilter;
        });

        const hasUrgentDeficits = uncoveredPosts.length > 0 || partialPosts.length > 0;

        return (
          <Card className={`bg-[#1a1b2e] border-white/5 border-l-[6px] ${
            uncoveredPosts.length > 0 
              ? 'border-l-red-500 shadow-[0_0_35px_rgba(239,68,68,0.12)]' 
              : partialPosts.length > 0 
              ? 'border-l-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.12)]' 
              : 'border-l-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.12)]'
          } shadow-2xl transition-all duration-500`}>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                {/* Encabezado del Protocolo */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-white/5 pb-6">
                  <div className="flex items-start gap-4 md:gap-5">
                    <div className={`p-4 rounded-2xl border shrink-0 ${
                      uncoveredPosts.length > 0 
                        ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                        : partialPosts.length > 0
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    }`}>
                      <ShieldAlert className="h-8 w-8 md:h-9 md:w-9" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <h3 className={`text-lg md:text-xl font-black uppercase tracking-tight ${
                          uncoveredPosts.length > 0 ? 'text-red-500' : partialPosts.length > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {hasUrgentDeficits ? 'Protocolo de Alerta de Cobertura' : 'Sistema de Cobertura Contemplada'}
                        </h3>
                        {stats.missing > 0 && (
                          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] font-black px-2.5 py-0.5">
                            {stats.missing} FALTANTES TOTALES
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide max-w-3xl leading-relaxed">
                        {hasUrgentDeficits 
                          ? `Se han detectado puestos con requerimientos pendientes en la planilla del ${currentDay.toLowerCase()}. Se requiere atención inmediata conforme a la semaforización operativa:`
                          : `Todos los requerimientos operativos para el ${currentDay.toLowerCase()} han sido cubiertos según la planilla central.`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Leyenda Semántica de Colores */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">
                        ROJO: Sin cubrir
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                        AMARILLO/NARANJA: Por cubrirse
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                        VERDE: Contemplado
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filtros Tácticos de Visualización */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      Filtrar por Estado:
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverageFilter('all')}
                      className={`h-7 px-3 text-[9px] font-black uppercase rounded-lg transition-all ${
                        coverageFilter === 'all'
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-muted-foreground hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Todos ({postCoverages.length})
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverageFilter('uncovered')}
                      className={`h-7 px-3 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 ${
                        coverageFilter === 'uncovered'
                          ? 'bg-red-500/25 text-red-300 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          : 'text-red-400/80 hover:text-red-300 hover:bg-red-500/10'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Rojo · Sin Cubrir ({uncoveredPosts.length})
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverageFilter('partial')}
                      className={`h-7 px-3 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 ${
                        coverageFilter === 'partial'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Amarillo · Por Cubrirse ({partialPosts.length})
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverageFilter('covered')}
                      className={`h-7 px-3 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 ${
                        coverageFilter === 'covered'
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Verde · Contemplados ({coveredPosts.length})
                    </Button>
                  </div>
                </div>

                {/* Grid de Puestos con los Colores Semánticos */}
                {displayedPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {displayedPosts.map((d, i) => {
                      const isUncovered = d.status === 'uncovered';
                      const isPartial = d.status === 'partial';
                      const isCovered = d.status === 'covered';

                      // Clases semánticas por color:
                      // ROJO: Sin cubrir (0 en sitio)
                      // AMARILLO/NARANJA: Por cubrirse (cobertura parcial)
                      // VERDE: Cobertura contemplada (100% cubierto)
                      const cardStyle = isUncovered
                        ? 'bg-[#251317] border-red-500/30 hover:border-red-500/60 border-l-4 border-l-red-500 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                        : isPartial
                        ? 'bg-[#271d10] border-amber-500/30 hover:border-amber-500/60 border-l-4 border-l-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                        : 'bg-[#10251a] border-emerald-500/30 hover:border-emerald-500/60 border-l-4 border-l-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.08)]';

                      return (
                        <div 
                          key={d.id || i} 
                          className={`p-4 rounded-xl border transition-all duration-300 ${cardStyle} flex flex-col justify-between gap-3 group`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                              <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${
                                isUncovered ? 'text-red-400/70' : isPartial ? 'text-amber-400/70' : 'text-emerald-400/70'
                              }`}>
                                Puesto
                              </span>
                              <span className="text-xs font-black text-white uppercase mt-1 leading-snug truncate" title={d.name}>
                                {d.name}
                              </span>
                              {d.code && (
                                <span className={`text-[9px] font-mono font-bold mt-0.5 ${
                                  isUncovered ? 'text-red-400/90' : isPartial ? 'text-amber-400/90' : 'text-emerald-400/90'
                                }`}>
                                  [{d.code}]
                                </span>
                              )}
                            </div>

                            {/* Badge de Estado por Color */}
                            {isUncovered && (
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[8px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5 py-0.5 px-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                                ROJO · SIN CUBRIR
                              </Badge>
                            )}
                            {isPartial && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[8px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5 py-0.5 px-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                AMARILLO · POR CUBRIRSE
                              </Badge>
                            )}
                            {isCovered && (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[8px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5 py-0.5 px-2">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                                VERDE · CONTEMPLADO
                              </Badge>
                            )}
                          </div>

                          {/* Pie de la tarjeta con dotación y faltantes */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                            <div>
                              <span className="text-[8px] font-black text-muted-foreground uppercase block leading-none">
                                {isCovered ? 'Personal en Puesto' : 'Estado de Guardia'}
                              </span>
                              <span className={`text-[10px] font-bold uppercase mt-1 block ${
                                isUncovered ? 'text-red-300' : isPartial ? 'text-amber-300' : 'text-emerald-300'
                              }`}>
                                {isUncovered && `0 de ${d.required} en sitio`}
                                {isPartial && `${d.onSite} de ${d.required} en sitio (Parcial)`}
                                {isCovered && `${d.onSite} de ${d.required} en sitio (100%)`}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[8px] font-black text-muted-foreground uppercase block leading-none mb-1">
                                {isCovered ? 'Estado' : 'Faltantes'}
                              </span>
                              {isUncovered && (
                                <Badge variant="destructive" className="bg-red-500/25 text-red-200 border-red-500/40 text-[10px] font-black px-2 py-0.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                  {d.missing} DE {d.required}
                                </Badge>
                              )}
                              {isPartial && (
                                <Badge className="bg-amber-500/25 text-amber-200 border-amber-500/40 text-[10px] font-black px-2 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                  {d.missing} DE {d.required}
                                </Badge>
                              )}
                              {isCovered && (
                                <Badge className="bg-emerald-500/25 text-emerald-200 border-emerald-500/40 text-[10px] font-black px-2 py-0.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                  COMPLETO
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      No hay puestos en la categoría seleccionada.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Paneles Centrales de Análisis en Tiempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 bg-[#1a1b2e] border-white/5 h-[400px] shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-base font-black text-white uppercase tracking-tight">Estado de Fuerza</h3>
            </div>
            <div className="flex flex-col items-center justify-center h-[280px] text-center bg-white/[0.02] rounded-2xl p-4">
              <ChartContainer config={chartConfig}>
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
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="grid grid-cols-3 gap-2 w-full mt-4">
                {forceData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
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
                <ChartContainer config={chartConfig}>
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
                      <Bar dataKey="required" fill="var(--color-required)" radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar dataKey="onSite" fill="var(--color-onSite)" radius={[4, 4, 0, 0]} barSize={30} />
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
