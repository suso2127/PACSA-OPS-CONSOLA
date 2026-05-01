
"use client"

import React from 'react';
import { 
  BarChart3,
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Legend } from "recharts";

const chartData = [
  { name: 'Lun', total: 12, completados: 10 },
  { name: 'Mar', total: 15, completados: 14 },
  { name: 'Mie', total: 10, completados: 8 },
  { name: 'Jue', total: 18, completados: 17 },
  { name: 'Vie', total: 14, completados: 14 },
  { name: 'Sab', total: 20, completados: 19 },
  { name: 'Dom', total: 15, completados: 12 },
];

export function StatisticsView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Cabecera Principal */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Análisis Estadístico</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">Monitoreo de rendimiento y métricas de cumplimiento operacional</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Bloque de Análisis Semanal */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight uppercase">Cumplimiento Semanal</h2>
          </div>
          
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Planilla vs Realidad</p>
                <h3 className="text-2xl font-black">Registros de Turnos</h3>
              </div>
              
              <div className="flex items-center bg-[#25273c] rounded-xl border border-white/5 p-1.5">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/5">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-6 text-xs font-black font-mono text-primary">20 ABRIL — 26 ABRIL 2026</span>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/5">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ChartContainer config={{
                total: { label: "Total Requerido", color: "#7c3aed" },
                completados: { label: "Total Registrado", color: "#0ea5e9" }
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
                    <Bar dataKey="total" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={50} />
                    <Bar dataKey="completados" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={50} />
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
