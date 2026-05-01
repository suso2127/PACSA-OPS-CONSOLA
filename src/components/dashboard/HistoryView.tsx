"use client"

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  BarChart3,
  Calendar as CalendarIcon,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Legend } from "recharts";

interface HistoryRecord {
  id: string;
  guardName: string;
  projectCode: string;
  projectName: string;
  shiftType: string;
  entryTime: Timestamp;
  exitTime?: Timestamp;
  status: string;
}

const chartData = [
  { name: 'Lun', total: 12, completados: 10 },
  { name: 'Mar', total: 15, completados: 14 },
  { name: 'Mie', total: 10, completados: 8 },
  { name: 'Jue', total: 18, completados: 17 },
  { name: 'Vie', total: 14, completados: 14 },
  { name: 'Sab', total: 20, completados: 19 },
  { name: 'Dom', total: 15, completados: 12 },
];

export function HistoryView() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [fromDate, setFromDate] = useState('2026-04-20');
  const [toDate, setToDate] = useState('2026-04-26');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'shift-registrations'),
        orderBy('entryTime', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HistoryRecord[];
      setRecords(fetched);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: Timestamp) => {
    if (!ts) return 'N/A';
    return ts.toDate().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (ts: Timestamp) => {
    if (!ts) return '--:--';
    return ts.toDate().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Seccion */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">Historial y Estadísticas</h1>
          <p className="text-muted-foreground text-sm font-mono">// Semanas y meses anteriores</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white border-none h-11 px-6 rounded-xl">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Reporte
          </Button>
        </div>
      </div>

      {/* Card de Cumplimiento Semanal */}
      <div className="bg-[#1a1b2e] border border-white/5 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Cumplimiento Semanal</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-[#25273c] rounded-lg border border-white/5 p-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Anterior</span>
              </Button>
              <span className="px-4 text-xs font-bold font-mono text-muted-foreground">20 abr — 26 abr 2026</span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Siguiente</span>
              </Button>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">RESUMEN MENSUAL</span>
          </div>
        </div>

        <div className="h-[250px] w-full mt-4">
          <ChartContainer config={{
            total: { label: "Total", color: "#7c3aed" },
            completados: { label: "Completados", color: "#0ea5e9" }
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend verticalAlign="bottom" height={36} iconType="rect" />
                <Bar dataKey="total" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="completados" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Filtros de Historial */}
      <div className="bg-[#1a1b2e] border border-white/5 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 text-primary">
          <div className="h-2 w-2 bg-primary rotate-45" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em]">Historial de Registros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-3 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Desde</Label>
            <div className="relative">
              <Input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-[#0f101d] border-none h-12 focus:ring-1 focus:ring-primary/50 font-mono text-sm"
              />
            </div>
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hasta</Label>
            <div className="relative">
              <Input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-[#0f101d] border-none h-12 focus:ring-1 focus:ring-primary/50 font-mono text-sm"
              />
            </div>
          </div>
          <div className="md:col-span-4 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Guardia</Label>
            <div className="relative">
              <Input 
                placeholder="Nombre..." 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="bg-[#0f101d] border-none h-12 focus:ring-1 focus:ring-primary/50 pl-10"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="md:col-span-2">
            <Button className="w-full h-12 bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold uppercase tracking-widest rounded-lg">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Tabla de Registros */}
        <div className="pt-8 overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-white/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-12">Fecha</TableHead>
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-12">Guardia</TableHead>
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-12">Proyecto</TableHead>
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-12">Turno</TableHead>
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-12 text-center">Entrada</TableHead>
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-12 text-center">Salida</TableHead>
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-12 text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">Cargando historial...</TableCell>
                </TableRow>
              ) : records.length > 0 ? (
                records.map((record) => (
                  <TableRow key={record.id} className="border-b border-white/5 hover:bg-white/5">
                    <TableCell className="font-mono text-xs">{formatDate(record.entryTime)}</TableCell>
                    <TableCell className="font-bold text-sm">{record.guardName}</TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-primary">{record.projectCode}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{record.projectName}</div>
                    </TableCell>
                    <TableCell className="text-xs">{record.shiftType}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{formatTime(record.entryTime)}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{formatTime(record.exitTime!)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter ${
                        record.status === 'Activo' ? 'border-green-500/50 text-green-500' : 'border-sky-500/50 text-sky-500'
                      }`}>
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">No se encontraron registros para el periodo seleccionado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
