
"use client"

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Printer, 
  Search, 
  User,
  Filter
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

interface HistoryRecord {
  id: string;
  guardName: string;
  projectCode: string;
  projectName: string;
  shiftType: string;
  entryTime: any;
  exitTime?: any;
  status: string;
}

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

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    if (typeof ts === 'string') return ts;
    
    let date: Date;
    if (ts && typeof ts.toDate === 'function') {
      date = ts.toDate();
    } else if (typeof ts === 'number' || !isNaN(Date.parse(ts))) {
      date = new Date(ts);
    } else {
      return 'N/A';
    }

    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (ts: any) => {
    if (!ts) return '--:--';
    
    let date: Date;
    if (ts && typeof ts.toDate === 'function') {
      date = ts.toDate();
    } else if (typeof ts === 'number' || !isNaN(Date.parse(ts))) {
      date = new Date(ts);
    } else {
      return '--:--';
    }

    if (isNaN(date.getTime())) return '--:--';

    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Historial Operativo</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Gestión y auditoría de registros de seguridad PACSA</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white border-none h-11 px-6 rounded-xl shadow-lg shadow-blue-500/10">
            <Printer className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Bloque de Listado de Registros */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Filter className="h-5 w-5 text-accent" />
          </div>
          <h2 className="text-xl font-bold tracking-tight uppercase">Registros Históricos</h2>
        </div>

        <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Panel de Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-8 border-b border-white/5">
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Fecha Inicio</Label>
              <Input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-[#0f101d] border-none h-12 focus:ring-1 focus:ring-primary/50 font-mono text-sm rounded-xl"
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Fecha Fin</Label>
              <Input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-[#0f101d] border-none h-12 focus:ring-1 focus:ring-primary/50 font-mono text-sm rounded-xl"
              />
            </div>
            <div className="md:col-span-4 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Buscar Guardia</Label>
              <div className="relative">
                <Input 
                  placeholder="Nombre del elemento..." 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="bg-[#0f101d] border-none h-12 focus:ring-1 focus:ring-primary/50 pl-11 rounded-xl"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="md:col-span-2">
              <Button className="w-full h-12 bg-[#25273c] hover:bg-primary hover:text-primary-foreground border border-white/5 font-bold uppercase tracking-widest rounded-xl transition-all duration-300">
                <Search className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="pt-8">
            <div className="overflow-hidden rounded-xl border border-white/5">
              <Table>
                <TableHeader className="bg-[#25273c]/50">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 pl-6">Fecha</TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14">Guardia</TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14">Proyecto</TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14">Turno</TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 text-center">Entrada</TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 text-center">Salida</TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 text-right pr-6">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-24">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <p className="text-muted-foreground text-sm font-medium italic">Sincronizando registros históricos...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : records.length > 0 ? (
                    records.map((record) => (
                      <TableRow key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="font-mono text-xs pl-6 text-muted-foreground">{formatDate(record.entryTime)}</TableCell>
                        <TableCell className="font-bold text-sm tracking-tight">{record.guardName}</TableCell>
                        <TableCell>
                          <div className="text-xs font-black text-primary">{record.projectCode}</div>
                          <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">{record.projectName}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-[#25273c] text-[9px] font-bold uppercase px-2 py-0">
                            {record.shiftType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-white">{formatTime(record.entryTime)}</TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground">{formatTime(record.exitTime!)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge className={`text-[9px] font-black uppercase tracking-tighter px-3 ${
                            record.status === 'Activo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                          } border shadow-sm`}>
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-32 text-muted-foreground italic">
                        No se han encontrado registros en el periodo seleccionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
