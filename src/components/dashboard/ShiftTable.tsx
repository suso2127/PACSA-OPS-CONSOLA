
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
  ChevronRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="space-y-4">
      <div className="w-full flex flex-col items-center px-4 space-y-2">
        <div className="flex items-center gap-4 w-full max-w-[800px]">
          <ChevronLeft className="h-4 w-4 text-primary/40" />
          <div className="h-2 w-full bg-[#25273c]/50 rounded-full overflow-hidden border border-white/5 relative">
            <div 
              ref={scrollTrackerRef}
              className="absolute top-0 left-0 h-full w-[20%] bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-transform duration-75 ease-out"
              style={{ transform: 'translateX(0%)' }}
            />
          </div>
          <ChevronRight className="h-4 w-4 text-primary/40" />
        </div>
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/40">Pasador de Información Operativa</span>
      </div>

      <div className="bg-[#12121c] border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-700">
        <div className="p-8 bg-[#1a1b2e]/80 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary animate-pulse" />
              Estado de Turnos Real-Time
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Monitoreo de Fuerza Operativa en Sitio</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {hiddenIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={handleRestoreView}
                className="h-9 bg-secondary/30 border-white/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Restaurar ({hiddenIds.size})
              </Button>
            )}

            <Button 
              onClick={handleClearMonitor}
              className="h-9 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Limpiar Mesa
            </Button>

            <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block" />

            <div className="flex items-center gap-3 bg-[#12121c] px-4 py-0 rounded-2xl border border-white/5 h-9">
              <Filter className="h-4 w-4 text-primary" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-full bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 p-0">
                  <SelectValue placeholder="ESTADO" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                  <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">GLOBAL</SelectItem>
                  <SelectItem value="Activo" className="text-[10px] font-black uppercase tracking-widest text-green-500">ACTIVOS</SelectItem>
                  <SelectItem value="Doble" className="text-[10px] font-black uppercase tracking-widest text-red-500">DOBLES</SelectItem>
                  <SelectItem value="Finalizado" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">FINALIZADOS</SelectItem>
                  <SelectItem value="Completo" className="text-[10px] font-black uppercase tracking-widest text-blue-500">COMPLETOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black tracking-widest px-4 py-2 rounded-full hidden lg:flex">
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
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 pl-8">Elemento / Observación</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14">Cliente / ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 text-center">Entrada</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 text-center">Término</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 text-center">Jornada</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 text-right pr-8">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.length > 0 ? (
                filteredShifts.map((shift, index) => (
                  <TableRow 
                    key={shift.id} 
                    className={`border-b border-white/5 transition-all duration-300 ${
                      index === 0 && statusFilter === 'all' && !hiddenIds.has(shift.id) ? 'bg-primary/[0.03] border-l-2 border-l-primary animate-in slide-in-from-left-2' : ''
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
                        {shift.entryTime?.toDate ? shift.entryTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'SINC...'}
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
                  <TableCell colSpan={6} className="text-center py-32 text-muted-foreground italic font-medium bg-white/[0.01]">
                    No se han detectado operaciones activas.
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
