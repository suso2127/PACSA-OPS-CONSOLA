
"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
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
  LogOut, 
  RefreshCw,
  Zap,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Copy,
  Timer,
  RotateCcw,
  Building2,
  ChevronDown,
  MapPin
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
  projectName: string;
  projectCode: string;
  projectLocation?: string;
  entryTime: any;
  exitTime?: any;
  shiftType: string;
  duration: string;
  observation?: string;
  status: string;
}

interface ShiftTableProps {
  showObservations?: boolean;
  hideExitTime?: boolean;
}

export function ShiftTable({ showObservations = false, hideExitTime = false }: ShiftTableProps) {
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
    
    if (scrollTrackerRef.current) {
      scrollTrackerRef.current.style.transform = `translateX(${scrollPercentage}%)`;
    }
  };

  const handleUpdateStatus = (id: string, name: string, status: string) => {
    const shiftRef = doc(db, 'shift-registrations', id);
    const updateData: any = { status };
    
    if (status === 'Finalizado' || status === 'Completo') {
      updateData.exitTime = serverTimestamp();
    } else {
      updateData.exitTime = null;
    }

    updateDoc(shiftRef, updateData).catch((err) => {
      toast({
        variant: "destructive",
        title: "ERROR DE SINCRONIZACIÓN",
        description: `No se pudo actualizar el estado de ${name}.`
      });
    });

    toast({
      title: "OPERACIÓN REGISTRADA",
      description: `El elemento ${name} ha sido actualizado a: ${status.toUpperCase()}.`
    });
  };

  const handleDelete = (id: string, name: string) => {
    const shiftRef = doc(db, 'shift-registrations', id);
    deleteDoc(shiftRef)
      .then(() => {
        toast({
          title: "REGISTRO ELIMINADO",
          description: `El registro de ${name} ha sido removido del sistema.`
        });
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "ERROR AL ELIMINAR",
          description: `No se pudo eliminar el registro de ${name}.`
        });
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

  const calculateWorkedHours = (shift: Shift) => {
    if (!shift.entryTime) return '--:--';
    
    const start = shift.entryTime.toDate ? shift.entryTime.toDate() : new Date(shift.entryTime);
    const end = shift.exitTime?.toDate ? shift.exitTime.toDate() : (shift.exitTime ? new Date(shift.exitTime) : new Date());
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '0.00';

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return '0.00';
    const diffHrs = diffMs / (1000 * 60 * 60);
    
    return diffHrs.toFixed(2);
  };

  const handleClearMonitor = () => {
    const idsToHide = shifts
      .filter(s => s.status === 'Finalizado' || s.status === 'Completo')
      .map(s => s.id);
    
    if (idsToHide.length === 0) {
      toast({
        title: "SIN REGISTROS PARA LIMPIAR",
        description: "No hay elementos finalizados o completos visibles en el monitor."
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

  const formatDisplayTime = (ts: any) => {
    if (!ts) return '--:--';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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
    <div className="space-y-1">
      <div className="w-full flex flex-col items-center px-4 space-y-0.5 mb-1">
        <div className="flex items-center gap-3 w-full max-w-[600px]">
          <ChevronLeft className="h-3 w-3 text-primary/30" />
          <div className="h-1 w-full bg-[#25273c]/50 rounded-full overflow-hidden border border-white/5 relative">
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
        <div className="px-5 py-3 bg-[#1a1b2e]/60 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">
              ESTADO DE TURNOS EN TIEMPO REAL
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {hiddenIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={handleRestoreView}
                className="h-7 bg-secondary/20 border-white/10 text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-white px-2"
              >
                <RefreshCw className="h-2.5 w-2.5 mr-1.5" />
                Restaurar ({hiddenIds.size})
              </Button>
            )}

            <Button 
              onClick={handleClearMonitor}
              className="h-7 bg-destructive/5 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all px-3"
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              LIMPIAR MESA
            </Button>

            <div className="h-5 w-[1px] bg-white/10 mx-0.5" />

            <div className="flex items-center gap-1.5 bg-[#0f101d] px-2 py-0 rounded-lg border border-white/5 h-7">
              <Filter className="h-3 w-3 text-primary" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[100px] h-full bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-white focus:ring-0 p-0">
                  <SelectValue placeholder="FILTRO" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                  <SelectItem value="all" className="text-[9px] font-black uppercase tracking-widest">TODOS</SelectItem>
                  <SelectItem value="Activo" className="text-[9px] font-black uppercase tracking-widest text-green-500">ACTIVOS</SelectItem>
                  <SelectItem value="Doble" className="text-[9px] font-black uppercase tracking-widest text-red-500">DOBLES</SelectItem>
                  <SelectItem value="Completo" className="text-[9px] font-black uppercase tracking-widest text-blue-500">COMPLETOS</SelectItem>
                  <SelectItem value="Finalizado" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">FINALIZADOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black tracking-widest px-2 py-1 rounded-lg">
              <Zap className="h-2.5 w-2.5 mr-1 fill-primary" />
              OPS: {filteredShifts.length}
            </Badge>
          </div>
        </div>
        
        <div 
          ref={tableContainerRef}
          onScroll={handleScroll}
          className="overflow-x-auto no-scrollbar"
        >
          <Table className="min-w-[950px]">
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground h-10 pl-5">Nombre Completo</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground h-10">Cliente / Proyecto / Ubicación</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground h-10 text-center">Entrada</TableHead>
                {!hideExitTime && (
                  <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground h-10 text-center">Término</TableHead>
                )}
                <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground h-10 text-center">Jornada</TableHead>
                {showObservations && (
                  <>
                    <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground h-10 text-center">Horas</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground h-10 text-center">Observaciones</TableHead>
                  </>
                )}
                <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground h-10 text-right pr-5">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.length > 0 ? (
                filteredShifts.map((shift, index) => (
                  <TableRow 
                    key={shift.id} 
                    className={`border-b border-white/5 transition-all duration-300 ${
                      index === 0 && statusFilter === 'all' && !hiddenIds.has(shift.id) ? 'bg-primary/[0.02] border-l-2 border-l-primary' : ''
                    } ${shift.status === 'Finalizado' || shift.status === 'Completo' ? 'opacity-40' : 'hover:bg-white/[0.03]'}`}
                  >
                    <TableCell className="pl-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-black text-white uppercase tracking-tight">{shift.guardName}</span>
                        <Badge className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0 rounded-full border ${getStatusBadgeStyles(shift.status || 'Activo')}`}>
                          {shift.status || 'Activo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-2.5 w-2.5 text-primary/70" />
                          <span className="text-[10px] font-black text-primary uppercase font-mono tracking-widest leading-none">{shift.projectCode}</span>
                        </div>
                        <span className="text-[10px] text-white font-bold uppercase tracking-tight mt-1 leading-none">
                          {shift.projectName}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-2.5 w-2.5 text-red-500/70" />
                          <span className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter leading-none">
                            {shift.projectLocation || 'UBICACIÓN REGISTRADA'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2.5">
                      <div className="font-mono text-[10px] font-black text-white bg-[#1a1b2e] px-1.5 py-0.5 rounded border border-white/5 select-none">
                        {formatDisplayTime(shift.entryTime)}
                      </div>
                    </TableCell>
                    {!hideExitTime && (
                      <TableCell className="text-center py-2.5">
                        <div className="flex items-center justify-center gap-1 text-accent font-mono text-[10px] font-black">
                          <LogOut className="h-2.5 w-2.5" />
                          {calculateExitTime(shift.entryTime, shift.duration)}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-center py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="outline-none group">
                            <Badge variant="secondary" className="bg-[#1a1b2e] text-primary border-primary/20 font-black text-[8px] tracking-widest py-0 px-1.5 hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors flex items-center gap-1">
                              {shift.duration || '12h'}
                              <ChevronDown className="h-2 w-2 opacity-50 group-hover:opacity-100" />
                            </Badge>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1b2e] border-white/10 text-white min-w-[140px]">
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(shift.id, shift.guardName, 'Completo')}
                            className="text-[9px] font-black uppercase tracking-widest text-green-500 focus:text-green-400 focus:bg-white/5 py-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-2" />
                            Finalizar Turno (Completo)
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(shift.id, shift.guardName, 'Activo')}
                            className="text-[9px] font-black uppercase tracking-widest text-primary focus:text-primary focus:bg-white/5 py-1.5 cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3 mr-2" />
                            Restablecer Status
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(shift.id, shift.guardName, 'Doble')}
                            className="text-[9px] font-black uppercase tracking-widest text-red-500 focus:text-red-400 focus:bg-white/5 py-1.5 cursor-pointer"
                          >
                            <Copy className="h-3 w-3 mr-2" />
                            Colocar Doble
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    {showObservations && (
                      <>
                        <TableCell className="text-center py-2.5">
                          <div className="flex items-center justify-center gap-1 font-mono text-[10px] font-black text-primary">
                            <Timer className="h-2.5 w-2.5" />
                            {calculateWorkedHours(shift)}H
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          <Select 
                            value={shift.observation || ''} 
                            onValueChange={(val) => handleUpdateObservation(shift.id, val)}
                          >
                            <SelectTrigger className="h-7 bg-[#1a1b2e] border-white/10 text-[9px] font-black uppercase w-full max-w-[130px] mx-auto focus:ring-0">
                              <SelectValue placeholder="SIN OBS" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                              {OBSERVATION_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt} className="text-[9px] font-black uppercase tracking-tight">
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right pr-5 py-2.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(shift.id, shift.guardName)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={showObservations ? 8 : 6} className="text-center py-16 text-muted-foreground italic font-medium">
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

