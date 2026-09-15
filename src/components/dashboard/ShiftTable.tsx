
"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
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
  MapPin,
  Calendar,
  AlertTriangle,
  Lock,
  ShieldAlert
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  shiftDuration?: string;
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
  const [dateFilter, setDateFilter] = useState<string>('');
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  const { toast } = useToast();
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollTrackerRef = useRef<HTMLDivElement>(null);

  // Helper robusto para convertir cualquier formato de fecha de Firebase/JS a Date
  const parseFirebaseDate = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
    if (typeof ts === 'string' || typeof ts === 'number') {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

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
        const dateA = parseFirebaseDate(a.entryTime);
        const dateB = parseFirebaseDate(b.entryTime);
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      });

      setShifts(sortedShifts);
      setLoading(false);
    }, (error) => {
      console.error("Error en tiempo real de turnos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Motor de Cierre Automático por Cumplimiento de Horas
  useEffect(() => {
    if (loading || shifts.length === 0) return;

    const checkShifts = () => {
      const now = new Date();
      shifts.forEach(shift => {
        if (shift.status === 'Activo' || shift.status === 'Doble') {
          const exitDate = parseFirebaseDate(shift.exitTime);
          if (exitDate) return;

          const entryDate = parseFirebaseDate(shift.entryTime);
          if (!entryDate) return;

          const durationHrs = parseInt(shift.shiftDuration || shift.duration) || 0;
          const diffMs = now.getTime() - entryDate.getTime();
          const diffHrs = diffMs / (1000 * 60 * 60);

          if (diffHrs >= durationHrs) {
            handleUpdateStatus(shift.id, shift.guardName, 'Completo');
          }
        }
      });
    };

    const interval = setInterval(checkShifts, 30000);
    return () => clearInterval(interval);
  }, [shifts, loading]);

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

    updateDoc(shiftRef, updateData).catch(() => {
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

  const handleUpdateDuration = (id: string, name: string, duration: string) => {
    const shiftRef = doc(db, 'shift-registrations', id);
    const updateData: any = { duration, shiftDuration: duration };
    
    if (duration === '24h') {
      updateData.status = 'Doble';
    } else {
      const currentShift = shifts.find(s => s.id === id);
      if (currentShift?.status === 'Doble') {
        updateData.status = 'Activo';
      }
    }

    updateDoc(shiftRef, updateData);
    toast({
      title: "JORNADA ACTUALIZADA",
      description: `El elemento ${name} ahora tiene una jornada de ${duration}.`
    });
  };

  const handleDelete = (id: string, name: string) => {
    deleteDoc(doc(db, 'shift-registrations', id))
      .then(() => {
        toast({ title: "REGISTRO ELIMINADO", description: `El registro de ${name} ha sido removido.` });
      });
  };

  const handleConfirmDeleteAll = async () => {
    if (deletePassword !== 'GP') {
      toast({ variant: "destructive", title: "CLAVE INCORRECTA", description: "Acceso denegado." });
      return;
    }
    setLoading(true);
    setIsDeleteDialogOpen(false);
    setDeletePassword('');
    try {
      const q = query(collection(db, 'shift-registrations'));
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
      toast({ title: "BASE DE DATOS DEPURADA", description: "Registros eliminados." });
    } catch (error) {
      toast({ variant: "destructive", title: "ERROR OPERATIVO", description: "Fallo en la purga." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateObservation = (id: string, observation: string) => {
    updateDoc(doc(db, 'shift-registrations', id), { observation });
    toast({ title: "OBSERVACIÓN ACTUALIZADA", description: `Se registró: ${observation}` });
  };

  const calculateWorkedHours = (shift: Shift) => {
    const start = parseFirebaseDate(shift.entryTime);
    if (!start) return '0.00';
    
    const exitDate = parseFirebaseDate(shift.exitTime);
    const end = exitDate || new Date();
    
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return '0.00';
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(2);
  };

  const handleClearMonitor = () => {
    const idsToHide = shifts
      .filter(s => s.status === 'Finalizado' || s.status === 'Completo' || !!parseFirebaseDate(s.exitTime))
      .map(s => s.id);
    
    if (idsToHide.length === 0) {
      toast({ title: "SIN REGISTROS PARA LIMPIAR", description: "No hay turnos finalizados visibles." });
      return;
    }

    setHiddenIds(prev => {
      const next = new Set(prev);
      idsToHide.forEach(id => next.add(id));
      return next;
    });
    toast({ title: "MONITOR DEPURADO", description: `Ocultos ${idsToHide.length} registros.` });
  };

  const handleRestoreView = () => {
    setHiddenIds(new Set());
    setDateFilter('');
    toast({ title: "VISTA RESTAURADA", description: "Registros visibles." });
  };

  const filteredShifts = useMemo(() => {
    let base = shifts.filter(s => !hiddenIds.has(s.id));
    if (statusFilter !== 'all') {
      base = base.filter(shift => {
        const isCompleted = !!parseFirebaseDate(shift.exitTime);
        const currentStatus = isCompleted ? 'Completo' : (shift.status || 'Activo');
        return currentStatus === statusFilter;
      });
    }
    if (dateFilter) {
      base = base.filter(shift => {
        const date = parseFirebaseDate(shift.entryTime);
        if (!date) return false;
        const localDateStr = date.toISOString().split('T')[0];
        return localDateStr === dateFilter;
      });
    }
    return base;
  }, [shifts, statusFilter, hiddenIds, dateFilter]);

  const getStatusBadgeStyles = (status: string, hasExitTime: boolean) => {
    if (hasExitTime) {
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
    switch (status) {
      case 'Activo': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Doble': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Completo': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Finalizado': return 'bg-muted text-muted-foreground opacity-60 border-muted-foreground/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const formatDisplayTime = (ts: any) => {
    const date = parseFirebaseDate(ts);
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDisplayDate = (ts: any) => {
    const date = parseFirebaseDate(ts);
    if (!date) return '--/--/--';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const OBSERVATION_OPTIONS = ['SE RETIRO', 'FINALIZADO', 'DOBLE', 'COMPLETADO', 'EMERGENCIA', 'URGENCIA', 'ABANDONO', 'ENFERMEDAD', 'CAMBIO DE TURNO'];

  return (
    <div className="space-y-1">
      <div className="w-full flex flex-col items-center px-4 space-y-0.5 mb-1">
        <div className="flex items-center gap-3 w-full max-w-[600px]">
          <ChevronLeft className="h-3 w-3 text-primary/30" />
          <div className="h-1 w-full bg-[#25273c]/50 rounded-full overflow-hidden border border-white/5 relative">
            <div ref={scrollTrackerRef} className="absolute top-0 left-0 h-full w-[15%] bg-primary rounded-full transition-transform duration-75 ease-out" />
          </div>
          <ChevronRight className="h-3 w-3 text-primary/30" />
        </div>
      </div>

      <div className="bg-[#12121c] border border-white/5 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-500">
        <div className="px-5 py-3 bg-[#1a1b2e]/60 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20"><Clock className="h-4 w-4 text-primary" /></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">ESTADO DE TURNOS EN TIEMPO REAL</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hiddenIds.size > 0 && (
              <Button variant="outline" onClick={handleRestoreView} className="h-7 bg-secondary/20 border-white/10 text-[8px] font-black uppercase px-2">
                <RefreshCw className="h-2.5 w-2.5 mr-1.5" />Restaurar ({hiddenIds.size})
              </Button>
            )}
            <div className="flex items-center gap-1.5 bg-[#0f101d] px-2 rounded-lg border border-white/5 h-7">
              <Calendar className="h-3 w-3 text-primary" />
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-transparent border-none text-[9px] font-black uppercase text-white outline-none w-[110px]" />
            </div>
            <Button onClick={handleClearMonitor} className="h-7 bg-white/5 hover:bg-white/10 text-white/50 text-[8px] font-black uppercase rounded-lg px-3">
              <Trash2 className="h-3 w-3 mr-1.5" />LIMPIAR MESA
            </Button>
            <Button onClick={() => setIsDeleteDialogOpen(true)} className="h-7 bg-red-600 hover:bg-red-700 text-white text-[8px] font-black uppercase rounded-lg px-3">
              <AlertTriangle className="h-3 w-3 mr-1.5" />PURGAR REGISTRO
            </Button>
            <div className="flex items-center gap-1.5 bg-[#0f101d] px-2 rounded-lg border border-white/5 h-7">
              <Filter className="h-3 w-3 text-primary" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-full bg-transparent border-none text-[9px] font-black uppercase text-white focus:ring-0 p-0"><SelectValue placeholder="FILTRO" /></SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                  <SelectItem value="all" className="text-[9px] font-black">TODOS</SelectItem>
                  <SelectItem value="Activo" className="text-[9px] font-black text-green-500">ACTIVOS</SelectItem>
                  <SelectItem value="Doble" className="text-[9px] font-black text-red-500">DOBLES</SelectItem>
                  <SelectItem value="Completo" className="text-[9px] font-black text-blue-500">COMPLETADOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black px-2 py-1">OPS: {filteredShifts.length}</Badge>
          </div>
        </div>
        
        <div ref={tableContainerRef} onScroll={handleScroll} className="overflow-x-auto no-scrollbar">
          <Table className="min-w-[1050px]">
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground h-10 pl-5">Fecha</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground h-10">Nombre Completo</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground h-10">Proyecto / Ubicación</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground h-10 text-center">Entrada</TableHead>
                {!hideExitTime && <TableHead className="text-[11px] font-black uppercase text-muted-foreground h-10 text-center">Salida Real</TableHead>}
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground h-10 text-center">Jornada</TableHead>
                {showObservations && (
                  <>
                    <TableHead className="text-[11px] font-black uppercase text-muted-foreground h-10 text-center">Horas</TableHead>
                    <TableHead className="text-[11px] font-black uppercase text-muted-foreground h-10 text-center">Observaciones</TableHead>
                  </>
                )}
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground h-10 text-right pr-5">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.length > 0 ? (
                filteredShifts.map((shift, index) => {
                  const exitDate = parseFirebaseDate(shift.exitTime);
                  const isCompleted = !!exitDate;
                  const workedHours = calculateWorkedHours(shift);

                  return (
                    <TableRow key={shift.id} className={`border-b border-white/5 transition-all ${isCompleted ? 'opacity-40' : 'hover:bg-white/[0.03]'}`}>
                      <TableCell className="pl-5 py-2.5"><div className="font-mono text-[10px] font-bold text-muted-foreground">{formatDisplayDate(shift.entryTime)}</div></TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-black text-white uppercase tracking-tight">{shift.guardName}</span>
                          <Badge className={`text-[7px] font-black uppercase px-1.5 py-0 rounded-full border ${getStatusBadgeStyles(shift.status || 'Activo', isCompleted)}`}>
                            {isCompleted ? 'COMPLETADO' : (shift.status || 'Activo')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5"><Building2 className="h-2.5 w-2.5 text-primary/70" /><span className="text-[10px] font-black text-primary uppercase font-mono">{shift.projectCode}</span></div>
                          <span className="text-[10px] text-white font-bold uppercase truncate max-w-[200px] mt-1">{shift.projectName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2.5"><div className="font-mono text-[10px] font-black text-white bg-[#1a1b2e] px-1.5 py-0.5 rounded border border-white/5">{formatDisplayTime(shift.entryTime)}</div></TableCell>
                      {!hideExitTime && (
                        <TableCell className="text-center py-2.5">
                          <div className={`flex items-center justify-center gap-1 font-mono text-[10px] font-black ${isCompleted ? 'text-emerald-500' : 'text-accent opacity-40'}`}>
                            <LogOut className="h-2.5 w-2.5" />{isCompleted ? formatDisplayTime(shift.exitTime) : '--:--'}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-center py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="outline-none group">
                              <Badge variant="secondary" className="bg-[#1a1b2e] text-primary border-primary/20 font-black text-[8px] py-0 px-1.5 hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1">
                                {shift.shiftDuration || shift.duration || '12h'}<ChevronDown className="h-2 w-2 opacity-50" />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1a1b2e] border-white/10 text-white min-w-[160px]">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="text-[9px] font-black uppercase py-1.5"><Timer className="h-3 w-3 mr-2" />Ajustar Horas</DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent className="bg-[#1a1b2e] border-white/10 max-h-[300px] overflow-y-auto">
                                  {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                                    <DropdownMenuItem key={h} onClick={() => handleUpdateDuration(shift.id, shift.guardName, `${h}h`)} className="text-[9px] font-black uppercase py-1.5">{h} Horas</DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(shift.id, shift.guardName, 'Completo')} className="text-[9px] font-black uppercase text-green-500 py-1.5"><CheckCircle2 className="h-3 w-3 mr-2" />Cierre Manual</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      {showObservations && (
                        <>
                          <TableCell className="text-center py-2.5">
                            <div className={`flex items-center justify-center gap-1 font-mono text-[10px] font-black ${isCompleted ? 'text-emerald-500' : 'text-primary'}`}>
                              <Timer className="h-2.5 w-2.5" />{workedHours}H
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <Select value={shift.observation || ''} onValueChange={(val) => handleUpdateObservation(shift.id, val)}>
                              <SelectTrigger className="h-7 bg-[#1a1b2e] border-white/10 text-[9px] font-black uppercase w-full max-w-[130px] mx-auto"><SelectValue placeholder="SIN OBS" /></SelectTrigger>
                              <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                                {OBSERVATION_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt} className="text-[9px] font-black uppercase">{opt}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right pr-5 py-2.5"><Button variant="ghost" size="icon" onClick={() => handleDelete(shift.id, shift.guardName)} className="h-8 w-8 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={showObservations ? 9 : 7} className="text-center py-16 text-muted-foreground italic font-medium">Sincronizando registros activos...</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1b2e] border border-red-500/20 text-white max-w-sm rounded-3xl p-8">
          <DialogHeader className="space-y-3">
            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-red-500/20"><ShieldAlert className="h-8 w-8 text-red-500" /></div>
            <DialogTitle className="text-center text-xl font-black uppercase">Acceso Restringido</DialogTitle>
            <DialogDescription className="text-center text-[10px] font-black uppercase text-muted-foreground">Confirme clave de mando para depurar la base de datos.</DialogDescription>
          </DialogHeader>
          <div className="py-4"><Input type="password" placeholder="••••" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && handleConfirmDeleteAll()} className="h-14 bg-black/40 text-center tracking-[0.5em] text-white text-lg rounded-xl" autoFocus /></div>
          <DialogFooter className="flex-col gap-2"><Button onClick={handleConfirmDeleteAll} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase">DEPURAR REGISTROS</Button><Button variant="ghost" onClick={() => { setIsDeleteDialogOpen(false); setDeletePassword(''); }} className="w-full h-10 text-muted-foreground font-bold uppercase text-[9px]">CANCELAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
