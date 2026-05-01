
"use client"

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Printer, 
  ChevronLeft,
  ChevronRight,
  User,
  Download,
  FileText
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
  status: string;
  entryTime: any;
}

export function PayrollView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PayrollRecord[]>([]);
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const todayIndex = (new Date().getDay() + 6) % 7;

  useEffect(() => {
    const q = query(collection(db, 'shift-registrations'), orderBy('entryTime', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PayrollRecord[];
      
      const uniqueGuards = records.reduce((acc: PayrollRecord[], current) => {
        const x = acc.find(item => item.guardName === current.guardName);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      setData(uniqueGuards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Planilla Operativa</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Control de asistencia y cobertura semanal</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-destructive hover:bg-destructive/90 text-white border-none h-11 px-6 rounded-lg">
            <Printer className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
          <Button variant="outline" className="bg-primary hover:bg-primary/90 text-primary-foreground border-none h-11 px-6 rounded-lg">
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Nombre del Guardia</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 border-r">Puesto / Proyecto</TableHead>
                {days.map((day, idx) => (
                  <TableHead key={day} className={`text-[10px] font-black uppercase tracking-widest h-12 text-center ${idx === todayIndex ? 'text-primary' : ''}`}>
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-20 text-muted-foreground italic">Cargando planilla...</TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((record) => (
                  <TableRow key={record.id} className="border-border">
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-primary" />
                        {record.guardName}
                      </div>
                    </TableCell>
                    <TableCell className="border-r">
                      <span className="text-[10px] font-black text-primary block">{record.projectCode}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{record.projectName}</span>
                    </TableCell>
                    {days.map((day, idx) => {
                      const isToday = idx === todayIndex;
                      const isDouble = isToday && record.status === 'Doble';
                      return (
                        <TableCell key={day} className="text-center">
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] font-bold px-2 py-0 ${isDouble ? 'bg-destructive text-white border-destructive' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}
                          >
                            {isDouble ? '24H' : '12H'}
                          </Badge>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-20 text-muted-foreground italic">No hay datos disponibles.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
