
"use client"

import React, { useState, useEffect } from 'react';
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
  Activity
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

const chartData = [
  { name: 'LUNES', total: 60, completados: 55, dobles: 5 },
  { name: 'MARTES', total: 75, completados: 70, dobles: 8 },
  { name: 'MIÉRCOLES', total: 50, completados: 45, dobles: 12 },
  { name: 'JUEVES', total: 90, completados: 85, dobles: 10 },
  { name: 'VIERNES', total: 85, completados: 80, dobles: 5 },
];

const MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const YEARS = ['2024', '2025', '2026', '2027'];

export function StatisticsView() {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(MONTHS[now.getMonth()]);
    setSelectedYear(now.getFullYear().toString());
  }, []);

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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#1a1b2e] px-5 py-2.5 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
            <CalendarDays className="h-4 w-4 text-primary" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-white focus:ring-0 h-8 w-[120px] p-0">
                <SelectValue placeholder="MES" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                {MONTHS.map(month => (
                  <SelectItem key={month} value={month} className="text-[10px] font-black uppercase tracking-widest">{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-white focus:ring-0 h-8 w-[70px] p-0">
                <SelectValue placeholder="AÑO" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                {YEARS.map(year => (
                  <SelectItem key={year} value={year} className="text-[10px] font-black uppercase tracking-widest">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="hidden lg:flex bg-green-500/5 border-green-500/20 text-green-500 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2.5 rounded-2xl">
            <Activity className="h-3 w-3 mr-2 animate-pulse" />
            REAL-TIME SYNC
          </Badge>
        </div>
      </div>

      {/* KPIs de Alto Nivel - Monday to Friday Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'CUMPLIMIENTO PROMEDIO', value: '94.2%', icon: CheckCircle2, color: 'text-green-500', glow: 'bg-green-500/10' },
          { label: 'EFECTIVIDAD OPERATIVA', value: '98.5%', icon: Zap, color: 'text-primary', glow: 'bg-primary/10' },
          { label: 'HORAS TOTALES MES', value: '5,120H', icon: Clock, color: 'text-orange-500', glow: 'bg-orange-500/10' },
          { label: 'ALERTAS DE AUSENCIA', value: '12', icon: AlertTriangle, color: 'text-red-500', glow: 'bg-red-500/10' }
        ].map((kpi, i) => (
          <div key={i} className="bg-[#1a1b2e] border border-white/5 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-500">
            <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-all ${kpi.glow}`} />
            <div className="flex items-center gap-4 mb-5">
              <div className={`p-4 ${kpi.glow} rounded-2xl border border-white/5`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-tight">{kpi.label}</span>
            </div>
            <h4 className="text-5xl font-black text-white tracking-tighter font-mono">{kpi.value}</h4>
          </div>
        ))}
      </div>

      {/* Panel Analítico Central - Lunes a Viernes */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-black tracking-tighter uppercase text-white">Consolidado de Despliegue Semanal</h2>
        </div>
        
        <div className="bg-[#1a1b2e] border border-white/5 rounded-[48px] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Fondo Táctico */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
            <div className="space-y-3 text-center md:text-left">
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Análisis Global Clientes</p>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight">Tendencia Lunes - Viernes — {selectedMonth} {selectedYear}</h3>
            </div>
            
            <div className="flex items-center bg-[#25273c]/60 rounded-[24px] border border-white/5 p-2.5 backdrop-blur-xl">
              <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-white/5 text-muted-foreground hover:text-white rounded-full">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div className="px-10 flex flex-col items-center">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">MANDO OPERATIVO</span>
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Status Sincronizado</span>
              </div>
              <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-white/5 text-muted-foreground hover:text-white rounded-full">
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="h-[480px] w-full">
            <ChartContainer config={{
              total: { label: "CAPACIDAD REQUERIDA", color: "#3b82f6" },
              completados: { label: "FUERZA ASIGNADA", color: "#10b981" },
              dobles: { label: "TURNOS DOBLES", color: "#ef4444" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
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
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '60px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }} 
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="completados" fill="var(--color-completados)" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="dobles" fill="var(--color-dobles)" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </section>

      {/* Paneles de Auditoría Secundaria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { title: 'Distribución por Carteras', icon: ShieldCheck, color: 'text-primary', desc: 'Análisis proporcional de fuerza por segmento comercial.' },
          { title: 'Eficiencia por Cuadrante', icon: Activity, color: 'text-orange-500', desc: 'Mapa de calor operativo por zona geográfica de Panamá.' }
        ].map((card, i) => (
          <div key={i} className="bg-[#1a1b2e] border border-white/5 rounded-[40px] p-12 flex flex-col items-center justify-center text-center h-[340px] shadow-2xl group transition-all duration-700 hover:bg-white/[0.02] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`p-6 bg-white/5 rounded-[24px] mb-8 group-hover:scale-110 transition-transform ${card.color}`}>
              <card.icon className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tighter text-white mb-3">{card.title}</h4>
            <p className="text-[11px] font-medium text-muted-foreground/70 max-w-[260px] leading-relaxed mb-6">{card.desc}</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60">Procesando Coordenadas</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

