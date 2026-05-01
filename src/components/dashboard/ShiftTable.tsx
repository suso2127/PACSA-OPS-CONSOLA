
"use client"

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  UserCheck,
  ShieldCheck,
  Copy,
  Settings2,
  RefreshCw,
  UserMinus,
  Zap
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    // Consulta optimizada para tiempo real: Orden descendente por tiempo de entrada (el más nuevo arriba)
    const q = query(
      collection(db, 'shift-registrations'),
      orderBy('entryTime', 'desc'),
      limit(50)
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
      
      if (newStatus === 'Finalizado') {
        updateData.exitTime = serverTimestamp();
      }
      
      await updateDoc(shiftRef, updateData);
      
      toast({
        title: "ESTADO ACTUALIZADO",
        description: `El turno ha sido modificado a: ${newStatus.toUpperCase()}`
      });
    } catch (err) {
      toast({
        title: "ERROR DE SINCRONIZACIÓN",
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
    return exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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
          <div key={i} className="h-16 w-full bg-[#1a1b2e] animate-pulse rounded-xl border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#12121c] border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-700">
      <div className="p-8 bg-[#1a1b2e]/80 border-b border-white/5 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary animate-pulse" />
            Estado de Turnos Real-Time
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Monitoreo de Fuerza Operativa en Sitio</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black tracking-widest px-4 py-1.5 rounded-full">
            <Zap className="h-3 w-3 mr-1.5 fill-primary" />
            LIVE OPS
          </Badge>
        </div>
      </div>
      
      <div className="overflow-x-auto no-scrollbar">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 pl-8">Elemento / Observación</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14">Cliente / ID</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 text-center">Entrada</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 text-center">Término</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 text-center">Jornada</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 text-center">Comandos</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 text-right pr-8">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length > 0 ? (
              shifts.map((shift, index) => (
                <TableRow 
                  key={shift.id} 
                  className={`border-b border-white/5 transition-all duration-300 ${
                    index === 0 ? 'bg-primary/[0.03] animate-in slide-in-from-left-2' : ''
                  } ${shift.status === 'Finalizado' ? 'opacity-40 grayscale-[0.5]' : 'hover:bg-white/[0.04]'}`}
                >
                  <TableCell className="pl-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white uppercase tracking-tight">{shift.guardName}</span>
                      {shift.observation ? (
                        <span className="text-[9px] text-primary font-black uppercase tracking-tighter mt-1 bg-primary/10 w-fit px-2 py-0.5 rounded-md">
                          NOTA: {shift.observation}
                        </span>
                      ) : (
                        <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Sin novedades</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-primary uppercase font-mono tracking-widest">{shift.projectCode}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter mt-0.5 truncate max-w-[150px]">{shift.clientName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-xs font-black text-white bg-[#1a1b2e] px-2 py-1 rounded border border-white/5 shadow-inner">
                      {shift.entryTime?.toDate ? shift.entryTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-accent font-mono text-xs font-black">
                      <LogOut className="h-3 w-3" />
                      {calculateExitTime(shift.entryTime, shift.duration)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[#1a1b2e] text-primary border-primary/20 font-black text-[9px] tracking-widest py-1 px-3">
                      <Hourglass className="h-3 w-3 mr-1.5 opacity-50" />
                      {shift.duration || '12h'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-primary hover:bg-primary/20 rounded-xl transition-all"
                              onClick={() => handleUpdateStatus(shift.id, 'Finalizado', 'Relevo efectuado')}
                              disabled={shift.status === 'Finalizado'}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#1a1b2e] border-primary/30 text-[9px] font-black uppercase tracking-widest">Relevo de Turno</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-orange-500 hover:bg-orange-500/20 rounded-xl transition-all"
                              onClick={() => handleUpdateStatus(shift.id, 'Finalizado', 'Retiro de puesto')}
                              disabled={shift.status === 'Finalizado'}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#1a1b2e] border-orange-500/30 text-[9px] font-black uppercase tracking-widest">Retiro Anticipado</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="h-6 w-[1px] bg-white/10 mx-1" />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-10 px-3 text-muted-foreground hover:text-white rounded-xl">
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1b2e] border-white/10 text-white min-w-[180px] p-2 rounded-2xl shadow-2xl">
                          <DropdownMenuLabel className="text-[9px] uppercase tracking-[0.2em] font-black opacity-50 mb-1">Comandos de Estado</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(shift.id, 'Activo')}
                            className="text-[10px] font-black uppercase tracking-widest cursor-pointer focus:bg-green-500/20 focus:text-green-500 rounded-lg py-2.5"
                          >
                            <UserCheck className="h-4 w-4 mr-3 text-green-500" />
                            Sincronizar Activo
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(shift.id, 'Completo')}
                            className="text-[10px] font-black uppercase tracking-widest cursor-pointer focus:bg-blue-500/20 focus:text-blue-500 rounded-lg py-2.5"
                          >
                            <ShieldCheck className="h-4 w-4 mr-3 text-blue-500" />
                            Validar Completo
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(shift.id, 'Doble')}
                            className="text-[10px] font-black uppercase tracking-widest cursor-pointer focus:bg-red-500/20 focus:text-red-500 rounded-lg py-2.5"
                          >
                            <Copy className="h-4 w-4 mr-3 text-red-500" />
                            Marcar Doble
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(shift.id, 'Finalizado', 'Operación concluida')}
                            className="text-[10px] font-black uppercase tracking-widest cursor-pointer focus:bg-muted focus:text-white rounded-lg py-2.5"
                          >
                            <LogOut className="h-4 w-4 mr-3 text-muted-foreground" />
                            Cerrar Turno
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Badge 
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 border shadow-sm rounded-full ${getStatusBadgeStyles(shift.status || 'Activo')}`}
                    >
                      {shift.status || 'Activo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-32 text-muted-foreground italic font-medium bg-white/[0.01]">
                  No se han detectado operaciones activas en la terminal.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
