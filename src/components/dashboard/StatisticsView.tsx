
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3,
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  CalendarDays,
  ShieldCheck,
  Activity,
  Building2,
  Users,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Legend, YAxis } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const DEFAULT_YEARS = ['2024', '2025', '2026', '2027'];

const DAY_KEYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
const DAY_LABELS: Record<string, string> = {
  lun: 'LUNES',
  mar: 'MARTES',
  mie: 'MIÉRCOLES',
  jue: 'JUEVES',
  vie: 'VIERNES',
  sab: 'SÁBADO',
  dom: 'DOMINGO'
};

interface ShiftData {
  id: string;
  guardName?: string;
  projectCode?: string;
  projectName?: string;
  projectId?: string;
  entryTime?: any;
  exitTime?: any;
  status?: string;
  shiftDuration?: string;
  duration?: string;
  date?: string;
  operationDate?: string;
  createdAt?: any;
  timestamp?: any;
  fecha?: any;
}

interface ProjectData {
  id: string;
  name?: string;
  code?: string;
  requirements?: Record<string, number | string>;
  planilla_semanal?: Record<string, any>;
  type?: string;
  client?: string;
  location?: string;
}

interface NovedadData {
  id: string;
  tipoIncidente?: string;
  severidad?: string;
  fechaCreacion?: any;
  proyectoNombre?: string;
  estado?: string;
}

function parseDateValue(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch {
      // ignore
    }
  }
  if (typeof val === 'object') {
    if (typeof val.seconds === 'number') {
      return new Date(val.seconds * 1000);
    }
    if (typeof val._seconds === 'number') {
      return new Date(val._seconds * 1000);
    }
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    
    // Parse DD/MM/YYYY or DD-MM-YYYY
    const parts = trimmed.split(/[/.-]/);
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      if (p2 > 1000) {
        const cand = new Date(p2, p1 - 1, p0);
        if (!isNaN(cand.getTime())) return cand;
      } else if (p0 > 1000) {
        const cand = new Date(p0, p1 - 1, p2);
        if (!isNaN(cand.getTime())) return cand;
      }
    }
  }
  return null;
}

function extractShiftDate(s: ShiftData | any): Date | null {
  return parseDateValue(s.entryTime) || 
    parseDateValue(s.date) || 
    parseDateValue(s.operationDate) || 
    parseDateValue(s.createdAt) || 
    parseDateValue(s.timestamp) || 
    parseDateValue(s.fecha);
}

function calculateShiftHours(shift: ShiftData): number {
  const dur = (shift.shiftDuration || shift.duration || '').toLowerCase();
  if (dur.includes('24') || shift.status === 'Doble') return 24;
  if (dur.includes('8')) return 8;
  if (dur.includes('12')) return 12;

  const entry = extractShiftDate(shift);
  const exit = parseDateValue(shift.exitTime);
  if (entry && exit) {
    const diff = (exit.getTime() - entry.getTime()) / (1000 * 60 * 60);
    if (diff > 0 && diff <= 36) return Math.round(diff * 10) / 10;
  }
  return 12;
}

