
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
  CalendarDays,
  Calendar as CalendarIcon
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
  const [weekDays, setWeekDays] = useState<{name: string, date: string, fullDate: string}[]>([]);

  // Configuración de la semana real (Lunes a Domingo)
  useEffect(() => {
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const now = new Date();
    const currentWeek = [];
    
    // Obtener el lunes de la semana actual
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      currentWeek.push({
        name: names[d.getDay()],
        date: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
        fullDate: d.toDateString()
      });
    }
    setWeekDays(currentWeek);
  }, []);

  const calculateDuration = (entry: any, exit: any) => {
    if (!entry) return 0;
    const start = entry.toDate ? entry.toDate() : new Date(entry);
    const end = exit?.toDate ? exit.toDate() : (exit ? new Date(exit) : new Date());
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  const formatToHHMM = (hoursDecimal: number) => {
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
        const dateKey = entryDate.toDateString();
        
        // Calcular horas reales basadas en entrada/salida capturada en Operaciones
        const decimalHours = calculateDuration(curr.entryTime, curr.exitTime);
        const displayHours = formatToHHMM(decimalHours);

        if (!acc[name].shiftsByDay[dateKey]) {
          acc[name].shiftsByDay[dateKey] = { 
            displayHours, 
            decimalHours, 
            status: curr.status 
          };
        } else {
          // Acumulación diaria por si existen múltiples relevos
          acc[name].shiftsByDay[dateKey].decimalHours += decimalHours;
          acc[name].shiftsByDay[dateKey].displayHours = formatToHHMM(acc[name].shiftsByDay[dateKey].decimalHours);
        }
        
        return acc;
      }, {});

      // Mapeo final y cálculo de totales por fila
      const finalData = Object.values(grouped).map((guard: any) => {
        const total = Object.values(guard.shiftsByDay).reduce((sum: number, day: any) => sum + day.decimalHours, 0);
        return { ...guard, totalHours: total };
      });

      setGuardsData(finalData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredData = useMemo(() => {
    return guardsData.filter(guard => {
      const matchesName = (guard.guardName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = (guard.projectCode || '').toLowerCase().includes(projectSearch.toLowerCase()) || 
                             (guard.projectName || '').toLowerCase().includes(projectSearch.toLowerCase());
      return matchesName && matchesProject;
    });
  }, [guardsData, searchTerm, projectSearch]);

  const todayDateString = new Date().toDateString();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Planilla Operativa</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Auditoría de asistencia real — Semana del {weekDays[0]?.date} al {weekDays[6]?.date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-destructive hover:bg-destructive/90 text-white border-none h-11 px-6 rounded-lg">
            <Printer className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" className="bg-primary hover:bg-primary/90 text-primary-foreground border-none h-11 px-6 rounded-lg">
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card/50 p-4 rounded-xl border border-border shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Filtro por Nombre</label>
          <div className="relative">
            <Input 
              placeholder="Buscar guardia..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background border-border h-11 pl-10 text-xs font-bold"
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
              className="bg-background border-border h-11 pl-10 text-xs font-bold"
            />
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Enfoque por Día</label>
          <div className="flex items-center gap-2 bg-background border border-border px-3 py-0 rounded-md h-11">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <Select value={selectedDayFilter} onValueChange={setSelectedDayFilter}>
              <SelectTrigger className="bg-transparent border-none text-xs font-bold uppercase tracking-widest focus:ring-0 h-full p-0">
                <SelectValue placeholder="DÍA" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all" className="text-xs font-bold uppercase">Toda la Semana</SelectItem>
                {weekDays.map((day) => (
                  <SelectItem key={day.fullDate} value={day.fullDate} className="text-xs font-bold uppercase">{day.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Elemento PACSA</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 border-r">Puesto Asignado</TableHead>
                {weekDays.map((day) => {
                  const isToday = day.fullDate === todayDateString;
                  const isFiltered = selectedDayFilter !== 'all' && selectedDayFilter !== day.fullDate;
                  return (
                    <TableHead key={day.fullDate} className={`text-[10px] font-black uppercase tracking-widest h-12 text-center ${isToday ? 'text-primary' : ''} ${isFiltered ? 'opacity-20' : ''}`}>
                      <div className="flex flex-col items-center">
                        <span>{day.name}</span>
                        <span className="text-[8px] opacity-60 font-mono">{day.date}</span>
                      </div>
                    </TableHead>
                  );
                })}
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-right pr-6">Horas Reales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-20 text-muted-foreground italic">Sincronizando planilla operativa...</TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((guard) => (
                  <TableRow key={guard.guardName} className="border-border hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-primary" />
                        {guard.guardName}
                      </div>
                    </TableCell>
                    <TableCell className="border-r">
                      <span className="text-[10px] font-black text-primary block">{guard.projectCode}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{guard.projectName}</span>
                    </TableCell>
                    {weekDays.map((day) => {
                      const shift = guard.shiftsByDay[day.fullDate];
                      const isToday = day.fullDate === todayDateString;
                      const isFiltered = selectedDayFilter !== 'all' && selectedDayFilter !== day.fullDate;
                      
                      return (
                        <TableCell key={day.fullDate} className={`text-center ${isFiltered ? 'opacity-10' : ''}`}>
                          {shift ? (
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] font-bold px-2 py-0 ${shift.status === 'Doble' ? 'bg-destructive text-white border-destructive' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}
                            >
                              {shift.displayHours}H
                            </Badge>
                          ) : (
                            <span className="text-[9px] text-muted-foreground/20 font-mono">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 text-primary font-black">
                        <Clock className="h-3 w-3 opacity-50" />
                        <span className="text-sm">{formatToHHMM(guard.totalHours)}H</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-20 text-muted-foreground italic">No se han detectado registros en la semana real.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
