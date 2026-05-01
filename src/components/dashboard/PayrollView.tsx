
"use client"

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Printer, 
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface PayrollRecord {
  id: string;
  guardName: string;
  projectName: string;
  projectCode: string;
}

export function PayrollView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PayrollRecord[]>([]);
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  useEffect(() => {
    const q = query(collection(db, 'shift-registrations'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        guardName: doc.data().guardName,
        projectName: doc.data().projectName,
        projectCode: doc.data().projectCode,
      })) as PayrollRecord[];
      
      const uniqueGuards = records.filter((v, i, a) => a.findIndex(t => (t.guardName === v.guardName)) === i);
      setData(uniqueGuards);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Planilla Operativa</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Control de asistencia y cobertura semanal PACSA</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#25273c] rounded-xl border border-white/5 p-1.5">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/5">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-6 text-[10px] font-black font-mono text-primary uppercase">Semana Actual</span>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white/5">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white border-none h-11 px-6 rounded-xl shadow-lg shadow-blue-500/10">
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
        </div>
      </div>

      <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-[#25273c]/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 pl-6 sticky left-0 bg-[#1a1b2e] z-20">Guardia</TableHead>
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 sticky left-[180px] bg-[#1a1b2e] z-20 border-r border-white/5">Puesto</TableHead>
                {days.map(day => (
                  <TableHead key={day} className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 text-center px-4">{day}</TableHead>
                ))}
                <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest h-14 text-right pr-6">Total Hrs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 opacity-50">
                      <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Generando Planilla...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((record) => (
                  <TableRow key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-200">
                    <TableCell className="pl-6 sticky left-0 bg-[#1a1b2e] z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-bold text-sm whitespace-nowrap">{record.guardName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="sticky left-[180px] bg-[#1a1b2e] z-10 border-r border-white/5">
                      <div className="flex flex-col min-w-[120px]">
                        <span className="text-[10px] font-black text-primary uppercase">{record.projectCode || 'N/A'}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter truncate max-w-[150px]">{record.projectName || 'Sin Asignar'}</span>
                      </div>
                    </TableCell>
                    {days.map((day, idx) => (
                      <TableCell key={day} className="text-center">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center mx-auto border transition-all ${
                          idx < 5 
                            ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                            : idx === 5 ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                          <span className="text-[9px] font-black uppercase">
                            {idx < 5 ? '12h' : idx === 5 ? '24h' : 'F'}
                          </span>
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-right pr-6">
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] tabular-nums">
                        84 HRS
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-20 text-muted-foreground italic text-sm">
                    No hay datos suficientes para generar la planilla semanal.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-8 border-t border-white/5 pt-8">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-md bg-green-500/20 border border-green-500/30" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Jornada 12h</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-md bg-orange-500/20 border border-orange-500/30" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Jornada 24h (Doble)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-md bg-red-500/20 border border-red-500/30" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Falta / Descanso</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Actualizado en Tiempo Real</span>
          </div>
        </div>
      </div>
    </div>
  );
}
