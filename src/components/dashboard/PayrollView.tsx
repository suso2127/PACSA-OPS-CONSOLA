
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
  Filter,
  Building2,
  CalendarDays
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

interface PayrollRecord {
  id: string;
  guardName: string;
  projectName: string;
  projectCode: string;
  status: string;
  entryTime: any;
}

export function PayrollView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PayrollRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('all');

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const todayIndex = (new Date().getDay() + 6) % 7;

  useEffect(() => {
    const q = query(collection(db, 'shift-registrations'), orderBy('entryTime', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PayrollRecord[];
      
      const uniqueGuards = records.reduce((acc: PayrollRecord[], current) => {
        const x = acc.find(item => item.guardName === current.guardName);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      setData(uniqueGuards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(record => {
      const matchesName = record.guardName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = record.projectCode.toLowerCase().includes(projectSearch.toLowerCase()) || 
                             record.projectName.toLowerCase().includes(projectSearch.toLowerCase());
      return matchesName && matchesProject;
    });
  }, [data, searchTerm, projectSearch]);

  const calculateTotalHours = (record: PayrollRecord) => {
    const baseHours = 12 * 7;
    const extraHours = record.status === 'Doble' ? 12 : 0;
    return baseHours + extraHours;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Planilla Operativa</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Control de asistencia y cobertura semanal</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-destructive hover:bg-destructive/90 text-white border-none h-11 px-6 rounded-lg">
            <Printer className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
          <Button variant="outline" className="bg-primary hover:bg-primary/90 text-primary-foreground border-none h-11 px-6 rounded-lg">
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card/50 p-4 rounded-xl border border-border shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Completo</label>
          <div className="relative">
            <Input 
              placeholder="Buscar guardia..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background border-border h-11 pl-10 text-xs font-bold"
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Puesto / Proyecto</label>
          <div className="relative">
            <Input 
              placeholder="Buscar por código o sitio..." 
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="bg-background border-border h-11 pl-10 text-xs font-bold"
            />
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Día Específico</label>
          <div className="flex items-center gap-2 bg-background border border-border px-3 py-0 rounded-md h-11">
            <CalendarDays className="h-4 w-4 text-primary" />
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="bg-transparent border-none text-xs font-bold uppercase tracking-widest text-white focus:ring-0 h-full p-0">
                <SelectValue placeholder="DÍA" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-white">
                <SelectItem value="all" className="text-xs font-bold uppercase">Todos los Días</SelectItem>
                {days.map((day) => (
                  <SelectItem key={day} value={day} className="text-xs font-bold uppercase">{day}</SelectItem>
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
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Nombre del Guardia</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 border-r">Puesto / Proyecto</TableHead>
                {days.map((day, idx) => (
                  <TableHead key={day} className={`text-[10px] font-black uppercase tracking-widest h-12 text-center ${idx === todayIndex ? 'text-primary' : ''} ${selectedDay !== 'all' && selectedDay !== day ? 'opacity-30' : ''}`}>
                    {day}
                  </TableHead>
                ))}
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-right pr-6">Total Hrs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-20 text-muted-foreground italic">Cargando planilla...</TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((record) => (
                  <TableRow key={record.id} className="border-border hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-primary" />
                        {record.guardName}
                      </div>
                    </TableCell>
                    <TableCell className="border-r">
                      <span className="text-[10px] font-black text-primary block">{record.projectCode}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{record.projectName}</span>
                    </TableCell>
                    {days.map((day, idx) => {
                      const isToday = idx === todayIndex;
                      const isDouble = isToday && record.status === 'Doble';
                      const isFilteredDay = selectedDay === 'all' || selectedDay === day;
                      return (
                        <TableCell key={day} className={`text-center ${!isFilteredDay ? 'opacity-20' : ''}`}>
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] font-bold px-2 py-0 ${isDouble ? 'bg-destructive text-white border-destructive' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}
                          >
                            {isDouble ? '24H' : '12H'}
                          </Badge>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 text-primary font-black">
                        <Clock className="h-3 w-3 opacity-50" />
                        <span className="text-sm">{calculateTotalHours(record)}H</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-20 text-muted-foreground italic">No hay datos que coincidan con los filtros.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
