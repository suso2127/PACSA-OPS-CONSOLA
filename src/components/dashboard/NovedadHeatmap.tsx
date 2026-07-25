
"use client"

import React, { useMemo, useState } from 'react';
import { Novedad } from './NovedadesView';
import { 
  Calendar, 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  Filter,
  Info,
  ChevronRight
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NovedadHeatmapProps {
  novedades: Novedad[];
}

const INCIDENT_TYPES = [
  "Control de acceso", 
  "Emergencia médica", 
  "Robo/hurto", 
  "Daño a propiedad", 
  "Alteración del orden", 
  "Falla de equipo", 
  "Persona sospechosa", 
  "Vehículo sospechoso", 
  "Otro"
];

export function NovedadHeatmap({ novedades }: NovedadHeatmapProps) {
  const [dateRange, setDateRange] = useState('30');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredNovedades = useMemo(() => {
    const now = new Date();
    const days = parseInt(dateRange);
    
    return novedades.filter(n => {
      const nDate = n.fechaCreacion?.toDate ? n.fechaCreacion.toDate() : new Date(n.fechaCreacion);
      const diffTime = Math.abs(now.getTime() - nDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const matchesDate = dateRange === 'all' || diffDays <= days;
      const matchesSeverity = severityFilter === 'all' || n.severidad === severityFilter;
      
      return matchesDate && matchesSeverity;
    });
  }, [novedades, dateRange, severityFilter]);

  const projects = useMemo(() => {
    return Array.from(new Set(filteredNovedades.map(n => n.proyectoNombre))).sort();
  }, [filteredNovedades]);

  const matrix = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    
    projects.forEach(p => {
      data[p] = {};
      INCIDENT_TYPES.forEach(t => {
        data[p][t] = 0;
      });
    });

    filteredNovedades.forEach(n => {
      if (data[n.proyectoNombre] && data[n.proyectoNombre][n.tipoIncidente] !== undefined) {
        data[n.proyectoNombre][n.tipoIncidente]++;
      }
    });

    return data;
  }, [filteredNovedades, projects]);

  const topIncidents = useMemo(() => {
    const list: { proyecto: string, tipo: string, cantidad: number }[] = [];
    
    Object.entries(matrix).forEach(([proyecto, types]) => {
      Object.entries(types).forEach(([tipo, cantidad]) => {
        if (cantidad > 0) {
          list.push({ proyecto, tipo, cantidad });
        }
      });
    });

    return list.sort((a, b) => b.cantidad - a.cantidad).slice(0, 3);
  }, [matrix]);

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-white/[0.02] text-transparent hover:bg-white/5';
    if (count <= 2) return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/10 hover:bg-emerald-500/30';
    if (count <= 5) return 'bg-yellow-500/30 text-yellow-500 border-yellow-500/10 hover:bg-yellow-500/40';
    if (count <= 8) return 'bg-orange-500/40 text-orange-500 border-orange-500/10 hover:bg-orange-500/50';
    return 'bg-red-500/50 text-red-500 border-red-500/20 hover:bg-red-500/60 animate-pulse';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Barra de Filtros de Análisis */}
      <div className="flex flex-wrap items-center gap-4 bg-[#1a1b2e] p-5 rounded-2xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 border-r border-white/10 pr-6">
          <Activity className="h-5 w-5 text-accent" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Inteligencia de Incidentes</h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Rango Temporal</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-10 bg-[#0f101d] border-none text-[10px] font-black uppercase w-[160px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10">
                <SelectItem value="30" className="text-[10px] font-black uppercase">Últimos 30 días</SelectItem>
                <SelectItem value="90" className="text-[10px] font-black uppercase">Últimos 90 días</SelectItem>
                <SelectItem value="365" className="text-[10px] font-black uppercase">Año Actual</SelectItem>
                <SelectItem value="all" className="text-[10px] font-black uppercase">Historial Total</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Filtro Severidad</label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-10 bg-[#0f101d] border-none text-[10px] font-black uppercase w-[160px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10">
                <SelectItem value="all" className="text-[10px] font-black uppercase">Todas</SelectItem>
                <SelectItem value="Baja" className="text-[10px] font-black uppercase text-sky-500">Baja</SelectItem>
                <SelectItem value="Media" className="text-[10px] font-black uppercase text-orange-500">Media</SelectItem>
                <SelectItem value="Alta" className="text-[10px] font-black uppercase text-red-500">Alta</SelectItem>
                <SelectItem value="Crítica" className="text-[10px] font-black uppercase text-red-600 font-black">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="ml-auto">
          <Badge variant="outline" className="bg-accent/5 border-accent/20 text-accent text-[9px] font-black uppercase tracking-widest py-2 px-4 rounded-xl">
            Sincronización de Análisis: {filteredNovedades.length} Casos
          </Badge>
        </div>
      </div>

      {/* Matriz Heatmap */}
      <Card className="bg-[#1a1b2e] border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-6 text-left w-[250px] sticky left-0 bg-[#1a1b2e] z-10">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Proyecto / Cliente</span>
                  </th>
                  {INCIDENT_TYPES.map(type => (
                    <th key={type} className="p-4 text-center min-w-[120px]">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-tighter leading-none block transform -rotate-12">
                        {type}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? projects.map(p => (
                  <tr key={p} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="p-5 font-black text-xs text-white uppercase sticky left-0 bg-[#1a1b2e] z-10 border-r border-white/5">
                      {p}
                    </td>
                    {INCIDENT_TYPES.map(t => {
                      const count = matrix[p][t];
                      return (
                        <td key={t} className="p-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={cn(
                                  "w-full h-12 flex items-center justify-center rounded-lg border transition-all duration-300 font-mono text-base font-black cursor-crosshair",
                                  getHeatColor(count)
                                )}>
                                  {count > 0 ? count : ''}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#0f101d] border-white/10 p-3 shadow-2xl">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-primary uppercase">{p}</p>
                                  <p className="text-[11px] font-bold text-white">{t}</p>
                                  <div className="h-[1px] bg-white/5 my-2" />
                                  <p className="text-[9px] font-black text-muted-foreground uppercase">Frecuencia: <span className="text-white">{count} incidentes</span></p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      );
                    })}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={INCIDENT_TYPES.length + 1} className="py-32 text-center opacity-20 italic font-black uppercase tracking-widest">
                      Sin datos suficientes para procesar el mapa de calor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Prioridades */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Zonas de Intervención Prioritaria (Top 3)</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topIncidents.map((item, idx) => (
              <div key={idx} className="bg-[#1a1b2e] border-l-4 border-l-red-500 border-white/5 p-5 rounded-2xl shadow-xl group hover:scale-[1.02] transition-all">
                <div className="flex justify-between items-start mb-3">
                  <Badge className="bg-red-500/10 text-red-500 border-none text-[8px] font-black px-2">CRÍTICO</Badge>
                  <span className="text-2xl font-black text-white font-mono">{item.cantidad}</span>
                </div>
                <p className="text-[10px] font-black text-primary uppercase tracking-tighter truncate">{item.proyecto}</p>
                <h4 className="text-[11px] font-bold text-white uppercase mt-1">{item.tipo}</h4>
                <div className="mt-4 flex items-center justify-between text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                  <span>Análisis de riesgo</span>
                  <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
            {topIncidents.length === 0 && (
              <div className="col-span-3 py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center opacity-30">
                <Info className="h-8 w-8 mb-2" />
                <p className="text-[10px] font-black uppercase">Sin alertas de prioridad</p>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-4 bg-accent/5 border border-accent/20 rounded-[32px] p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <TrendingUp className="h-32 w-32 text-accent" />
          </div>
          <div className="flex items-center gap-3 text-accent mb-4">
            <Clock className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tendencia Operativa</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            El mapa de calor procesa <span className="text-white font-bold">{filteredNovedades.length}</span> registros en el periodo actual. Use esta matriz para reasignar recursos de supervisión o ajustar protocolos de seguridad en los nodos de alta temperatura.
          </p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-muted-foreground">Efectividad de Mitigación</span>
              <span className="text-[10px] font-black text-accent font-mono">92.4%</span>
            </div>
            <div className="h-1 w-full bg-accent/10 rounded-full overflow-hidden">
              <div className="h-full w-[92%] bg-accent rounded-full shadow-[0_0_10px_rgba(188,83,53,0.4)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
