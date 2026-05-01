
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
  MessageSquare,
  UserCheck,
  UserX,
  ShieldCheck,
  Copy,
  Settings2
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

  const handleUpdateStatus = async (shiftId: string, newStatus: string, observation?: string) => {
    try {
      const shiftRef = doc(db, 'shift-registrations', shiftId);
      const updateData: any = { status: newStatus };
      if (observation) {
        updateData.observation = observation;
      }
      
      await updateDoc(shiftRef, updateData);
      
      toast({
        title: "Estado Actualizado",
        description: `El turno ahora está: ${newStatus}`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del turno.",
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

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Activo':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Doble':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Completo':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Finalizado':
        return 'bg-muted text-muted-foreground opacity-60 border-muted-foreground/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
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
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Acciones</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Estado</TableHead>
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
                          <Settings2 className="h-4 w-4 mr-1.5" />
                          <span className="text-[10px] font-bold uppercase">Gestionar</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1b2e] border-white/10 text-white min-w-[160px]">
                        <DropdownMenuLabel className="text-[9px] uppercase tracking-widest opacity-50">Cambiar Estado</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(shift.id, 'Activo')}
                          className="text-xs font-medium cursor-pointer focus:bg-green-500/20 focus:text-green-500"
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-2 text-green-500" />
                          Marcar Activo
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(shift.id, 'Completo')}
                          className="text-xs font-medium cursor-pointer focus:bg-blue-500/20 focus:text-blue-500"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-2 text-blue-500" />
                          Marcar Completo
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(shift.id, 'Doble')}
                          className="text-xs font-medium cursor-pointer focus:bg-red-500/20 focus:text-red-500"
                        >
                          <Copy className="h-3.5 w-3.5 mr-2 text-red-500" />
                          Marcar Doble
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(shift.id, 'Finalizado', 'Turno concluido')}
                          className="text-xs font-medium cursor-pointer focus:bg-muted focus:text-white"
                        >
                          <LogOut className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          Finalizar Turno
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuLabel className="text-[9px] uppercase tracking-widest opacity-50">Observaciones</DropdownMenuLabel>
                        <DropdownMenuItem 
                          onClick={() => updateDoc(doc(db, 'shift-registrations', shift.id), { observation: 'Cambio de turno' })}
                          className="text-xs font-medium cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-2 text-accent" />
                          Cambio de turno
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      className={`text-[10px] font-black uppercase tracking-tighter px-3 border shadow-sm ${getStatusBadgeStyles(shift.status || 'Activo')}`}
                    >
                      {shift.status || 'Activo'}
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