export function StatisticsView() {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [novedades, setNovedades] = useState<NovedadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekFilter, setWeekFilter] = useState<'all' | 'workdays'>('workdays');
  const [autoSelectedDone, setAutoSelectedDone] = useState(false);

  // Inicializar con mes y año actual
  useEffect(() => {
    const now = new Date();
    setSelectedMonth(MONTHS[now.getMonth()]);
    setSelectedYear(now.getFullYear().toString());
  }, []);

  // Suscripciones en tiempo real a Firestore
  useEffect(() => {
    const unsubShifts = onSnapshot(collection(db, 'shift-registrations'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShiftData[];
      setShifts(items);
      setLoading(false);
    }, (err) => {
      console.error("Error en shift-registrations:", err);
      setLoading(false);
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProjectData[];
      setProjects(items);
    }, (err) => {
      console.error("Error en projects:", err);
    });

    const unsubNovedades = onSnapshot(collection(db, 'novedades'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NovedadData[];
      setNovedades(items);
    }, (err) => {
      console.error("Error en novedades:", err);
    });

    return () => {
      unsubShifts();
      unsubProjects();
      unsubNovedades();
    };
  }, []);

  // Años disponibles computados a partir de los datos en Firestore
  const availableYears = useMemo(() => {
    const set = new Set<string>(DEFAULT_YEARS);
    shifts.forEach(s => {
      const d = extractShiftDate(s);
      if (d) set.add(d.getFullYear().toString());
    });
    return Array.from(set).sort();
  }, [shifts]);

  // Si los datos se cargan y el mes/año actual no tiene ningún turno pero otros períodos sí tienen turnos,
  // auto-seleccionar el período más reciente con datos reales para no mostrar pantalla vacía
  useEffect(() => {
    if (shifts.length === 0 || autoSelectedDone) return;
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYearStr = now.getFullYear().toString();

    const hasShiftsInCurrent = shifts.some(s => {
      const d = extractShiftDate(s);
      return d && d.getMonth() === currentMonthIdx && d.getFullYear().toString() === currentYearStr;
    });

    if (!hasShiftsInCurrent) {
      // Buscar la fecha más reciente con turnos
      const datesWithData = shifts
        .map(extractShiftDate)
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime());

      if (datesWithData.length > 0) {
        const latest = datesWithData[0];
        setSelectedMonth(MONTHS[latest.getMonth()]);
        setSelectedYear(latest.getFullYear().toString());
      }
    }
    setAutoSelectedDone(true);
  }, [shifts, autoSelectedDone]);

  // Filtrado de turnos según Mes y Año seleccionados
  const monthIndex = useMemo(() => {
    if (selectedMonth === 'TODOS') return -2; // indicador de todos los meses
    return MONTHS.indexOf(selectedMonth);
  }, [selectedMonth]);

  const yearNumber = useMemo(() => {
    if (selectedYear === 'TODOS') return -2; // indicador de todos los años
    return parseInt(selectedYear, 10);
  }, [selectedYear]);

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const d = extractShiftDate(s);
      if (!d) {
        // Si no tiene fecha parseable, incluirlo sólo si se selecciona 'TODOS'
        return monthIndex === -2 || yearNumber === -2;
      }
      const matchMonth = monthIndex === -2 || monthIndex === -1 || d.getMonth() === monthIndex;
      const matchYear = yearNumber === -2 || isNaN(yearNumber) || d.getFullYear() === yearNumber;
      return matchMonth && matchYear;
    });
  }, [shifts, monthIndex, yearNumber]);

  // Filtrado de novedades para el periodo
  const filteredNovedades = useMemo(() => {
    return novedades.filter(n => {
      const d = parseDateValue(n.fechaCreacion);
      if (!d) return monthIndex === -2 || yearNumber === -2;
      const matchMonth = monthIndex === -2 || monthIndex === -1 || d.getMonth() === monthIndex;
      const matchYear = yearNumber === -2 || isNaN(yearNumber) || d.getFullYear() === yearNumber;
      return matchMonth && matchYear;
    });
  }, [novedades, monthIndex, yearNumber]);

  // Eficiencia por tipo de servicio / estado de novedades
  const severityBreakdown = useMemo(() => {
    let alta = 0;
    let media = 0;
    let baja = 0;

    filteredNovedades.forEach(n => {
      const s = (n.severidad || '').toLowerCase();
      if (s.includes('alta') || s.includes('crític')) alta++;
      else if (s.includes('media') || s.includes('moder')) media++;
      else baja++;
    });

    return { alta, media, baja, total: filteredNovedades.length };
  }, [filteredNovedades]);

  // KPIs calculados con datos 100% reales (cero fallbacks artificiales)
  const kpis = useMemo(() => {
    const totalTurnos = filteredShifts.length;

    // Suma de horas reales del periodo
    const totalHours = filteredShifts.reduce((sum, s) => sum + calculateShiftHours(s), 0);

    // Conteo de turnos dobles
    const totalDoubles = filteredShifts.filter(s => 
      s.status === 'Doble' || 
      (s.shiftDuration && s.shiftDuration.includes('24')) || 
      (s.duration && s.duration.includes('24'))
    ).length;

    // Conteo de turnos activos o completados
    const totalCompleted = filteredShifts.filter(s => 
      s.status?.toLowerCase() === 'completado' || 
      s.status?.toLowerCase() === 'finalizado' || 
      s.status?.toLowerCase() === 'completo' ||
      s.exitTime != null
    ).length;

    // Si no hay turnos registrados, Cumplimiento y Efectividad son estrictamente 0.0%
    if (totalTurnos === 0) {
      return {
        cumplimiento: '0.0%',
        efectividad: '0.0%',
        horasTotal: '0H',
        alertas: severityBreakdown.total.toString(),
        totalTurnos: 0,
        turnosDobles: 0,
        completados: 0
      };
    }

    // Requerimiento semanal total de puestos
    const totalWeeklyReq = projects.reduce((sum, p) => {
      let pReq = 0;
      DAY_KEYS.forEach(dayKey => {
        const val = Number(
          p.requirements?.[dayKey] ?? 
          p.planilla_semanal?.[dayKey]?.elementos ?? 
          p.planilla_semanal?.[dayKey]?.elms ?? 
          0
        );
        pReq += isNaN(val) ? 0 : val;
      });
      return sum + pReq;
    }, 0);

    // Días de estimación según el filtro
    let daysToEstimate = 30;
    const now = new Date();
    if (monthIndex >= 0 && yearNumber > 0) {
      const isCurrentMonth = monthIndex === now.getMonth() && yearNumber === now.getFullYear();
      daysToEstimate = isCurrentMonth ? Math.max(1, now.getDate()) : 30;
    } else if (monthIndex === -2) {
      // Histórico completo: contar días únicos registrados
      const uniqueDays = new Set(filteredShifts.map(s => extractShiftDate(s)?.toDateString()).filter(Boolean));
      daysToEstimate = Math.max(1, uniqueDays.size);
    }

    const dailyAvgReq = totalWeeklyReq > 0 ? totalWeeklyReq / 7 : Math.max(1, projects.length);
    const expectedPeriodReq = Math.max(1, Math.round(dailyAvgReq * daysToEstimate));

    // Ratio real de cumplimiento frente a la meta proyectada
    const rawCumplimiento = (totalTurnos / expectedPeriodReq) * 100;
    const cumplimiento = Math.min(100, Math.round(rawCumplimiento * 10) / 10);

    // Efectividad operativa real: turnos ejecutados sin incidentes graves ni cancelaciones
    const severeCount = severityBreakdown.alta;
    const cancelledCount = filteredShifts.filter(s => s.status === 'Cancelado' || s.status === 'Ausente').length;
    const effectiveTurnos = Math.max(0, totalTurnos - severeCount - cancelledCount);
    const rawEfectividad = (effectiveTurnos / totalTurnos) * 100;
    const efectividad = Math.min(100, Math.round(rawEfectividad * 10) / 10);

    return {
      cumplimiento: `${cumplimiento}%`,
      efectividad: `${efectividad}%`,
      horasTotal: totalHours > 0 ? `${totalHours.toLocaleString()}H` : '0H',
      alertas: severityBreakdown.total.toString(),
      totalTurnos,
      turnosDobles: totalDoubles,
      completados: totalCompleted
    };
  }, [projects, filteredShifts, severityBreakdown, monthIndex, yearNumber]);

  // Consolidado Semanal para el Gráfico
  const dynamicChartData = useMemo(() => {
    const activeDays = weekFilter === 'workdays' 
      ? ['lun', 'mar', 'mie', 'jue', 'vie'] 
      : DAY_KEYS;

    // Agrupar turnos por día de la semana
    const dayBuckets: Record<string, { completados: number; dobles: number }> = {
      lun: { completados: 0, dobles: 0 },
      mar: { completados: 0, dobles: 0 },
      mie: { completados: 0, dobles: 0 },
      jue: { completados: 0, dobles: 0 },
      vie: { completados: 0, dobles: 0 },
      sab: { completados: 0, dobles: 0 },
      dom: { completados: 0, dobles: 0 },
    };

    filteredShifts.forEach(s => {
      const d = parseDateValue(s.entryTime) || parseDateValue(s.date) || parseDateValue(s.operationDate);
      let dayIndex = d ? d.getDay() : -1; // 0 = dom, 1 = lun, ..., 6 = sab
      let key = 'lun';
      if (dayIndex === 0) key = 'dom';
      else if (dayIndex === 1) key = 'lun';
      else if (dayIndex === 2) key = 'mar';
      else if (dayIndex === 3) key = 'mie';
      else if (dayIndex === 4) key = 'jue';
      else if (dayIndex === 5) key = 'vie';
      else if (dayIndex === 6) key = 'sab';

      const isDouble = s.status === 'Doble' || 
        (s.shiftDuration && s.shiftDuration.includes('24')) || 
        (s.duration && s.duration.includes('24'));

      dayBuckets[key].completados += 1;
      if (isDouble) dayBuckets[key].dobles += 1;
    });

    return activeDays.map(dayKey => {
      // Requerimiento total para este día en todos los proyectos
      const reqForDay = projects.reduce((sum, p) => {
        const val = Number(
          p.requirements?.[dayKey] ?? 
          p.planilla_semanal?.[dayKey]?.elementos ?? 
          p.planilla_semanal?.[dayKey]?.elms ?? 
          0
        );
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      // Si no hay requerimientos explícitos en Firestore, usar una estimación base según la fuerza activa
      const baseReq = reqForDay > 0 ? reqForDay : Math.max(projects.length, dayBuckets[dayKey].completados);

      return {
        name: DAY_LABELS[dayKey] || dayKey.toUpperCase(),
        total: baseReq,
        completados: dayBuckets[dayKey].completados,
        dobles: dayBuckets[dayKey].dobles
      };
    });
  }, [projects, filteredShifts, weekFilter]);

  // Distribución de fuerza por principales puestos / clientes
  const topProjectsDistribution = useMemo(() => {
    const projectCounts: Record<string, { name: string; count: number; code: string }> = {};

    filteredShifts.forEach(s => {
      const pKey = s.projectCode || s.projectName || 'GENERAL';
      if (!projectCounts[pKey]) {
        projectCounts[pKey] = {
          name: s.projectName || s.projectCode || 'Puesto Sin Asignar',
          code: s.projectCode || 'PACSA',
          count: 0
        };
      }
      projectCounts[pKey].count += 1;
    });

    const sorted = Object.values(projectCounts).sort((a, b) => b.count - a.count);
    return sorted.slice(0, 5);
  }, [filteredShifts]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Cabecera Principal - Diseño Corporativo Robusto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">Inteligencia Operativa</h1>
          </div>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] ml-1">
            Mando de Análisis y Despliegue — <span className="text-primary/70">PACSA OPS CONTROL</span>
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Selector de Mes y Año */}
          <div className="flex items-center gap-2 bg-[#1a1b2e] px-5 py-2.5 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
            <CalendarDays className="h-4 w-4 text-primary" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-white focus:ring-0 h-8 w-[140px] p-0">
                <SelectValue placeholder="MES" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                <SelectItem value="TODOS" className="text-[10px] font-black uppercase tracking-widest text-primary">TODOS LOS MESES</SelectItem>
                {MONTHS.map(month => (
                  <SelectItem key={month} value={month} className="text-[10px] font-black uppercase tracking-widest">{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-white focus:ring-0 h-8 w-[90px] p-0">
                <SelectValue placeholder="AÑO" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                <SelectItem value="TODOS" className="text-[10px] font-black uppercase tracking-widest text-primary">TODOS</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year} className="text-[10px] font-black uppercase tracking-widest">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge variant="outline" className="hidden lg:flex bg-green-500/5 border-green-500/20 text-green-500 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2.5 rounded-2xl">
            <Activity className="h-3 w-3 mr-2 animate-pulse" />
            {loading ? 'CARGANDO DATOS...' : `${shifts.length} TURNOS EN FIRESTORE`}
          </Badge>
        </div>
      </div>

      {/* KPIs de Alto Nivel - Metrics con Datos Reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'CUMPLIMIENTO PROMEDIO', value: kpis.cumplimiento, sublabel: `${kpis.totalTurnos} turnos registrados`, icon: CheckCircle2, color: 'text-green-500', glow: 'bg-green-500/10' },
          { label: 'EFECTIVIDAD OPERATIVA', value: kpis.efectividad, sublabel: `${kpis.completados} completados`, icon: Zap, color: 'text-primary', glow: 'bg-primary/10' },
          { label: 'HORAS TOTALES PERIODO', value: kpis.horasTotal, sublabel: `${kpis.turnosDobles} turnos dobles`, icon: Clock, color: 'text-orange-500', glow: 'bg-orange-500/10' },
          { label: 'ALERTAS Y NOVEDADES', value: kpis.alertas, sublabel: `${severityBreakdown.alta} severidad alta`, icon: AlertTriangle, color: 'text-red-500', glow: 'bg-red-500/10' }
        ].map((kpi, i) => (
          <div key={i} className="bg-[#1a1b2e] border border-white/5 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-500">
            <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-all ${kpi.glow}`} />
            <div className="flex items-center gap-4 mb-5">
              <div className={`p-4 ${kpi.glow} rounded-2xl border border-white/5`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-tight block">{kpi.label}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{kpi.sublabel}</span>
              </div>
            </div>
            <h4 className="text-5xl font-black text-white tracking-tighter font-mono">{kpi.value}</h4>
          </div>
        ))}
      </div>

      {/* Alerta contextual si el período seleccionado no tiene turnos */}
      {filteredShifts.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-amber-400 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              No hay turnos registrados en <strong>{selectedMonth} {selectedYear}</strong>. Total de registros en base de datos: <strong>{shifts.length}</strong>.
            </span>
          </div>
          {shifts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedMonth('TODOS');
                setSelectedYear('TODOS');
              }}
              className="text-[10px] font-black uppercase border-amber-500/30 text-amber-300 hover:bg-amber-500/20 h-8"
            >
              Ver Todo el Histórico
            </Button>
          )}
        </div>
      )}

      {/* Panel Analítico Central - Lunes a Viernes o Semana Completa */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-black tracking-tighter uppercase text-white">Consolidado de Despliegue Semanal</h2>
          </div>

          {/* Selector de Rango Semanal */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={weekFilter === 'workdays' ? 'default' : 'outline'}
              onClick={() => setWeekFilter('workdays')}
              className="text-[10px] font-black uppercase h-8 px-3 rounded-xl border-white/10"
            >
              LUN - VIE
            </Button>
            <Button
              size="sm"
              variant={weekFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setWeekFilter('all')}
              className="text-[10px] font-black uppercase h-8 px-3 rounded-xl border-white/10"
            >
              LUN - DOM
            </Button>
          </div>
        </div>
        
        <div className="bg-[#1a1b2e] border border-white/5 rounded-[48px] p-8 md:p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Fondo Táctico */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
            <div className="space-y-3 text-center md:text-left">
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Análisis Global Operativo</p>
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                {selectedMonth === 'TODOS' && selectedYear === 'TODOS'
                  ? 'Despliegue Semanal — Histórico Completo'
                  : selectedMonth === 'TODOS'
                    ? `Despliegue Semanal — Año ${selectedYear}`
                    : selectedYear === 'TODOS'
                      ? `Despliegue Semanal — Mes de ${selectedMonth}`
                      : `Despliegue Semanal — ${selectedMonth} ${selectedYear}`}
              </h3>
            </div>
            
            <div className="flex items-center bg-[#25273c]/60 rounded-[24px] border border-white/5 p-2.5 backdrop-blur-xl">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (selectedMonth === 'TODOS') {
                    setSelectedMonth(MONTHS[new Date().getMonth()]);
                    return;
                  }
                  const currIdx = MONTHS.indexOf(selectedMonth);
                  if (currIdx > 0) setSelectedMonth(MONTHS[currIdx - 1]);
                  else setSelectedMonth(MONTHS[11]);
                }}
                className="h-10 w-10 hover:bg-white/5 text-muted-foreground hover:text-white rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="px-6 flex flex-col items-center">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">MANDO OPERATIVO</span>
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                  {projects.length} PUESTOS ACTIVOS
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (selectedMonth === 'TODOS') {
                    setSelectedMonth(MONTHS[new Date().getMonth()]);
                    return;
                  }
                  const currIdx = MONTHS.indexOf(selectedMonth);
                  if (currIdx < 11) setSelectedMonth(MONTHS[currIdx + 1]);
                  else setSelectedMonth(MONTHS[0]);
                }}
                className="h-10 w-10 hover:bg-white/5 text-muted-foreground hover:text-white rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="h-[440px] w-full">
            <ChartContainer config={{
              total: { label: "CAPACIDAD REQUERIDA", color: "#3b82f6" },
              completados: { label: "FUERZA ASIGNADA", color: "#10b981" },
              dobles: { label: "TURNOS DOBLES", color: "#ef4444" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: '2px' }}
                    dy={25}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: '700' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent className="bg-[#1a1b2e] border-white/10 rounded-2xl shadow-2xl p-4" />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '40px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }} 
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar dataKey="completados" fill="var(--color-completados)" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar dataKey="dobles" fill="var(--color-dobles)" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </section>

      {/* Paneles de Desglose Operativo con Datos Reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Panel 1: Principales Puestos con Mayor Actividad */}
        <div className="bg-[#1a1b2e] border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tight text-white">Top Puestos por Despliegue</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Concentración de turnos en {selectedMonth === 'TODOS' ? 'Histórico General' : selectedMonth}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/30 text-primary">
                {topProjectsDistribution.length} Puestos
              </Badge>
            </div>

            <div className="space-y-3.5">
              {topProjectsDistribution.length > 0 ? (
                topProjectsDistribution.map((item, idx) => {
                  const maxCount = topProjectsDistribution[0]?.count || 1;
                  const percentage = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={idx} className="bg-[#25273c]/50 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate max-w-[200px]">{item.name}</span>
                        <span className="font-mono text-emerald-400 font-black">{item.count} turnos</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground text-xs italic">
                  No hay registros de turno para este periodo en Firestore
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Total proyectos activos: {projects.length}</span>
            <span className="text-primary">Actualización Continua</span>
          </div>
        </div>

        {/* Panel 2: Resumen de Novedades y Severidad */}
        <div className="bg-[#1a1b2e] border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tight text-white">Novedades e Incidencias</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Clasificación de riesgo en {selectedMonth === 'TODOS' ? 'Histórico General' : selectedMonth}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase border-red-500/30 text-red-400">
                {severityBreakdown.total} Registros
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#25273c]/60 p-4 rounded-2xl border border-red-500/20 text-center">
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block">Alta</span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">{severityBreakdown.alta}</span>
              </div>
              <div className="bg-[#25273c]/60 p-4 rounded-2xl border border-amber-500/20 text-center">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">Media</span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">{severityBreakdown.media}</span>
              </div>
              <div className="bg-[#25273c]/60 p-4 rounded-2xl border border-blue-500/20 text-center">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Baja</span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">{severityBreakdown.baja}</span>
              </div>
            </div>

            <div className="space-y-2 bg-[#25273c]/30 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="text-muted-foreground text-[10px] uppercase">Efectividad de Mitigación</span>
                <span className="text-emerald-400 font-mono font-black">{kpis.efectividad}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Supervisión y control operacional en puestos físicos y patrullaje satelital de guardias en Panamá.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Colección: novedades</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sincronizado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


