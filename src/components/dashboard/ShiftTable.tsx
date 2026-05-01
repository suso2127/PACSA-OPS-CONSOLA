
"use client"

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Clock, Hourglass } from 'lucide-react';

interface Shift {
  id: string;
  guardName: string;
  clientName: string;
  projectCode: string;
  entryTime: any;
  shiftType: string;
  duration: string;
}

export function ShiftTable() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'shift-registrations'),
      orderBy('entryTime', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedShifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
      setShifts(fetchedShifts);
      setLoading(false);
    }, (error) => {
      console.error("Error en tiempo real de turnos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 w-full bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          Estado de Turnos en Tiempo Real
        </h3>
        <Badge variant="outline" className="text-xs font-mono">OPS EN VIVO</Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Nombre del Guardia</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Cliente / Proyecto</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Entrada</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Duración</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length > 0 ? (
              shifts.map((shift) => (
                <TableRow key={shift.id} className="border-b border-white/5">
                  <TableCell className="font-bold">{shift.guardName}</TableCell>
                  <TableCell>
                    <div className="text-xs font-black text-primary uppercase">{shift.projectCode}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">{shift.clientName}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {shift.entryTime?.toDate ? shift.entryTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 font-bold text-[10px]">
                      <Hourglass className="h-3 w-3 mr-1" />
                      {shift.duration || '8h'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={shift.shiftType === 'Nocturno' ? 'secondary' : 'default'} className="text-[10px] font-black uppercase">
                      {shift.shiftType}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                  No se encontraron registros de turnos activos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
