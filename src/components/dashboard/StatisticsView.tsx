"use client"

import React, { useState } from 'react';
import { 
  BarChart3,
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  CalendarDays,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Legend } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const chartData = [
  { name: 'Sem 1', total: 60, completados: 55, dobles: 5 },
  { name: 'Sem 2', total: 75, completados: 70, dobles: 8 },
  { name: 'Sem 3', total: 50, completados: 45, dobles: 12 },
  { name: 'Sem 4', total: 90, completados: 85, dobles: 10 },
];

const MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const YEARS = ['2024', '2025', '2026'];

export function StatisticsView() {
  const [selectedMonth, setSelectedMonth] = useState('ABRIL');
  const [selectedYear, setSelectedYear] = useState('2026');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Cabecera Principal */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Análisis Estadístico</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">Monitoreo de rendimiento y métricas de cumplimiento operacional</p>
      </div>

      {/* Indicadores de Rendimiento de Alto Impacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1b2e] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center gap-4 group hover:border-green-500/20 transition-all">
          <div className="p-3 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cumplimiento Promedio</p>
            <h4 className="text-2xl font-black text-white">94.2%</h4>
          </div>
        </div>
        
        <div className="bg-[#1a1b2e] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center gap-4 group hover:border-primary/20 transition-all">
          <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Efectividad Operativa</p>
            <h4 className="text-2xl font-black text-white">98.5%</h4>
          </div>
        </div>

        <div className="bg-[#1a1b2e] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center gap-4 group hover:border-orange-500/20 transition-all">
          <div className="p-3 bg-orange-500/10 rounded-xl group-hover:scale-110 transition-transform">
            <Clock className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Horas Totales Mes</p>
            <h4 className="text-2xl font-black text-white">5,120h</h4>
          </div>
        </div>

        <div className="bg-[#1a1b2e] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center gap-4 group hover:border-red-500/20 transition-all">
          <div className="p-3 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Alertas de Ausencia</p>
            <h4 className="text-2xl font-black text-white">12</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Bloque de Análisis Mensual */}
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold tracking-tight uppercase">Análisis Comparativo Mensual</h2>
            </div>
            
            {/* Filtros de Mes y Año */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[#1a1b2e] px-3 py-0 rounded-xl h-11 border border-white/5">
                <CalendarDays className="h-4 w-4 text-primary" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 h-full p-0 w-[100px]">
                    <SelectValue placeholder="MES" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                    {MONTHS.map(month => (
                      <SelectItem key={month} value={month} className="text-[10px] font-black uppercase">{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 bg-[#1a1b2e] px-3 py-0 rounded-xl h-11 border border-white/5">
                <Filter className="h-4 w-4 text-primary" />
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 h-full p-0 w-[70px]">
                    <SelectValue placeholder="AÑO" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                    {YEARS.map(year => (
                      <SelectItem key={year} value={year} className="text-[10px] font-black uppercase">{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Planilla vs Realidad</p>
                <h3 className="text-2xl font-black uppercase">Registros de Turnos — {selectedMonth} {selectedYear}</h3>
              </div>
              
              <div className="flex items-center bg-[#25273c] rounded-xl border border-white/5 p-1.5">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/5">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-6 text-[11px] font-black font-mono text-primary uppercase tracking-widest">
                  PANEL OPERATIVO {selectedMONTH}
                </span>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/5">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ChartContainer config={{
                total: { label: "Total Requerido", color: "#1e3a8a" },
                completados: { label: "Total Registrado", color: "#10b981" },
                dobles: { label: "Turnos Dobles", color: "#ef4444" }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff05" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                      dy={10}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
                    <Bar dataKey="total" fill="#1e3a8a" radius={[6, 6, 0, 0]} barSize={35} />
                    <Bar dataKey="completados" fill="#10b981" radius={[6, 6, 0, 0]} barSize={35} />
                    <Bar dataKey="dobles" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </section>

        {/* Otros Gráficos Futuros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-[300px]">
            <div className="p-4 bg-secondary rounded-full mb-4">
              <PieIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/50">Distribución por Cliente</p>
            <p className="text-xs text-muted-foreground/30 mt-2">Módulo en preparación</p>
          </div>
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-[300px]">
            <div className="p-4 bg-secondary rounded-full mb-4">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/50">Tendencia Mensual</p>
            <p className="text-xs text-muted-foreground/30 mt-2">Módulo en preparación</p>
          </div>
        </div>
      </div>
    </div>
  );
}
