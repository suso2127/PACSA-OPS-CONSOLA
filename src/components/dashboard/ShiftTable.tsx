
"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, serverTimestamp, deleteDoc, getDocs, addDoc } from 'firebase/firestore';
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
  ShieldAlert,
  UserPlus,
  Pencil,
  Plus,
  Search,
  Loader2,
  User,
  Save
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Shift {
  id: string;
  guardName: string;
  clientName: string;
  projectName: string;
  projectCode: string;
  projectId?: string;
  projectLocation?: string;
  entryTime: any;
  exitTime?: any;
  shiftType: string;
  duration: string;
  shiftDuration?: string;
  observation?: string;
  status: string;
}

interface ProjectItem {
  id: string;
  code: string;
  name: string;
  location?: string;
}

interface ShiftTableProps {
  showObservations?: boolean;
  hideExitTime?: boolean;
}

export function ShiftTable({ showObservations = false, hideExitTime = false }: ShiftTableProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [shiftToPurge, setShiftToPurge] = useState<Shift | null>(null);

  // Modal para registrar turno directamente en Operaciones
  const [isNewShiftOpen, setIsNewShiftOpen] = useState(false);
  const [newGuardName, setNewGuardName] = useState('');
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newShiftType, setNewShiftType] = useState('Diurno');
  const [newDuration, setNewDuration] = useState('12h');
  const [savingNewShift, setSavingNewShift] = useState(false);

  // Modal para editar completamente el registro de turno en Operaciones
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editForm, setEditForm] = useState({
    guardName: '',
    projectCode: '',
    projectName: '',
    clientName: '',
    projectLocation: '',
    projectId: '',
    shiftType: 'Diurno',
    duration: '12h',
    status: 'Activo',
    entryDateTime: '',
    exitDateTime: '',
    hasExitTime: false,
    observation: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  
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

  // Helper para convertir cualquier Date/Timestamp de Firebase a formato 'YYYY-MM-DDTHH:mm' para input datetime-local
  const toDateTimeLocalValue = (ts: any): string => {
    const d = parseFirebaseDate(ts);
    if (!d) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fromDateTimeLocalValue = (str: string): Date | null => {
    if (!str || !str.trim()) return null;
    const parts = str.split('T');
    if (parts.length === 2) {
      const [datePart, timePart] = parts;
      const [y, m, d] = datePart.split('-').map(Number);
      const [h, min] = timePart.split(':').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && !isNaN(h) && !isNaN(min)) {
        return new Date(y, m - 1, d, h, min, 0);
      }
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Cargar catálogo de proyectos en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const list = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          code: data.code || '',
          name: data.name || '',
          location: data.location || ''
        };
      });
      setProjects(list);
    });
    return () => unsub();
  }, []);

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
    
    if (status === 'Finalizado' || status === 'Completo' || status.toLowerCase() === 'completado') {
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

  // Registrar salida: Solo debe usar updateDoc para actualizar el registro de entrada existente con exitTime y status 'completado'
  const handleRegisterExit = async (id: string, name?: string) => {
    try {
      const shiftRef = doc(db, 'shift-registrations', id);
      await updateDoc(shiftRef, {
        exitTime: serverTimestamp(),
        status: 'completado'
      });
      toast({
        title: "SALIDA REGISTRADA",
        description: `Salida de ${name || 'elemento'} registrada con éxito (estado: completado).`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "ERROR AL REGISTRAR SALIDA",
        description: `No se pudo actualizar la salida de ${name || 'elemento'}.`
      });
    }
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

  const handleOpenPurgeForShift = (shift: Shift) => {
    setShiftToPurge(shift);
    setDeletePassword('');
    setIsDeleteDialogOpen(true);
  };

  const handleOpenPurgeAll = () => {
    setShiftToPurge(null);
    setDeletePassword('');
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmPurge = async () => {
    if (deletePassword !== 'GP') {
      toast({ 
        variant: "destructive", 
        title: "CLAVE INCORRECTA", 
        description: "Acceso denegado. Clave de mando inválida." 
      });
      return;
    }
    setLoading(true);
    const targetShift = shiftToPurge;
    setIsDeleteDialogOpen(false);
    setDeletePassword('');
    setShiftToPurge(null);

    try {
      if (targetShift) {
        await deleteDoc(doc(db, 'shift-registrations', targetShift.id));
        toast({ 
          title: "TURNO PURGADO CON ÉXITO", 
          description: `El registro de ${targetShift.guardName} ha sido eliminado permanentemente.` 
        });
      } else {
        const q = query(collection(db, 'shift-registrations'));
        const snapshot = await getDocs(q);
        await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
        toast({ 
          title: "PURGA GENERAL DE REGISTROS", 
          description: "La base de datos de turnos ha sido depurada por completo." 
        });
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "ERROR OPERATIVO", 
        description: "Fallo en la purga del registro." 
      });
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

  // Manejadores para Registrar Turno directamente en Operaciones
  const handleSelectProjectForNewShift = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setNewProjectId(proj.id);
      setNewProjectCode(proj.code);
      setNewProjectName(proj.name);
    }
  };

  const handleSaveNewShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardName.trim() || !newProjectCode.trim()) {
      toast({
        variant: "destructive",
        title: "DATOS INCOMPLETOS",
        description: "Ingrese el nombre del elemento y el código de proyecto."
      });
      return;
    }

    setSavingNewShift(true);
    try {
      const code = newProjectCode.trim().toUpperCase();
      const name = (newProjectName.trim() || code).toUpperCase();
      const isDouble = newDuration === '24h';

      await addDoc(collection(db, 'shift-registrations'), {
        guardName: newGuardName.trim().toUpperCase(),
        projectCode: code,
        projectName: name,
        clientName: name,
        projectId: newProjectId || '',
        shiftType: newShiftType,
        duration: newDuration,
        shiftDuration: newDuration,
        status: isDouble ? 'Doble' : 'Activo',
        entryTime: serverTimestamp(),
        exitTime: null,
        createdAt: serverTimestamp()
      });

      toast({
        title: "TURNO REGISTRADO EN OPERACIONES",
        description: `Elemento ${newGuardName.trim().toUpperCase()} vinculado a [${code}]. Sincronizado en tiempo real con el Dashboard.`
      });

      setIsNewShiftOpen(false);
      setNewGuardName('');
      setNewProjectCode('');
      setNewProjectName('');
      setNewProjectId('');
      setNewDuration('12h');
      setNewShiftType('Diurno');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "ERROR AL REGISTRAR",
        description: "No se pudo guardar el turno en tiempo real."
      });
    } finally {
      setSavingNewShift(false);
    }
  };

  // Manejadores para Editar Registro Completo de Turno en Operaciones
  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    const found = projects.find(p => 
      p.code?.trim().toUpperCase() === shift.projectCode?.trim().toUpperCase() ||
      p.name?.trim().toUpperCase() === shift.projectName?.trim().toUpperCase()
    );
    const exitDate = parseFirebaseDate(shift.exitTime);

    setEditForm({
      guardName: shift.guardName || '',
      projectCode: shift.projectCode || '',
      projectName: shift.projectName || '',
      clientName: shift.clientName || shift.projectName || '',
      projectLocation: shift.projectLocation || found?.location || '',
      projectId: shift.projectId || found?.id || '',
      shiftType: shift.shiftType || 'Diurno',
      duration: shift.shiftDuration || shift.duration || '12h',
      status: shift.status || (exitDate ? 'Completo' : 'Activo'),
      entryDateTime: toDateTimeLocalValue(shift.entryTime),
      exitDateTime: exitDate ? toDateTimeLocalValue(shift.exitTime) : '',
      hasExitTime: !!exitDate,
      observation: shift.observation || ''
    });
  };

  const handleSelectProjectForEdit = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setEditForm(prev => ({
        ...prev,
        projectId: proj.id,
        projectCode: proj.code || '',
        projectName: proj.name || '',
        clientName: proj.name || '',
        projectLocation: proj.location || prev.projectLocation
      }));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    if (!editForm.guardName.trim()) {
      toast({
        variant: "destructive",
        title: "NOMBRE REQUERIDO",
        description: "Debe ingresar el nombre del elemento o guardia."
      });
      return;
    }
    if (!editForm.projectCode.trim()) {
      toast({
        variant: "destructive",
        title: "CÓDIGO REQUERIDO",
        description: "Debe indicar el código del proyecto para este turno."
      });
      return;
    }

    setSavingEdit(true);
    try {
      const code = editForm.projectCode.trim().toUpperCase();
      const pName = (editForm.projectName.trim() || code).toUpperCase();
      const cName = (editForm.clientName.trim() || pName).toUpperCase();

      const updateData: any = {
        guardName: editForm.guardName.trim().toUpperCase(),
        projectCode: code,
        projectName: pName,
        clientName: cName,
        projectId: editForm.projectId || '',
        projectLocation: editForm.projectLocation.trim(),
        shiftType: editForm.shiftType,
        duration: editForm.duration,
        shiftDuration: editForm.duration,
        status: editForm.status,
        observation: editForm.observation.trim(),
        updatedAt: serverTimestamp()
      };

      // Fecha y hora de entrada
      if (editForm.entryDateTime) {
        const entryDate = fromDateTimeLocalValue(editForm.entryDateTime);
        if (entryDate) {
          updateData.entryTime = entryDate;
        }
      }

      // Fecha y hora de salida
      if (editForm.hasExitTime && editForm.exitDateTime) {
        const exitDate = fromDateTimeLocalValue(editForm.exitDateTime);
        if (exitDate) {
          updateData.exitTime = exitDate;
        }
      } else {
        updateData.exitTime = null;
      }

      await updateDoc(doc(db, 'shift-registrations', editingShift.id), updateData);

      toast({
        title: "TURNO ACTUALIZADO",
        description: `Los cambios para ${updateData.guardName} han sido guardados y sincronizados.`
      });

      setEditingShift(null);
    } catch (error: any) {
      console.error("Error al actualizar turno:", error);
      toast({
        variant: "destructive",
        title: "ERROR DE ACTUALIZACIÓN",
        description: error?.message || "No se pudieron guardar los cambios del turno."
      });
    } finally {
      setSavingEdit(false);
    }
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
            <Button 
              onClick={() => setIsNewShiftOpen(true)} 
              className="h-7 bg-primary hover:bg-primary/90 text-primary-foreground text-[8px] font-black uppercase rounded-lg px-2.5 shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-1.5"
            >
              <UserPlus className="h-3 w-3" />
              REGISTRAR TURNO
            </Button>
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
            <Button onClick={handleOpenPurgeAll} className="h-7 bg-red-600 hover:bg-red-700 text-white text-[8px] font-black uppercase rounded-lg px-3">
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
                        <div 
                          onClick={() => handleOpenEdit(shift)}
                          className="flex flex-col cursor-pointer group/proj hover:bg-white/5 p-1.5 rounded-lg border border-transparent hover:border-primary/20 transition-all max-w-[220px]"
                          title="Clic para editar registro de turno completo"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-2.5 w-2.5 text-primary" />
                              <span className="text-[10px] font-black text-primary uppercase font-mono tracking-wider">
                                {shift.projectCode || 'SIN CÓDIGO'}
                              </span>
                            </div>
                            <div className="p-0.5 rounded bg-white/5 opacity-0 group-hover/proj:opacity-100 text-muted-foreground hover:text-white transition-opacity">
                              <Pencil className="h-2.5 w-2.5" />
                            </div>
                          </div>
                          <span className="text-[10px] text-white font-bold uppercase truncate mt-0.5">
                            {shift.projectName || 'Sin Nombre Asignado'}
                          </span>
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
                            <DropdownMenuItem onClick={() => handleRegisterExit(shift.id, shift.guardName)} className="text-[9px] font-black uppercase text-emerald-400 py-1.5"><CheckCircle2 className="h-3 w-3 mr-2" />Registrar Salida (Completado)</DropdownMenuItem>
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
                      <TableCell className="text-right pr-5 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEdit(shift)} 
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Editar registro de turno completo"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenPurgeForShift(shift)} 
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            title="Purgar registro (Eliminar turno)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
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

      {/* Modal para Registrar Turno en Operaciones */}
      <Dialog open={isNewShiftOpen} onOpenChange={setIsNewShiftOpen}>
        <DialogContent className="bg-[#1a1b2e] border border-white/10 text-white max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-black uppercase text-white">
                  Registrar Turno Operativo
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  El código y proyecto ingresados actualizarán el Dashboard en tiempo real.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveNewShift} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">
                1. Seleccionar Proyecto Registrado (Autocompletar)
              </Label>
              <Select onValueChange={handleSelectProjectForNewShift}>
                <SelectTrigger className="bg-[#0f101d] border-white/10 text-white text-xs h-9">
                  <SelectValue placeholder="-- Escoger del listado de proyectos --" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10 text-white max-h-[220px]">
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id} className="text-xs">
                      <span className="font-mono font-bold text-primary mr-2">[{proj.code}]</span>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Código de Proyecto *
                </Label>
                <Input 
                  value={newProjectCode} 
                  onChange={(e) => setNewProjectCode(e.target.value.toUpperCase())}
                  placeholder="EJ. BCT-01"
                  required
                  className="bg-[#0f101d] border-white/10 font-mono font-bold text-primary text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Nombre de Proyecto
                </Label>
                <Input 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value.toUpperCase())}
                  placeholder="EJ. BANCO TOWER"
                  className="bg-[#0f101d] border-white/10 font-bold text-xs h-9 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">
                Nombre Completo del Elemento / Guardia *
              </Label>
              <Input 
                value={newGuardName} 
                onChange={(e) => setNewGuardName(e.target.value.toUpperCase())}
                placeholder="EJ. JUAN PÉREZ"
                required
                className="bg-[#0f101d] border-white/10 font-bold text-xs h-9 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Jornada
                </Label>
                <Select value={newDuration} onValueChange={setNewDuration}>
                  <SelectTrigger className="bg-[#0f101d] border-white/10 text-white text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                    <SelectItem value="12h" className="text-xs font-bold">12 HORAS (Activo)</SelectItem>
                    <SelectItem value="24h" className="text-xs font-bold text-red-400">24 HORAS (Doble)</SelectItem>
                    <SelectItem value="8h" className="text-xs font-bold">8 HORAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Turno
                </Label>
                <Select value={newShiftType} onValueChange={setNewShiftType}>
                  <SelectTrigger className="bg-[#0f101d] border-white/10 text-white text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                    <SelectItem value="Diurno" className="text-xs font-bold">DIURNO</SelectItem>
                    <SelectItem value="Nocturno" className="text-xs font-bold">NOCTURNO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsNewShiftOpen(false)}
                className="h-9 text-muted-foreground font-bold uppercase text-[10px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={savingNewShift}
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] px-4 flex items-center gap-1.5"
              >
                {savingNewShift ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3" /> Registrar y Sincronizar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Registro Completo de Turno en Operaciones */}
      <Dialog open={!!editingShift} onOpenChange={(open) => !open && setEditingShift(null)}>
        <DialogContent className="bg-[#1a1b2e] border border-primary/20 text-white max-w-xl rounded-2xl p-6 max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-1 shrink-0 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <Pencil className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-black uppercase text-white tracking-tight">
                  Editar Registro de Turno
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Modifique cualquier dato del turno (elemento, proyecto, horarios, jornada, estado u observaciones).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingShift && (
            <form onSubmit={handleSaveEdit} className="space-y-4 py-2 overflow-y-auto pr-1">
              {/* Sección: Elemento / Guardia */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3 w-3 text-primary" /> Nombre Completo del Elemento *
                </Label>
                <Input 
                  value={editForm.guardName} 
                  onChange={(e) => setEditForm({ ...editForm, guardName: e.target.value.toUpperCase() })}
                  placeholder="EJ. JUAN CARLOS PÉREZ"
                  required
                  className="bg-[#0f101d] border-white/10 font-bold text-xs h-9 text-white"
                />
              </div>

              {/* Sección: Proyecto y Ubicación */}
              <div className="bg-[#0f101d] p-3 rounded-xl border border-white/5 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-primary" /> Catálogo de Proyectos (Autocompletar)
                  </Label>
                  <Select onValueChange={handleSelectProjectForEdit} value={editForm.projectId}>
                    <SelectTrigger className="bg-[#151726] border-white/10 text-white text-xs h-9">
                      <SelectValue placeholder="-- Escoger del catálogo de proyectos --" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b2e] border-white/10 text-white max-h-[220px]">
                      {projects.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id} className="text-xs">
                          <span className="font-mono font-bold text-primary mr-2">[{proj.code}]</span>
                          {proj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">
                      Código de Proyecto *
                    </Label>
                    <Input 
                      value={editForm.projectCode} 
                      onChange={(e) => setEditForm({ ...editForm, projectCode: e.target.value.toUpperCase() })}
                      placeholder="EJ. BCT-01 / GP-001"
                      required
                      className="bg-[#151726] border-white/10 font-mono font-bold text-primary text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">
                      Nombre del Proyecto / Puesto
                    </Label>
                    <Input 
                      value={editForm.projectName} 
                      onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value.toUpperCase() })}
                      placeholder="EJ. BANCO TOWER"
                      className="bg-[#151726] border-white/10 font-bold text-xs h-9 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">
                      Cliente
                    </Label>
                    <Input 
                      value={editForm.clientName} 
                      onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value.toUpperCase() })}
                      placeholder="EJ. GRUPO FINANCIERO"
                      className="bg-[#151726] border-white/10 font-medium text-xs h-9 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" /> Ubicación
                    </Label>
                    <Input 
                      value={editForm.projectLocation} 
                      onChange={(e) => setEditForm({ ...editForm, projectLocation: e.target.value })}
                      placeholder="EJ. COSTA DEL ESTE, PANAMÁ"
                      className="bg-[#151726] border-white/10 font-medium text-xs h-9 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Horarios (Entrada y Salida) */}
              <div className="bg-[#0f101d] p-3 rounded-xl border border-white/5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-primary" /> Entrada (Fecha y Hora)
                    </Label>
                    <Input 
                      type="datetime-local"
                      value={editForm.entryDateTime}
                      onChange={(e) => setEditForm({ ...editForm, entryDateTime: e.target.value })}
                      className="bg-[#151726] border-white/10 text-white font-mono text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                        <LogOut className="h-3 w-3 text-emerald-400" /> Salida Real
                      </Label>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editForm.hasExitTime}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditForm(prev => ({
                              ...prev,
                              hasExitTime: checked,
                              exitDateTime: checked ? (prev.exitDateTime || toDateTimeLocalValue(new Date())) : '',
                              status: checked && prev.status === 'Activo' ? 'Completo' : prev.status
                            }));
                          }}
                          className="rounded border-white/20 bg-[#151726] text-primary focus:ring-0 h-3.5 w-3.5"
                        />
                        <span>Registrar Salida</span>
                      </label>
                    </div>
                    {editForm.hasExitTime ? (
                      <Input 
                        type="datetime-local"
                        value={editForm.exitDateTime}
                        onChange={(e) => setEditForm({ ...editForm, exitDateTime: e.target.value })}
                        className="bg-[#151726] border-white/10 text-white font-mono text-xs h-9"
                      />
                    ) : (
                      <div className="h-9 px-3 bg-[#151726]/60 border border-white/5 rounded-md flex items-center text-[10px] text-muted-foreground italic">
                        Turno en curso (Sin salida registrada)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección: Jornada, Tipo de Turno y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">
                    Estado
                  </Label>
                  <Select 
                    value={editForm.status} 
                    onValueChange={(val) => setEditForm({ 
                      ...editForm, 
                      status: val,
                      duration: val === 'Doble' ? '24h' : editForm.duration
                    })}
                  >
                    <SelectTrigger className="bg-[#0f101d] border-white/10 text-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                      <SelectItem value="Activo" className="text-xs text-green-400 font-bold">Activo</SelectItem>
                      <SelectItem value="Doble" className="text-xs text-red-400 font-bold">Doble (24h)</SelectItem>
                      <SelectItem value="Completo" className="text-xs text-blue-400 font-bold">Completo</SelectItem>
                      <SelectItem value="Finalizado" className="text-xs text-muted-foreground font-bold">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                    <Timer className="h-3 w-3 text-primary" /> Jornada
                  </Label>
                  <Select 
                    value={editForm.duration} 
                    onValueChange={(val) => setEditForm({ 
                      ...editForm, 
                      duration: val,
                      status: val === '24h' ? 'Doble' : (editForm.status === 'Doble' ? 'Activo' : editForm.status)
                    })}
                  >
                    <SelectTrigger className="bg-[#0f101d] border-white/10 text-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                      <SelectItem value="4h" className="text-xs">4 Horas</SelectItem>
                      <SelectItem value="6h" className="text-xs">6 Horas</SelectItem>
                      <SelectItem value="8h" className="text-xs">8 Horas</SelectItem>
                      <SelectItem value="10h" className="text-xs">10 Horas</SelectItem>
                      <SelectItem value="12h" className="text-xs">12 Horas</SelectItem>
                      <SelectItem value="16h" className="text-xs">16 Horas</SelectItem>
                      <SelectItem value="24h" className="text-xs text-red-400 font-bold">24 Horas (Doble)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">
                    Tipo de Turno
                  </Label>
                  <Select 
                    value={editForm.shiftType} 
                    onValueChange={(val) => setEditForm({ ...editForm, shiftType: val })}
                  >
                    <SelectTrigger className="bg-[#0f101d] border-white/10 text-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                      <SelectItem value="Diurno" className="text-xs">Diurno</SelectItem>
                      <SelectItem value="Nocturno" className="text-xs">Nocturno</SelectItem>
                      <SelectItem value="Mixto" className="text-xs">Mixto</SelectItem>
                      <SelectItem value="24 Horas" className="text-xs">24 Horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sección: Observaciones */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">
                    Observaciones Operativas
                  </Label>
                  <div className="flex items-center gap-1">
                    {['DOBLE', 'COMPLETADO', 'CAMBIO DE TURNO'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, observation: chip })}
                        className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors uppercase"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select 
                    value={OBSERVATION_OPTIONS.includes(editForm.observation) ? editForm.observation : ''} 
                    onValueChange={(val) => setEditForm({ ...editForm, observation: val })}
                  >
                    <SelectTrigger className="bg-[#0f101d] border-white/10 text-white text-xs h-9 sm:col-span-1">
                      <SelectValue placeholder="Predefinidas..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                      {OBSERVATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs font-bold uppercase">{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    value={editForm.observation} 
                    onChange={(e) => setEditForm({ ...editForm, observation: e.target.value.toUpperCase() })}
                    placeholder="Escribir o modificar observación libre..."
                    className="bg-[#0f101d] border-white/10 font-bold text-xs h-9 text-white sm:col-span-2"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-white/5 flex flex-row items-center justify-end gap-2 shrink-0">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setEditingShift(null)}
                  disabled={savingEdit}
                  className="h-9 text-muted-foreground font-bold uppercase text-[10px]"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingEdit}
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] px-5 flex items-center gap-1.5 shadow-lg shadow-primary/20"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando Cambios...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" /> Guardar Cambios
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDeletePassword('');
            setShiftToPurge(null);
          }
        }}
      >
        <DialogContent className="bg-[#1a1b2e] border border-red-500/30 text-white max-w-md rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
          <DialogHeader className="space-y-3">
            <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="h-8 w-8 text-red-500 animate-pulse" />
            </div>
            <DialogTitle className="text-center text-xl font-black uppercase tracking-tight text-white">
              Purga de Registro
            </DialogTitle>
            <DialogDescription className="text-center text-xs font-bold uppercase text-muted-foreground tracking-wide">
              {shiftToPurge ? (
                <>Protocolo de eliminación permanente para el turno seleccionado. Ingrese clave de mando para purgar.</>
              ) : (
                <>Protocolo de depuración general de base de datos. Ingrese clave de mando para purgar todos los registros.</>
              )}
            </DialogDescription>
          </DialogHeader>

          {shiftToPurge && (
            <div className="my-2 p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">Turno a Purgar</span>
                <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/40 text-[9px] font-mono font-bold">
                  {shiftToPurge.duration || '12h'} · {shiftToPurge.status || 'Activo'}
                </Badge>
              </div>
              <div className="text-sm font-black uppercase text-white tracking-wide">
                {shiftToPurge.guardName}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-mono font-bold text-primary">[{shiftToPurge.projectCode || 'S/C'}]</span>
                <span className="truncate">{shiftToPurge.projectName || 'Sin Proyecto'}</span>
              </div>
            </div>
          )}

          <div className="py-3 space-y-2">
            <Label className="text-[10px] font-black uppercase text-center block text-muted-foreground tracking-widest">
              Ingrese Clave de Mando Autorizada
            </Label>
            <Input 
              type="password" 
              placeholder="••••" 
              value={deletePassword} 
              onChange={(e) => setDeletePassword(e.target.value.toUpperCase())} 
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmPurge()} 
              className="h-12 bg-black/50 text-center tracking-[0.5em] text-white text-lg rounded-xl border-red-500/30 focus:border-red-500" 
              autoFocus 
            />
            <p className="text-[9px] text-center text-muted-foreground font-mono">
              Clave de seguridad requerida para ejecutar la purga
            </p>
          </div>

          <DialogFooter className="flex-col gap-2 pt-1">
            <Button 
              onClick={handleConfirmPurge} 
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {shiftToPurge ? 'CONFIRMAR PURGA DE TURNO' : 'DEPURAR TODOS LOS REGISTROS'}
            </Button>

            {shiftToPurge && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShiftToPurge(null)}
                className="w-full h-7 text-[9px] text-red-400/80 hover:text-red-300 hover:bg-red-500/10 uppercase font-black"
              >
                Cambiar a purga masiva de toda la base de datos
              </Button>
            )}

            <Button 
              type="button"
              variant="ghost" 
              onClick={() => { setIsDeleteDialogOpen(false); setDeletePassword(''); setShiftToPurge(null); }} 
              className="w-full h-9 text-muted-foreground font-bold uppercase text-[9px]"
            >
              CANCELAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
