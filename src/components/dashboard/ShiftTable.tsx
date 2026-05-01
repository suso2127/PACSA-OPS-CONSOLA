
"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  RefreshCw,
  Zap,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Copy
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface ShiftTableProps {
  showObservations?: boolean;
}

export function ShiftTable({ showObservations = false }: ShiftTableProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollTrackerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'shift-registrations'),
      orderBy('entryTime', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedShifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
      
      const sortedShifts = [...fetchedShifts].sort((a, b) => {
        const timeA = a.entryTime?.toDate ? a.entryTime.toDate().getTime() : (a.entryTime ? new Date(a.entryTime).getTime() : Infinity);
        const timeB = b.entryTime?.toDate ? b.entryTime.toDate().getTime() : (b.entryTime ? new Date(b.entryTime).getTime() : Infinity);
        
        if (timeB === Infinity && timeA === Infinity) return 0;
        if (timeB === Infinity) return 1;
        if (timeA === Infinity) return -1;
        
        return timeB - timeA;
      });

      setShifts(sortedShifts);
      setLoading(false);
    }, (error) => {
      console.error("Error en tiempo real de turnos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!tableContainerRef.current || !scrollTrackerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    const scrollPercentage = (scrollLeft / (scrollWidth - clientWidth)) * 100;
    
    scrollTrackerRef.current.style.transform = `translateX(${scrollPercentage}%)`;
  };

  const handleFinalizeShift = (id: string, name: string) => {
    const shiftRef = doc(db, 'shift-registrations', id);
    
    updateDoc(shiftRef, {
      status: 'Finalizado',
      exitTime: serverTimestamp()
    }).catch((err) => {
      toast({
        variant: "destructive",
        title: "ERROR DE SINCRONIZACIÓN",
        description: `No se pudo finalizar el turno de ${name}.`
      });
    });

    toast({
      title: "TURNO FINALIZADO",
      description: `El elemento ${name} ha concluido su jornada oficialmente.`
    });
  };

  const handleSetDouble = (id: string, name: string) => {
    const shiftRef = doc(db, 'shift-registrations', id);
    updateDoc(shiftRef, {
      status: 'Doble'
    }).catch((err) => {
      toast({
        variant: "destructive",
        title: "ERROR",
        description: `No se pudo marcar como Doble a ${name}.`
      });
    });

    toast({
      title: "OPERACIÓN: DOBLE",
      description: `El elemento ${name} ha sido marcado para jornada de 24h.`
    });
  };

  const handleUpdateObservation = (id: string, observation: string) => {
    const shiftRef = doc(db, 'shift-registrations', id);
    updateDoc(shiftRef, { observation });
    
    toast({
      title: "OBSERVACIÓN ACTUALIZADA",
      description: `Se registró: ${observation}`
    });
  };

  const handleClearMonitor = () => {
    const idsToHide = shifts
      .filter(s => s.status === 'Finalizado' || s.status === 'Completo')
      .map(s => s.id);
    
    if (idsToHide.length === 0) {
      toast({
        title: "SIN REGISTROS PARA LIMPIAR",
        description: "No hay elementos finalizados visibles en el monitor."
      });
      return;
    }

    setHiddenIds(prev => {
      const next = new Set(prev);
      idsToHide.forEach(id => next.add(id));
      return next;
    });

    toast({
      title: "MONITOR DEPURADO",
      description: `Se han ocultado ${idsToHide.length} registros del monitor operativo.`
    });
  };

  const handleRestoreView = () => {
    setHiddenIds(new Set());
    toast({
      title: "VISTA RESTAURADA",
      description: "Todos los registros son visibles nuevamente."
    });
  };

  const filteredShifts = useMemo(() => {
    let base = shifts.filter(s => !hiddenIds.has(s.id));
    if (statusFilter === 'all') return base;
    return base.filter(shift => shift.status === statusFilter);
  }, [shifts, statusFilter, hiddenIds]);

  const calculateExitTime = (entryTime: any, duration: string) => {
    if (!entryTime) return '--:--';
    const date = entryTime.toDate ? entryTime.toDate() : new Date(entryTime);
    if (isNaN(date.getTime())) return '--:--';
    
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

  const OBSERVATION_OPTIONS = [
    'SE RETIRO', 
    'FINALIZADO', 
    'DOBLE', 
    'COMPLETADO', 
    'EMERGENCIA', 
    'URGENCIA', 
    'ABANDONO', 
    'ENFERMEDAD', 
    'CAMBIO DE TURNO'
  ];

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
    <div className="space-y-2">
      <div className="w-full flex flex-col items-center px-4 space-y-1 mb-2">
        <div className="flex items-center gap-3 w-full max-w-[600px]">
          <ChevronLeft className="h-3 w-3 text-primary/30" />
          <div className="h-1.5 w-full bg-[#25273c]/50 rounded-full overflow-hidden border border-white/5 relative">
            <div 
              ref={scrollTrackerRef}
              className="absolute top-0 left-0 h-full w-[15%] bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-transform duration-75 ease-out"
              style={{ transform: 'translateX(0%)' }}
            />
          </div>
          <ChevronRight className="h-3 w-3 text-primary/30" />
        </div>
      </div>

      <div className="bg-[#12121c] border border-white/5 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-500">
        <div className="px-6 py-5 bg-[#1a1b2e]/60 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
              ESTADO DE TURNOS EN TIEMPO REAL
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {hiddenIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={handleRestoreView}
                className="h-8 bg-secondary/20 border-white/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-white"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Restaurar ({hiddenIds.size})
              </Button>
            )}

            <Button 
              onClick={handleClearMonitor}
              className="h-8 bg-destructive/5 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all px-4"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              LIMPIAR MESA
            </Button>

            <div className="h-6 w-[1px] bg-white/10 mx-1" />

            <div className="flex items-center gap-2 bg-[#0f101d] px-3 py-0 rounded-lg border border-white/5 h-8">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-full bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 p-0">
                  <SelectValue placeholder="FILTRO" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                  <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">TODOS</SelectItem>
                  <SelectItem value="Activo" className="text-[10px] font-black uppercase tracking-widest text-green-500">ACTIVOS</SelectItem>
                  <SelectItem value="Doble" className="text-[10px] font-black uppercase tracking-widest text-red-500">DOBLES</SelectItem>
                  <SelectItem value="Finalizado" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">FINALIZADOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg">
              <Zap className="h-3 w-3 mr-1.5 fill-primary" />
              OPS: {filteredShifts.length}
            </Badge>
          </div>
        </div>
        
        <div 
          ref={tableContainerRef}
          onScroll={handleScroll}
          className="overflow-x-auto no-scrollbar"
        >
          <Table className="min-w-[900px]">
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="text-[16px] font-black uppercase tracking-tight text-muted-foreground h-11 pl-6">Nombre Completo</TableHead>
                <TableHead className="text-[16px] font-black uppercase tracking-tight text-muted-foreground h-11">Cliente</TableHead>
                <TableHead className="text-[16px] font-black uppercase tracking-tight text-muted-foreground h-11 text-center">Entrada</TableHead>
                <TableHead className="text-[16px] font-black uppercase tracking-tight text-muted-foreground h-11 text-center">Término</TableHead>
                <TableHead className="text-[16px] font-black uppercase tracking-tight text-muted-foreground h-11 text-center">Jornada</TableHead>
                {showObservations && (
                  <TableHead className="text-[16px] font-black uppercase tracking-tight text-muted-foreground h-11 text-center">Observaciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.length > 0 ? (
                filteredShifts.map((shift, index) => (
                  <TableRow 
                    key={shift.id} 
                    className={`border-b border-white/5 transition-all duration-300 ${
                      index === 0 && statusFilter === 'all' && !hiddenIds.has(shift.id) ? 'bg-primary/[0.02] border-l-2 border-l-primary' : ''
                    } ${shift.status === 'Finalizado' ? 'opacity-40' : 'hover:bg-white/[0.03]'}`}
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-white uppercase tracking-tight">{shift.guardName}</span>
                        <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getStatusBadgeStyles(shift.status || 'Activo')}`}>
                          {shift.status || 'Activo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-primary uppercase font-mono tracking-widest leading-none">{shift.projectCode}</span>
                        <span className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter mt-1">{shift.clientName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="font-mono text-[11px] font-black text-white bg-[#1a1b2e] px-2 py-1 rounded border border-white/5 hover:border-primary/50 transition-colors cursor-pointer outline-none">
                            {shift.entryTime?.toDate ? shift.entryTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00'}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1b2e] border-white/10 text-white">
                          <DropdownMenuItem 
                            onClick={() => handleFinalizeShift(shift.id, shift.guardName)}
                            className="text-[10px] font-black uppercase tracking-widest text-green-500 focus:text-green-400 focus:bg-white/5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                            Finalizar Turno
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSetDouble(shift.id, shift.guardName)}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 focus:text-red-400 focus:bg-white/5"
                          >
                            <Copy className="h-3.5 w-3.5 mr-2" />
                            Colocar Doble
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-accent font-mono text-[11px] font-black">
                        <LogOut className="h-3 w-3" />
                        {calculateExitTime(shift.entryTime, shift.duration)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-[#1a1b2e] text-primary border-primary/20 font-black text-[9px] tracking-widest py-0.5 px-2">
                        {shift.duration || '12h'}
                      </Badge>
                    </TableCell>
                    {showObservations && (
                      <TableCell className="text-center">
                        <Select 
                          value={shift.observation || ''} 
                          onValueChange={(val) => handleUpdateObservation(shift.id, val)}
                        >
                          <SelectTrigger className="h-8 bg-[#1a1b2e] border-white/10 text-[10px] font-black uppercase w-full max-w-[150px] mx-auto focus:ring-0">
                            <SelectValue placeholder="SIN OBS" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                            {OBSERVATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-[10px] font-black uppercase tracking-tight">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={showObservations ? 6 : 5} className="text-center py-24 text-muted-foreground italic font-medium">
                    No hay operaciones activas detectadas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
