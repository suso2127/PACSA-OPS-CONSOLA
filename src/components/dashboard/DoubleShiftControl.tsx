
"use client"

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Copy, 
  AlertTriangle, 
  User, 
  Building2, 
  Clock, 
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DoubleShift {
  id: string;
  guardName: string;
  projectName: string;
  projectCode: string;
  entryTime: any;
  duration: string;
  status: string;
}

export function DoubleShiftControl() {
  const [doubles, setDoubles] = useState<DoubleShift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'shift-registrations'),
      where('status', '==', 'Doble'),
      orderBy('entryTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DoubleShift[];
      setDoubles(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (ts: any) => {
    if (!ts) return '--:--';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <Copy className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Control de Dobles (24 Horas)</h1>
            <p className="text-muted-foreground text-sm font-medium">Listado de personal en jornada extendida activa</p>
          </div>
        </div>
        <Badge className="bg-red-500 hover:bg-red-600 text-white font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
          {doubles.length} Elementos en Doble
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Resumen Operativo */}
        <div className="lg:col-span-4 bg-[#1a1b2e] border border-red-500/10 rounded-3xl p-8 flex flex-col shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldAlert className="h-32 w-32 text-red-500" />
          </div>

          <div className="flex items-center gap-2 text-red-500 mb-8">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Resumen Operativo</span>
          </div>

          <div className="bg-[#0f101d] border border-white/5 rounded-2xl p-8 text-center flex-1 flex flex-col justify-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-4">Total Alertas Hoy</p>
            <p className="text-8xl font-black text-red-500 tabular-nums leading-none tracking-tighter">
              {doubles.length}
            </p>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground mt-8 text-center px-4 font-medium italic opacity-80">
            El personal marcado como "Doble" tiene permitida una jornada de 24 horas antes de la finalización automática del sistema.
          </p>
        </div>

        {/* Listado de Dobles */}
        <div className="lg:col-span-8 bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Listado de Dobles Activos</h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">Seguimiento de personal con permiso de 24 horas</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/5">
            <Table>
              <TableHeader className="bg-[#25273c]/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 pl-6">Guardia</TableHead>
                  <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14">Proyecto</TableHead>
                  <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 text-center">Entrada</TableHead>
                  <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 text-right pr-6">Jornada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20">
                      <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : doubles.length > 0 ? (
                  doubles.map((item) => (
                    <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-red-500" />
                          </div>
                          <span className="font-bold text-sm">{item.guardName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-primary opacity-60" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-primary uppercase">{item.projectCode}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">{item.projectName}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-black text-white">
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatTime(item.entryTime)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-black uppercase tracking-widest px-3">
                          24 Horas
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-32 text-muted-foreground italic text-sm font-medium">
                      No hay personal marcado como "Doble" actualmente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
