
"use client"

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
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
import { 
  Clock, 
  Hourglass, 
  LogOut, 
  MoreHorizontal, 
  MessageSquare,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Shift {
  id: string;
  guardName: string;
  clientName: string;
  projectCode: string;
  entryTime: any;
  shiftType: string;
  duration: string;
  observation?: string;
  status: string;
}

export function ShiftTable() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  const handleUpdateObservation = async (shiftId: string, observation: string) => {
    try {
      const shiftRef = doc(db, 'shift-registrations', shiftId);
      await updateDoc(shiftRef, { 
        observation,
        status: observation === 'Se retiró del turno' ? 'Finalizado' : 'Activo'
      });
      
      toast({
        title: "Registro Actualizado",
        description: `Observación registrada: ${observation}`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la observación.",
        variant: "destructive"
      });
    }
  };

  const calculateExitTime = (entryTime: any, duration: string) => {
    if (!entryTime || !duration) return '--:--';
    const date = entryTime.toDate ? entryTime.toDate() : new Date(entryTime);
    const hoursToAdd = parseInt(duration) || 8;
    const exitDate = new Date(date.getTime() + hoursToAdd * 60 * 60 * 1000);
    return exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Estado de Turnos en Tiempo Real
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Monitoreo de fuerza operativa en sitio</p>
        </div>
        <Badge variant="outline" className="text-xs font-mono border-accent/30 text-accent">OPS EN VIVO</Badge>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/5">
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Nombre del Guardia</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Cliente / Proyecto</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Entrada</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Salida Est.</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Duración</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Observación</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length > 0 ? (
              shifts.map((shift) => (
                <TableRow key={shift.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold">
                    <div className="flex flex-col">
                      <span>{shift.guardName}</span>
                      {shift.observation && (
                        <span className="text-[8px] text-accent font-bold uppercase tracking-tighter mt-0.5">
                          Nota: {shift.observation}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-black text-primary uppercase">{shift.projectCode}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">{shift.clientName}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-white text-center">
                    {shift.entryTime?.toDate ? shift.entryTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-accent text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <LogOut className="h-3 w-3" />
                      {calculateExitTime(shift.entryTime, shift.duration)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 font-bold text-[10px]">
                      <Hourglass className="h-3 w-3 mr-1" />
                      {shift.duration || '8h'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-accent">
                          <MessageSquare className="h-4 w-4 mr-1.5" />
                          <span className="text-[10px] font-bold uppercase">Acción</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1b2e] border-white/10 text-white">
                        <DropdownMenuLabel className="text-[9px] uppercase tracking-widest opacity-50">Gestionar Turno</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem 
                          onClick={() => handleUpdateObservation(shift.id, 'Cambio de turno')}
                          className="text-xs font-medium cursor-pointer focus:bg-primary/20 focus:text-primary"
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-2 text-primary" />
                          Cambio de turno
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateObservation(shift.id, 'Se retiró del turno')}
                          className="text-xs font-medium cursor-pointer focus:bg-destructive/20 focus:text-destructive"
                        >
                          <UserX className="h-3.5 w-3.5 mr-2 text-destructive" />
                          Se retiró del turno
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={shift.shiftType === 'Nocturno' ? 'secondary' : 'default'} 
                      className={`text-[10px] font-black uppercase ${shift.status === 'Finalizado' ? 'bg-muted text-muted-foreground opacity-50' : ''}`}
                    >
                      {shift.status === 'Finalizado' ? 'Finalizado' : shift.shiftType}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
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
