"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Printer, 
  User,
  Download,
  Clock,
  Search,
  Building2,
  CalendarIcon,
  RotateCcw,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Timer,
  CheckCircle2,
  Pencil,
  CalendarCheck,
  Calendar as CalendarSimple
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayrollGuard {
  guardName: string;
  projectName: string;
  projectCode: string;
  totalHours: number;
  shiftsByDay: Record<string, { displayHours: string, decimalHours: number, status: string }>;
}

export function PayrollView() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [guardsData, setGuardsData] = useState<PayrollGuard[]>([]);
  const [rawShifts, setRawShifts] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<{code: string, name: string}[]>([]);

  // Pestaña principal activa: 'quincenal' o 'analisis-dia'
  const [mainTab, setMainTab] = useState<'quincenal' | 'analisis-dia'>('quincenal');

  // Filtros de Planilla Quincenal
  const [searchTerm, setSearchTerm] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [periodDays, setPeriodDays] = useState<{name: string, date: string, fullDate: string}[]>([]);

  // Estados de la pestaña Análisis por Día
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toDateString());
  const [daySearch, setDaySearch] = useState('');
  const [dayStatusFilter, setDayStatusFilter] = useState<'all' | 'tardy' | 'double' | 'ontime'>('all');

  // Modal para registrar o editar Tardanza / Doble
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [recordForm, setRecordForm] = useState({
    guardName: '',
    projectCode: '',
    projectName: '',
    entryHour: '07:00',
    isTardy: false,
    tardinessMinutes: 15,
    tardyReason: 'Tráfico / Transporte',
    isDouble: false,
    doubleReason: 'Cubrir vacante sin relevo',
    observations: ''
  });

  // Configuración de la Quincena Real (1-15 o 16-Fin de mes)
  useEffect(() => {
    const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const dayOfMonth = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let startDay, endDay;
    if (dayOfMonth <= 15) {
      startDay = 1;
      endDay = 15;
    } else {
      startDay = 16;
      endDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    }

    const currentPeriod = [];
    for (let i = startDay; i <= endDay; i++) {
      const d = new Date(currentYear, currentMonth, i);
      currentPeriod.push({
        name: names[d.getDay()],
        date: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
        fullDate: d.toDateString()
      });
    }
    setPeriodDays(currentPeriod);
  }, []);

  // Cargar catálogo de proyectos para sugerencias
  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      const list = snap.docs.map(doc => {
        const d = doc.data();
        return {
          code: (d.code || '').trim().toUpperCase(),
          name: (d.name || '').trim().toUpperCase()
        };
      });
      setProjectsList(list);
    });
    return () => unsubProjects();
  }, []);

  const calculateDuration = (entry: any, exit: any) => {
    if (!entry) return 0;
    const start = entry.toDate ? entry.toDate() : new Date(entry);
    const end = exit?.toDate ? exit.toDate() : (exit ? new Date(exit) : new Date());
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  const formatToHHMM = (hoursDecimal: number) => {
    if (isNaN(hoursDecimal)) return "00:00";
    const hrs = Math.floor(hoursDecimal);
    const mins = Math.round((hoursDecimal - hrs) * 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const parseShiftDate = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate();
    if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatShiftTime = (ts: any) => {
    const d = parseShiftDate(ts);
    if (!d) return '--:--';
    return d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Funciones de validación de Doble y Tardanza
  const isShiftDouble = (s: any): boolean => {
    return s.status === 'Doble' || 
           s.duration === '24h' || 
           s.shiftDuration === '24h' || 
           s.isDouble === true || 
           (s.observations || '').toUpperCase().includes('DOBLE');
  };

  const isShiftTardy = (s: any): boolean => {
    if (s.isTardy === true) return true;
    if (Number(s.tardinessMinutes) > 0) return true;
    const obs = (s.observations || s.observation || '').toUpperCase();
    if (obs.includes('TARDANZA') || obs.includes('TARDE') || obs.includes('LLEGADA TARDIA')) return true;
    return false;
  };

  // Carga de turnos en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'shift-registrations'), orderBy('entryTime', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allShifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      setRawShifts(allShifts);

      // Agrupar por Guardia para la Quincena
      const grouped = allShifts.reduce((acc: Record<string, PayrollGuard>, curr) => {
        const name = curr.guardName;
        if (!name) return acc;

        if (!acc[name]) {
          acc[name] = {
            guardName: name,
            projectCode: curr.projectCode,
            projectName: curr.projectName,
            totalHours: 0,
            shiftsByDay: {}
          };
        }

        const entryDate = parseShiftDate(curr.entryTime);
        if (!entryDate) return acc;

        const dateKey = entryDate.toDateString();
        const decimalHours = calculateDuration(curr.entryTime, curr.exitTime);
        const displayHours = formatToHHMM(decimalHours);

        if (!acc[name].shiftsByDay[dateKey]) {
          acc[name].shiftsByDay[dateKey] = { 
            displayHours, 
            decimalHours, 
            status: curr.status 
          };
        } else {
          acc[name].shiftsByDay[dateKey].decimalHours += decimalHours;
          acc[name].shiftsByDay[dateKey].displayHours = formatToHHMM(acc[name].shiftsByDay[dateKey].decimalHours);
        }
        
        return acc;
      }, {});

      // Calcular total de horas para cada guardia dentro del periodo visualizado
      const finalData = Object.values(grouped).map((guard: any) => {
        const total = periodDays.reduce((sum: number, day: any) => {
          return sum + (guard.shiftsByDay[day.fullDate]?.decimalHours || 0);
        }, 0);
        return { ...guard, totalHours: total };
      });

      setGuardsData(finalData);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar planilla:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [periodDays]);

  // Turnos del día seleccionado para Análisis por Día
  const dayShifts = useMemo(() => {
    return rawShifts.filter((s) => {
      const d = parseShiftDate(s.entryTime);
      if (!d) return false;
      return d.toDateString() === selectedDay;
    });
  }, [rawShifts, selectedDay]);

  // Estadísticas del día seleccionado
  const dailyStats = useMemo(() => {
    let tardyCount = 0;
    let doubleCount = 0;
    let totalTardyMinutes = 0;
    let totalHours = 0;

    dayShifts.forEach((s) => {
      if (isShiftTardy(s)) {
        tardyCount++;
        totalTardyMinutes += Number(s.tardinessMinutes) || 0;
      }
      if (isShiftDouble(s)) {
        doubleCount++;
      }
      totalHours += calculateDuration(s.entryTime, s.exitTime);
    });

    return {
      total: dayShifts.length,
      tardyCount,
      doubleCount,
      totalTardyMinutes,
      totalHours,
      onTimeCount: Math.max(0, dayShifts.length - tardyCount)
    };
  }, [dayShifts]);

  // Filtrado de turnos del día para la tabla
  const filteredDayShifts = useMemo(() => {
    return dayShifts.filter((shift) => {
      const term = daySearch.toLowerCase();
      const matchesSearch = 
        (shift.guardName || '').toLowerCase().includes(term) ||
        (shift.projectCode || '').toLowerCase().includes(term) ||
        (shift.projectName || '').toLowerCase().includes(term) ||
        (shift.observations || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (dayStatusFilter === 'tardy') return isShiftTardy(shift);
      if (dayStatusFilter === 'double') return isShiftDouble(shift);
      if (dayStatusFilter === 'ontime') return !isShiftTardy(shift);

      return true;
    });
  }, [dayShifts, daySearch, dayStatusFilter]);

  // Alternar Doble turno directamente en Firestore
  const handleToggleDouble = async (shift: any) => {
    const currentlyDouble = isShiftDouble(shift);
    const newStatus = currentlyDouble ? 'Activo' : 'Doble';
    const newDuration = currentlyDouble ? '12h' : '24h';

    try {
      await updateDoc(doc(db, 'shift-registrations', shift.id), {
        status: newStatus,
        duration: newDuration,
        shiftDuration: newDuration,
        isDouble: !currentlyDouble,
        updatedAt: serverTimestamp()
      });
      toast({
        title: !currentlyDouble ? "DOBLE REGISTRADO" : "DOBLE CANCELADO",
        description: `${shift.guardName} ahora está registrado con jornada de ${newDuration}.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "ERROR OPERATIVO",
        description: "No se pudo actualizar el estado de doble."
      });
    }
  };

  // Alternar o marcar Tardanza directamente
  const handleToggleTardinessQuick = async (shift: any) => {
    const currentlyTardy = isShiftTardy(shift);
    try {
      if (currentlyTardy) {
        await updateDoc(doc(db, 'shift-registrations', shift.id), {
          isTardy: false,
          tardinessMinutes: 0,
          tardyReason: '',
          updatedAt: serverTimestamp()
        });
        toast({
          title: "TARDANZA REMOVIDA",
          description: `${shift.guardName} marcado como puntual.`
        });
      } else {
        await updateDoc(doc(db, 'shift-registrations', shift.id), {
          isTardy: true,
          tardinessMinutes: 15,
          tardyReason: 'Llegada con retraso',
          updatedAt: serverTimestamp()
        });
        toast({
          title: "TARDANZA REGISTRADA",
          description: `Se asignó tardanza estándar (+15 min) a ${shift.guardName}.`
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "ERROR OPERATIVO",
        description: "No se pudo modificar la tardanza."
      });
    }
  };

  // Abrir modal en modo crear o editar
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingShiftId(null);
    setRecordForm({
      guardName: '',
      projectCode: projectsList[0]?.code || '',
      projectName: projectsList[0]?.name || '',
      entryHour: '07:00',
      isTardy: false,
      tardinessMinutes: 15,
      tardyReason: 'Tráfico / Transporte',
      isDouble: false,
      doubleReason: 'Cubrir vacante sin relevo',
      observations: ''
    });
    setIsRecordModalOpen(true);
  };

  const handleOpenEditModal = (shift: any) => {
    setModalMode('edit');
    setEditingShiftId(shift.id);
    const d = parseShiftDate(shift.entryTime);
    const hourStr = d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '07:00';

    setRecordForm({
      guardName: shift.guardName || '',
      projectCode: shift.projectCode || '',
      projectName: shift.projectName || '',
      entryHour: hourStr,
      isTardy: isShiftTardy(shift),
      tardinessMinutes: Number(shift.tardinessMinutes) || 15,
      tardyReason: shift.tardyReason || 'Tráfico / Transporte',
      isDouble: isShiftDouble(shift),
      doubleReason: shift.doubleReason || 'Cubrir vacante sin relevo',
      observations: shift.observations || shift.observation || ''
    });
    setIsRecordModalOpen(true);
  };

  // Guardar registro (crear nuevo o actualizar existente)
  const handleSaveRecord = async () => {
    if (!recordForm.guardName.trim() || !recordForm.projectCode.trim()) {
      toast({
        variant: "destructive",
        title: "DATOS INCOMPLETOS",
        description: "Indique el nombre del guardia y código de puesto."
      });
      return;
    }

    try {
      const isDouble = recordForm.isDouble;
      const duration = isDouble ? '24h' : '12h';
      const status = isDouble ? 'Doble' : 'Activo';

      if (modalMode === 'edit' && editingShiftId) {
        await updateDoc(doc(db, 'shift-registrations', editingShiftId), {
          guardName: recordForm.guardName.trim().toUpperCase(),
          projectCode: recordForm.projectCode.trim().toUpperCase(),
          projectName: recordForm.projectName.trim().toUpperCase(),
          duration,
          shiftDuration: duration,
          status,
          isDouble,
          doubleReason: isDouble ? recordForm.doubleReason : '',
          isTardy: recordForm.isTardy,
          tardinessMinutes: recordForm.isTardy ? Number(recordForm.tardinessMinutes) : 0,
          tardyReason: recordForm.isTardy ? recordForm.tardyReason : '',
          observations: recordForm.observations.trim().toUpperCase(),
          updatedAt: serverTimestamp()
        });
        toast({
          title: "REGISTRO ACTUALIZADO",
          description: `Se guardaron los cambios de tardanza y doble para ${recordForm.guardName.toUpperCase()}.`
        });
      } else {
        // Crear registro en la fecha seleccionada
        const dateObj = new Date(selectedDay);
        const [hh, mm] = recordForm.entryHour.split(':').map(Number);
        dateObj.setHours(hh || 7, mm || 0, 0, 0);

        await addDoc(collection(db, 'shift-registrations'), {
          guardName: recordForm.guardName.trim().toUpperCase(),
          projectCode: recordForm.projectCode.trim().toUpperCase(),
          projectName: recordForm.projectName.trim().toUpperCase() || 'PROYECTO PACSA',
          entryTime: Timestamp.fromDate(dateObj),
          duration,
          shiftDuration: duration,
          status,
          isDouble,
          doubleReason: isDouble ? recordForm.doubleReason : '',
          isTardy: recordForm.isTardy,
          tardinessMinutes: recordForm.isTardy ? Number(recordForm.tardinessMinutes) : 0,
          tardyReason: recordForm.isTardy ? recordForm.tardyReason : '',
          observations: recordForm.observations.trim().toUpperCase(),
          createdAt: serverTimestamp()
        });
        toast({
          title: "TURNO Y NOVEDADES REGISTRADOS",
          description: `Se registró el turno de ${recordForm.guardName.toUpperCase()} con tardanzas/dobles.`
        });
      }
      setIsRecordModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "ERROR AL GUARDAR",
        description: "No se pudo guardar la información en la base de datos."
      });
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setProjectSearch('');
    setSelectedDayFilter('all');
  };

  const filteredData = useMemo(() => {
    return guardsData.filter(guard => {
      const matchesName = (guard.guardName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = (guard.projectCode || '').toLowerCase().includes(projectSearch.toLowerCase()) || 
                             (guard.projectName || '').toLowerCase().includes(projectSearch.toLowerCase());
      return matchesName && matchesProject;
    });
  }, [guardsData, searchTerm, projectSearch]);

  const exportPDF = () => {
    const docPdf = new jsPDF('landscape');
    docPdf.setFontSize(16);
    docPdf.text('PLANILLA OPERATIVA PACSA - REPORTE QUINCENAL', 14, 20);
    docPdf.setFontSize(10);
    docPdf.text(`Periodo: ${periodDays[0]?.date} al ${periodDays[periodDays.length - 1]?.date}`, 14, 28);
    
    const head = [['GUARDIA', 'PUESTO', ...periodDays.map(d => d.name + ' ' + d.date.split('/')[0]), 'TOTAL']];
    const body = filteredData.map(g => [
      g.guardName,
      g.projectCode,
      ...periodDays.map(d => g.shiftsByDay[d.fullDate]?.displayHours || '-'),
      formatToHHMM(g.totalHours)
    ]);

    autoTable(docPdf, {
      startY: 35,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 7 }
    });

    docPdf.save(`Planilla_PACSA_Quincena_${periodDays[0]?.date.replace('/', '-')}.pdf`);
  };

  const exportExcel = () => {
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const periodText = periodDays.length > 0 
      ? `Periodo: ${periodDays[0]?.date} al ${periodDays[periodDays.length - 1]?.date}`
      : '';

    const headers = [
      'Guardia',
      'Puesto',
      ...periodDays.map(d => `${d.name} ${d.date.split('/')[0]}`),
      'Total Horas'
    ];

    const rows = filteredData.map(g => [
      g.guardName || '',
      g.projectCode || '',
      ...periodDays.map(d => g.shiftsByDay[d.fullDate]?.displayHours || '-'),
      formatToHHMM(g.totalHours)
    ]);

    const titleRow = escapeCSV('PLANILLA OPERATIVA PACSA - REPORTE QUINCENAL');
    const periodRow = escapeCSV(periodText);
    const emptyRow = '';
    const headerRow = headers.map(escapeCSV).join(',');
    const dataRows = rows.map(row => row.map(escapeCSV).join(','));

    const csvContent = [
      titleRow,
      periodRow,
      emptyRow,
      headerRow,
      ...dataRows
    ].join('\r\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const startDate = periodDays[0]?.date ? periodDays[0].date.replace('/', '-') : 'quincena';
    link.setAttribute("download", `Planilla_PACSA_Quincena_${startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const todayDateString = new Date().toDateString();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Cabecera Principal con Pestañas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Módulo de Planilla</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono font-bold uppercase">
              PACSA ERP
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs font-medium mt-1 uppercase tracking-wider">
            {mainTab === 'quincenal' 
              ? `Auditoría Quincenal — Periodo del ${periodDays[0]?.date || '01'} al ${periodDays[periodDays.length - 1]?.date || '15'}`
              : `Control Diario de Asistencia — Registro Activo de Tardanzas y Dobles`}
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center bg-[#1a1b2e] p-1.5 rounded-2xl border border-white/10 shadow-xl">
          <Button
            type="button"
            variant={mainTab === 'quincenal' ? 'default' : 'ghost'}
            onClick={() => setMainTab('quincenal')}
            className={`h-10 px-5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              mainTab === 'quincenal' 
                ? 'bg-primary text-white shadow-lg' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Planilla Quincenal
          </Button>
          <Button
            type="button"
            variant={mainTab === 'analisis-dia' ? 'default' : 'ghost'}
            onClick={() => setMainTab('analisis-dia')}
            className={`h-10 px-5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              mainTab === 'analisis-dia' 
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
          >
            <Timer className="h-4 w-4" />
            Análisis por Día
            {dailyStats.tardyCount > 0 && (
              <Badge className="bg-red-600 text-white text-[9px] font-mono px-1.5 py-0 h-4 ml-1">
                {dailyStats.tardyCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: PLANILLA QUINCENAL                                            */}
      {/* ========================================================================= */}
      {mainTab === 'quincenal' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-3 py-1 font-bold uppercase">
                {filteredData.length} Elementos Auditados
              </Badge>
              <Badge variant="outline" className="text-muted-foreground text-xs font-mono">
                {periodDays.length} Días en Periodo
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={exportPDF} variant="outline" className="bg-red-600 hover:bg-red-700 text-white border-none h-11 px-6 rounded-xl shadow-lg font-black text-xs uppercase">
                <Printer className="mr-2 h-4 w-4" />
                PDF Quincenal
              </Button>
              <Button onClick={exportExcel} variant="outline" className="bg-[#10b981] hover:bg-[#059669] text-white border-none h-11 px-6 rounded-xl shadow-lg font-black text-xs uppercase">
                <Download className="mr-2 h-4 w-4" />
                Excel Quincenal
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#1a1b2e] p-5 rounded-2xl border border-white/5 shadow-2xl">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Filtro por Nombre</label>
              <div className="relative">
                <Input 
                  placeholder="Buscar guardia..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0f101d] border-none h-11 pl-10 text-xs font-bold text-white rounded-xl"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Filtro por Puesto</label>
              <div className="relative">
                <Input 
                  placeholder="Código o nombre..." 
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="bg-[#0f101d] border-none h-11 pl-10 text-xs font-bold text-white rounded-xl"
                />
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Enfoque por Día</label>
              <div className="flex items-center gap-2 bg-[#0f101d] px-3 py-0 rounded-xl h-11 border-none">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <Select value={selectedDayFilter} onValueChange={setSelectedDayFilter}>
                  <SelectTrigger className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 h-full p-0">
                    <SelectValue placeholder="DÍA" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                    <SelectItem value="all" className="text-[10px] font-black uppercase">Toda la Quincena</SelectItem>
                    {periodDays.map((day) => (
                      <SelectItem key={day.fullDate} value={day.fullDate} className="text-[10px] font-black uppercase">{day.name} {day.date}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 flex items-end">
              <Button 
                variant="outline"
                onClick={handleReset}
                className="w-full h-11 bg-secondary/20 border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white rounded-xl transition-all"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                LIMPIAR FILTROS
              </Button>
            </div>
          </div>

          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <Table className="min-w-[1400px]">
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 pl-6 text-muted-foreground">Elemento PACSA</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 border-r border-white/5 text-muted-foreground">Puesto Asignado</TableHead>
                    {periodDays.map((day) => {
                      const isToday = day.fullDate === todayDateString;
                      const isFiltered = selectedDayFilter !== 'all' && selectedDayFilter !== day.fullDate;
                      return (
                        <TableHead key={day.fullDate} className={`text-[10px] font-black uppercase tracking-widest h-14 text-center ${isToday ? 'text-primary' : 'text-muted-foreground'} ${isFiltered ? 'opacity-20' : ''}`}>
                          <div className="flex flex-col items-center">
                            <span className="leading-none">{day.name}</span>
                            <span className="text-[9px] font-mono mt-1 opacity-60">{day.date.split('/')[0]}</span>
                          </div>
                        </TableHead>
                      );
                    })}
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-right pr-6 text-primary">Total Periodo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={periodDays.length + 3} className="text-center py-32">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <p className="text-muted-foreground text-sm font-black uppercase tracking-widest italic">Sincronizando planilla quincenal...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((guard) => (
                      <TableRow key={guard.guardName} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="pl-6 font-black text-sm text-white uppercase tracking-tight">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            {guard.guardName}
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary uppercase font-mono">{guard.projectCode}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-bold truncate max-w-[150px]">{guard.projectName}</span>
                          </div>
                        </TableCell>
                        {periodDays.map((day) => {
                          const shift = guard.shiftsByDay[day.fullDate];
                          const isFiltered = selectedDayFilter !== 'all' && selectedDayFilter !== day.fullDate;
                          
                          return (
                            <TableCell key={day.fullDate} className={`text-center py-4 ${isFiltered ? 'opacity-5' : ''}`}>
                              {shift ? (
                                <Badge 
                                  variant="outline" 
                                  className={`text-[9px] font-black px-2 py-0.5 border-none shadow-sm ${shift.status === 'Doble' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}
                                >
                                  {shift.displayHours}H
                                </Badge>
                              ) : (
                                <span className="text-[9px] text-muted-foreground/10 font-mono">—</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2 text-primary font-black">
                            <Clock className="h-3 w-3 opacity-50" />
                            <span className="text-base font-mono tabular-nums">{formatToHHMM(guard.totalHours)}H</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={periodDays.length + 3} className="text-center py-32 text-muted-foreground italic font-black uppercase tracking-widest opacity-20">
                        No se han detectado registros en el periodo quincenal actual.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: ANÁLISIS POR DÍA (REGISTRO DE TARDANZAS Y DOBLES)               */}
      {/* ========================================================================= */}
      {mainTab === 'analisis-dia' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Barra de Selección de Fecha y Botón de Acción */}
          <div className="bg-[#1a1b2e] p-5 rounded-3xl border border-white/5 shadow-2xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Fecha de Análisis Operativo</h3>
                  <p className="text-[11px] font-bold text-amber-400/90 uppercase tracking-widest mt-0.5">
                    {selectedDay}
                  </p>
                </div>
              </div>

              {/* Botón Acción Principal: Registrar Tardanza / Doble */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleOpenCreateModal}
                  className="h-10 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase px-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Tardanza / Doble
                </Button>
              </div>
            </div>

            {/* Selector de días en píldoras horizontales */}
            <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2 shrink-0">
                Seleccionar Día:
              </span>
              {periodDays.map((day) => {
                const isSelected = day.fullDate === selectedDay;
                const isToday = day.fullDate === todayDateString;
                return (
                  <button
                    key={day.fullDate}
                    type="button"
                    onClick={() => setSelectedDay(day.fullDate)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center border ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                        : isToday
                        ? 'bg-[#0f101d] text-white border-amber-500/40 hover:border-amber-500'
                        : 'bg-[#0f101d] text-muted-foreground border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="leading-none">{day.name}</span>
                    <span className="text-[9px] font-mono mt-0.5">{day.date}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tarjetas de Resumen Operativo del Día */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Turnos */}
            <div className="bg-[#1a1b2e] p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Turnos del Día</span>
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-black text-white font-mono mt-3">
                {dailyStats.total}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground mt-1">
                {formatToHHMM(dailyStats.totalHours)}H totales
              </div>
            </div>

            {/* Tardanzas */}
            <div className={`p-5 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
              dailyStats.tardyCount > 0 
                ? 'bg-amber-950/20 border-amber-500/30' 
                : 'bg-[#1a1b2e] border-white/5'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Tardanzas Detectadas</span>
                <Timer className="h-4 w-4 text-amber-400 animate-pulse" />
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono mt-3 flex items-baseline gap-2">
                <span>{dailyStats.tardyCount}</span>
                {dailyStats.totalTardyMinutes > 0 && (
                  <span className="text-xs font-bold font-sans text-amber-400/80">
                    (+{dailyStats.totalTardyMinutes}m acum.)
                  </span>
                )}
              </div>
              <div className="text-[10px] font-bold text-amber-400/70 mt-1">
                {dailyStats.tardyCount === 0 ? "Sin retrasos reportados" : "Requieren seguimiento"}
              </div>
            </div>

            {/* Dobles (24h) */}
            <div className={`p-5 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
              dailyStats.doubleCount > 0 
                ? 'bg-red-950/20 border-red-500/30' 
                : 'bg-[#1a1b2e] border-white/5'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Turnos Dobles (24H)</span>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-3xl font-black text-red-400 font-mono mt-3">
                {dailyStats.doubleCount}
              </div>
              <div className="text-[10px] font-bold text-red-400/70 mt-1">
                Jornadas continuas extendidas
              </div>
            </div>

            {/* Puntuales */}
            <div className="bg-[#1a1b2e] p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">A Tiempo</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-3">
                {dailyStats.onTimeCount}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground mt-1">
                {dailyStats.total > 0 ? `${Math.round((dailyStats.onTimeCount / dailyStats.total) * 100)}% de puntualidad` : 'Sin registros'}
              </div>
            </div>
          </div>

          {/* Filtros de la Vista Diaria */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#1a1b2e] p-4 rounded-2xl border border-white/5">
            <div className="relative w-full md:w-80">
              <Input
                placeholder="Buscar por guardia, puesto u observación..."
                value={daySearch}
                onChange={(e) => setDaySearch(e.target.value)}
                className="bg-[#0f101d] border-none h-10 pl-10 text-xs font-bold text-white rounded-xl"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            </div>

            {/* Píldoras de Filtro de Estado */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              <Button
                size="sm"
                variant={dayStatusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setDayStatusFilter('all')}
                className={`text-[10px] font-black uppercase h-8 px-3 rounded-lg ${
                  dayStatusFilter === 'all' ? 'bg-primary text-white' : 'bg-transparent border-white/10 text-muted-foreground'
                }`}
              >
                Todos ({dailyStats.total})
              </Button>
              <Button
                size="sm"
                variant={dayStatusFilter === 'tardy' ? 'default' : 'outline'}
                onClick={() => setDayStatusFilter('tardy')}
                className={`text-[10px] font-black uppercase h-8 px-3 rounded-lg ${
                  dayStatusFilter === 'tardy' ? 'bg-amber-500 text-black' : 'bg-transparent border-white/10 text-amber-400'
                }`}
              >
                Tardanzas ({dailyStats.tardyCount})
              </Button>
              <Button
                size="sm"
                variant={dayStatusFilter === 'double' ? 'default' : 'outline'}
                onClick={() => setDayStatusFilter('double')}
                className={`text-[10px] font-black uppercase h-8 px-3 rounded-lg ${
                  dayStatusFilter === 'double' ? 'bg-red-600 text-white' : 'bg-transparent border-white/10 text-red-400'
                }`}
              >
                Dobles ({dailyStats.doubleCount})
              </Button>
              <Button
                size="sm"
                variant={dayStatusFilter === 'ontime' ? 'default' : 'outline'}
                onClick={() => setDayStatusFilter('ontime')}
                className={`text-[10px] font-black uppercase h-8 px-3 rounded-lg ${
                  dayStatusFilter === 'ontime' ? 'bg-emerald-600 text-white' : 'bg-transparent border-white/10 text-emerald-400'
                }`}
              >
                Puntuales ({dailyStats.onTimeCount})
              </Button>
            </div>
          </div>

          {/* Tabla de Turnos del Día con Controles de Tardanza y Doble */}
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 pl-6 text-muted-foreground">Elemento PACSA</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-muted-foreground">Puesto Asignado</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center text-muted-foreground">Entrada / Salida</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center text-muted-foreground">Control Tardanza</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center text-muted-foreground">Control Doble (24H)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-muted-foreground">Observaciones / Motivos</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-right pr-6 text-muted-foreground">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDayShifts.length > 0 ? (
                    filteredDayShifts.map((shift) => {
                      const isTardy = isShiftTardy(shift);
                      const isDouble = isShiftDouble(shift);
                      const entryStr = formatShiftTime(shift.entryTime);
                      const exitStr = shift.exitTime ? formatShiftTime(shift.exitTime) : 'En turno';

                      return (
                        <TableRow 
                          key={shift.id} 
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                            isTardy ? 'bg-amber-500/[0.03]' : ''
                          } ${isDouble ? 'bg-red-500/[0.03]' : ''}`}
                        >
                          {/* Guardia */}
                          <TableCell className="pl-6 font-black text-sm text-white uppercase tracking-tight">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                isDouble ? 'bg-red-500/20 text-red-400' : isTardy ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/10 text-primary'
                              }`}>
                                <User className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span>{shift.guardName || 'SIN NOMBRE'}</span>
                                {shift.shiftType && (
                                  <span className="text-[9px] font-bold text-muted-foreground font-mono">
                                    {shift.shiftType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Puesto */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-bold text-primary">[{shift.projectCode || 'S/C'}]</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[200px]">
                                {shift.projectName || 'Sin Puesto'}
                              </span>
                            </div>
                          </TableCell>

                          {/* Entrada / Salida */}
                          <TableCell className="text-center font-mono text-xs">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-white">{entryStr}</span>
                              <span className="text-[10px] text-muted-foreground">{exitStr}</span>
                            </div>
                          </TableCell>

                          {/* Control Tardanza */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isTardy ? (
                                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase px-2.5 py-1 flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  Tardanza {Number(shift.tardinessMinutes) > 0 ? `(+${shift.tardinessMinutes}m)` : ''}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold uppercase px-2.5 py-0.5 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Puntual
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleTardinessQuick(shift)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"
                                title={isTardy ? "Quitar tardanza" : "Marcar tardanza (+15m)"}
                              >
                                <Timer className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>

                          {/* Control Doble (24h) */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isDouble ? (
                                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase px-2.5 py-1 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  DOBLE (24H)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground/80 border-white/10 text-[10px] font-bold uppercase px-2 py-0.5">
                                  NORMAL (12H)
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleDouble(shift)}
                                className={`h-7 px-2 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                  isDouble 
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                                    : 'text-muted-foreground border-white/5 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {isDouble ? 'Desmarcar' : '+ Doble'}
                              </Button>
                            </div>
                          </TableCell>

                          {/* Observaciones */}
                          <TableCell>
                            <div className="flex flex-col text-xs max-w-[280px]">
                              {shift.tardyReason && (
                                <span className="text-[10px] font-bold text-amber-400 truncate">
                                  Motivo Retraso: {shift.tardyReason}
                                </span>
                              )}
                              {shift.doubleReason && (
                                <span className="text-[10px] font-bold text-red-400 truncate">
                                  Motivo Doble: {shift.doubleReason}
                                </span>
                              )}
                              {shift.observations && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {shift.observations}
                                </span>
                              )}
                              {!shift.tardyReason && !shift.doubleReason && !shift.observations && (
                                <span className="text-[10px] text-muted-foreground/40 italic">Sin observaciones</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Acciones */}
                          <TableCell className="text-right pr-6">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditModal(shift)}
                              className="h-8 px-2.5 bg-secondary/20 hover:bg-amber-500 hover:text-black border-white/10 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <Pencil className="h-3 w-3" />
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-24 text-muted-foreground italic font-black uppercase tracking-widest opacity-30">
                        No hay turnos registrados en la fecha {selectedDay}.
                        <div className="mt-3">
                          <Button
                            onClick={handleOpenCreateModal}
                            variant="outline"
                            className="text-xs uppercase font-bold border-white/10"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Registrar Tardanza o Doble para este día
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR O EDITAR TARDANZA / TURNO DOBLE                           */}
      {/* ========================================================================= */}
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogContent className="bg-[#1a1b2e] border-white/10 text-white max-w-lg rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
              <Timer className="h-5 w-5 text-amber-400" />
              {modalMode === 'edit' ? 'Editar Novedad de Turno' : 'Registrar Tardanza / Doble'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs uppercase font-medium tracking-wider">
              Fecha asignada: {selectedDay}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nombre del Guardia */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Elemento / Guardia
              </Label>
              <Input
                placeholder="Ej. JUAN PÉREZ"
                value={recordForm.guardName}
                onChange={(e) => setRecordForm({ ...recordForm, guardName: e.target.value })}
                className="bg-[#0f101d] border-white/10 text-white font-bold text-xs h-10 rounded-xl uppercase"
              />
            </div>

            {/* Código y Nombre del Puesto */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Código Puesto
                </Label>
                <Input
                  placeholder="Ej. P-101"
                  value={recordForm.projectCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    const found = projectsList.find(p => p.code === code);
                    setRecordForm({ 
                      ...recordForm, 
                      projectCode: code,
                      projectName: found ? found.name : recordForm.projectName
                    });
                  }}
                  className="bg-[#0f101d] border-white/10 text-primary font-mono font-bold text-xs h-10 rounded-xl uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Hora de Entrada
                </Label>
                <Input
                  type="time"
                  value={recordForm.entryHour}
                  onChange={(e) => setRecordForm({ ...recordForm, entryHour: e.target.value })}
                  className="bg-[#0f101d] border-white/10 text-white font-mono font-bold text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Nombre del Puesto / Proyecto
              </Label>
              <Input
                placeholder="Ej. TORRE PRINCIPAL PACSA"
                value={recordForm.projectName}
                onChange={(e) => setRecordForm({ ...recordForm, projectName: e.target.value })}
                className="bg-[#0f101d] border-white/10 text-white font-bold text-xs h-10 rounded-xl uppercase"
              />
            </div>

            {/* Sección Tardanza */}
            <div className="bg-[#0f101d] p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="h-4 w-4" /> ¿Registrar Tardanza?
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Marca si el elemento se presentó con retraso.
                  </p>
                </div>
                <Switch
                  checked={recordForm.isTardy}
                  onCheckedChange={(val) => setRecordForm({ ...recordForm, isTardy: val })}
                />
              </div>

              {recordForm.isTardy && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Minutos Retraso
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={480}
                      value={recordForm.tardinessMinutes}
                      onChange={(e) => setRecordForm({ ...recordForm, tardinessMinutes: Number(e.target.value) })}
                      className="bg-[#1a1b2e] border-white/10 text-amber-400 font-mono font-bold text-xs h-9 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Motivo Tardanza
                    </Label>
                    <Select 
                      value={recordForm.tardyReason} 
                      onValueChange={(val) => setRecordForm({ ...recordForm, tardyReason: val })}
                    >
                      <SelectTrigger className="bg-[#1a1b2e] border-white/10 text-white text-[10px] font-bold h-9 rounded-lg uppercase">
                        <SelectValue placeholder="Motivo..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                        <SelectItem value="Tráfico / Transporte" className="text-xs">Tráfico / Transporte</SelectItem>
                        <SelectItem value="Falta de transporte público" className="text-xs">Falta de transporte público</SelectItem>
                        <SelectItem value="Emergencia familiar" className="text-xs">Emergencia familiar</SelectItem>
                        <SelectItem value="Condición médica" className="text-xs">Condición médica</SelectItem>
                        <SelectItem value="Falta de relevo previo" className="text-xs">Falta de relevo previo</SelectItem>
                        <SelectItem value="Otro retraso" className="text-xs">Otro retraso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Sección Turno Doble */}
            <div className="bg-[#0f101d] p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> ¿Es Turno Doble (24H)?
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Extiende la jornada continua a 24 horas consecutivas.
                  </p>
                </div>
                <Switch
                  checked={recordForm.isDouble}
                  onCheckedChange={(val) => setRecordForm({ ...recordForm, isDouble: val })}
                />
              </div>

              {recordForm.isDouble && (
                <div className="pt-2 border-t border-white/5 space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Justificación del Doble
                  </Label>
                  <Select 
                    value={recordForm.doubleReason} 
                    onValueChange={(val) => setRecordForm({ ...recordForm, doubleReason: val })}
                  >
                    <SelectTrigger className="bg-[#1a1b2e] border-white/10 text-white text-[10px] font-bold h-9 rounded-lg uppercase">
                      <SelectValue placeholder="Motivo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                      <SelectItem value="Cubrir vacante sin relevo" className="text-xs">Cubrir vacante sin relevo</SelectItem>
                      <SelectItem value="Ausencia imprevista de relevo" className="text-xs">Ausencia imprevista de relevo</SelectItem>
                      <SelectItem value="Refuerzo extraordinario solicitado" className="text-xs">Refuerzo extraordinario solicitado</SelectItem>
                      <SelectItem value="Permiso especial de guardia" className="text-xs">Permiso especial de guardia</SelectItem>
                      <SelectItem value="Otro motivo" className="text-xs">Otro motivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Observaciones Generales */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Observaciones Complementarias
              </Label>
              <Textarea
                placeholder="Detalles adicionales del turno..."
                value={recordForm.observations}
                onChange={(e) => setRecordForm({ ...recordForm, observations: e.target.value })}
                className="bg-[#0f101d] border-white/10 text-white text-xs rounded-xl min-h-[70px] uppercase"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsRecordModalOpen(false)}
              className="border-white/10 text-white hover:bg-white/5 font-bold uppercase text-xs rounded-xl h-10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRecord}
              className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs rounded-xl h-10 px-5 shadow-lg shadow-amber-500/20"
            >
              Guardar Novedad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
