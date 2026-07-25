"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Printer, 
  User,
  Download,
  Clock,
  Search,
  Building2,
  CalendarIcon,
  RotateCcw
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
  const [loading, setLoading] = useState(true);
  const [guardsData, setGuardsData] = useState<PayrollGuard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [periodDays, setPeriodDays] = useState<{name: string, date: string, fullDate: string}[]>([]);

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
      // Obtener el último día del mes actual
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

  useEffect(() => {
    const q = query(collection(db, 'shift-registrations'), orderBy('entryTime', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allShifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Agrupar por Guardia
      const grouped = allShifts.reduce((acc: Record<string, PayrollGuard>, curr) => {
        const name = curr.guardName;
        if (!acc[name]) {
          acc[name] = {
            guardName: name,
            projectCode: curr.projectCode,
            projectName: curr.projectName,
            totalHours: 0,
            shiftsByDay: {}
          };
        }

        const entryDate = curr.entryTime?.toDate ? curr.entryTime.toDate() : new Date(curr.entryTime);
        if (isNaN(entryDate.getTime())) return acc;

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
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('PLANILLA OPERATIVA PACSA - REPORTE QUINCENAL', 14, 20);
    doc.setFontSize(10);
    doc.text(`Periodo: ${periodDays[0]?.date} al ${periodDays[periodDays.length - 1]?.date}`, 14, 28);
    
    const head = [['GUARDIA', 'PUESTO', ...periodDays.map(d => d.name + ' ' + d.date.split('/')[0]), 'TOTAL']];
    const body = filteredData.map(g => [
      g.guardName,
      g.projectCode,
      ...periodDays.map(d => g.shiftsByDay[d.fullDate]?.displayHours || '-'),
      formatToHHMM(g.totalHours)
    ]);

    autoTable(doc, {
      startY: 35,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 7 }
    });

    doc.save(`Planilla_PACSA_Quincena_${periodDays[0]?.date.replace('/', '-')}.pdf`);
  };

  const exportExcel = () => {
    const headers = ['Guardia', 'Proyecto', ...periodDays.map(d => `${d.name} ${d.date}`), 'Total Horas'];
    const rows = filteredData.map(g => [
      g.guardName,
      g.projectCode,
      ...periodDays.map(d => g.shiftsByDay[d.fullDate]?.displayHours || '00:00'),
      formatToHHMM(g.totalHours)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Planilla_PACSA_Quincena_${periodDays[0]?.date.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayDateString = new Date().toDateString();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Planilla Operativa Quincenal</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1 uppercase tracking-widest">
            Auditoría de asistencia — Periodo del {periodDays[0]?.date} al {periodDays[periodDays.length - 1]?.date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={exportPDF} variant="outline" className="bg-red-600 hover:bg-red-700 text-white border-none h-11 px-6 rounded-xl shadow-lg">
            <Printer className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button onClick={exportExcel} variant="outline" className="bg-[#10b981] hover:bg-[#059669] text-white border-none h-11 px-6 rounded-xl shadow-lg">
            <Download className="mr-2 h-4 w-4" />
            Excel
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
  );
}
