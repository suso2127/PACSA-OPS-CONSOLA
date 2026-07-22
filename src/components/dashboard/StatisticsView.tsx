
"use client"

import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Zap,
  CalendarDays,
  Filter,
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
      {/* Cabecera Principal con Identidad Corporativa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">Inteligencia Operativa</h1>
          </div>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] ml-1">
            Análisis de Despliegue y Eficiencia — <span className="text-primary/70">PACSA OPS GROUP</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a1b2e] px-4 py-2 rounded-2xl border border-white/5 shadow-xl">
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
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
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
          <Badge variant="outline" className="hidden lg:flex bg-green-500/5 border-green-500/20 text-green-500 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-2xl">
            <Activity className="h-3 w-3 mr-2 animate-pulse" />
            Data Sincronizada
          </Badge>
        </div>
      </div>

      {/* Grid de KPIs Robustos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'CUMPLIMIENTO PROMEDIO', value: '94.2%', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
          { label: 'EFECTIVIDAD OPERATIVA', value: '98.5%', icon: Zap, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'HORAS TOTALES MES', value: '5,120H', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
          { label: 'ALERTAS DE AUSENCIA', value: '12', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
        ].map((kpi, i) => (
          <div key={i} className="bg-[#1a1b2e] border border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <kpi.icon className="h-20 w-20" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 ${kpi.bg} rounded-2xl border ${kpi.border}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{kpi.label}</span>
            </div>
            <h4 className="text-4xl font-black text-white tracking-tighter">{kpi.value}</h4>
          </div>
        ))}
      </div>

      {/* Bloque Central de Análisis de Despliegue */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-black tracking-tighter uppercase text-white">Análisis de Despliegue Semanal</h2>
        </div>
        
        <div className="bg-[#1a1b2e] border border-white/5 rounded-[40px] p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div className="space-y-2 text-center md:text-left">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Consolidado Global Clientes</p>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Tendencia Lunes a Viernes — {selectedMonth} {selectedYear}</h3>
            </div>
            
            <div className="flex items-center bg-[#25273c]/50 rounded-2xl border border-white/5 p-2 backdrop-blur-md">
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/5 text-muted-foreground hover:text-white">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="px-6 flex flex-col items-center">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Panel Operativo</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Sincronización Real</span>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/5 text-muted-foreground hover:text-white">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="h-[450px] w-full">
            <ChartContainer config={{
              total: { label: "REQUERIDO", color: "#3b82f6" },
              completados: { label: "ASIGNADO", color: "#10b981" },
              dobles: { label: "TURNOS DOBLES", color: "#ef4444" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff05" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: '1px' }}
                    dy={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '700' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent className="bg-[#1a1b2e] border-white/10" />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '40px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }} 
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="completados" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="dobles" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </section>

      {/* Paneles de Análisis Secundarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { title: 'Distribución por Cliente', icon: ShieldCheck, color: 'text-primary' },
          { title: 'Tendencia Mensual Histórica', icon: Activity, color: 'text-orange-500' }
        ].map((card, i) => (
          <div key={i} className="bg-[#1a1b2e] border border-white/5 rounded-[32px] p-10 flex flex-col items-center justify-center text-center h-[320px] shadow-2xl group transition-all duration-500 hover:bg-white/[0.02]">
            <div className={`p-5 bg-white/5 rounded-3xl mb-6 group-hover:scale-110 transition-transform ${card.color}`}>
              <card.icon className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-black uppercase tracking-tighter text-white">{card.title}</h4>
            <div className="flex items-center gap-2 mt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Módulo en Sincronización</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
