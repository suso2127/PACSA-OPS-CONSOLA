
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
import { Clock } from 'lucide-react';

interface Shift {
  id: string;
  guardName: string;
  clientName: string;
  projectCode: string;
  entryTime: any;
  shiftType: string;
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
              <TableHead>Nombre del Guardia</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Hora de Entrada</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length > 0 ? (
              shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.guardName}</TableCell>
                  <TableCell>{shift.clientName}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{shift.projectCode}</code>
                  </TableCell>
                  <TableCell>
                    {shift.entryTime?.toDate ? shift.entryTime.toDate().toLocaleTimeString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={shift.shiftType === 'Night' || shift.shiftType === 'Noche' ? 'secondary' : 'default'} className="text-[10px]">
                      {shift.shiftType === 'Night' ? 'Noche' : shift.shiftType === 'Day' ? 'Día' : shift.shiftType}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
