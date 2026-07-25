
"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';
import { erpDb } from '@/lib/firebase-erp';
import { 
  Calendar, 
  ClipboardList, 
  Database, 
  Activity, 
  Lock,
  Loader2,
  ExternalLink,
  Search,
  User,
  Building2,
  Briefcase,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const YEARS = ["2024", "2025", "2026", "2027"];

interface ERPRecord {
  id: string;
  [key: string]: any;
}

export function ERPPlanningView() {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveTab] = useState<'plan' | 'ops'>('plan');
  
  // Filtros Cronológicos
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Datos del ERP
  const [schedules, setSchedules] = useState<ERPRecord[]>([]);
  const [groups, setGroups] = useState<Record<string, ERPRecord>>({});
  const [customers, setCustomers] = useState<Record<string, ERPRecord>>({});
  const [requests, setRequests] = useState<ERPRecord[]>([]);
  const [internalReqs, setInternalRequests] = useState<ERPRecord[]>([]);

  useEffect(() => {
    setLoading(true);

    // 1. Grupos Operativos (Puestos)
    const unsubGroups = onSnapshot(collection(erpDb, 'operational_groups'), (snap) => {
      const data: Record<string, ERPRecord> = {};
      snap.docs.forEach(doc => { data[doc.id] = doc.data(); });
      setGroups(data);
    });

    // 2. Clientes
    const unsubCustomers = onSnapshot(collection(erpDb, 'customers'), (snap) => {
      const data: Record<string, ERPRecord> = {};
      snap.docs.forEach(doc => { data[doc.id] = doc.data(); });
      setCustomers(data);
    });

    // 3. Operaciones (Tareas, OT, Consignas)
    const qOps = query(collection(erpDb, 'operational_requests'), orderBy('createdAt', 'desc'), limit(30));
    const unsubOps = onSnapshot(qOps, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Solicitudes Internas SI (Pendientes)
    const qInternal = query(
      collection(erpDb, 'internal_requests'), 
      where('status', 'in', ['Pendiente', 'En Revisión']),
      limit(20)
    );
    const unsubInternal = onSnapshot(qInternal, (snap) => {
      setInternalRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubGroups();
      unsubCustomers();
      unsubOps();
      unsubInternal();
    };
  }, []);

  // Sincronización de Cronograma según Mes/Año seleccionado
  useEffect(() => {
    const qPlan = query(
      collection(erpDb, 'operational_schedules'),
      where('month', '==', selectedMonth),
      where('year', '==', selectedYear)
    );

    const unsubPlan = onSnapshot(qPlan, (snap) => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error ERP Plan:", err);
      setLoading(false);
    });

    return () => unsubPlan();
  }, [selectedMonth, selectedYear]);

  // Cruce de datos para la tabla de planificación
  const joinedSchedules = useMemo(() => {
    const currentDay = new Date().getDate().toString();
    
    return schedules.map(sched => {
      const group = groups[sched.puestoId];
      const customer = group ? customers[group.clientId] : null;
      const todayShift = sched.days?.[currentDay] || 'N/A';

      return {
        ...sched,
        puestoName: group?.name || 'Puesto Desconocido',
        customerName: customer?.name || 'Cliente Desconocido',
        todayShift
      };
    });
  }, [schedules, groups, customers]);

  // Combinación de operaciones para la pestaña Ops
  const combinedOperations = useMemo(() => {
    const ops = requests.map(r => ({ ...r, category: 'Operativa' }));
    const internal = internalReqs.map(i => ({ ...i, category: 'Solicitud SI', type: 'Soporte' }));
    return [...ops, ...internal].sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [requests, internalReqs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Cabecera del Módulo ERP */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <Database className="h-10 w-10 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none flex items-center gap-3">
              Planificación ERP
              <Badge variant="outline" className="bg-indigo-500/5 border-indigo-500/30 text-indigo-400 text-[9px] font-black tracking-[0.3em] px-4 py-1">
                MIRROR
              </Badge>
            </h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-2.5 flex items-center gap-2">
              <Lock className="h-3 w-3 text-indigo-400/50" /> 
              Sincronización segura con Grupo Pacsa ERP
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-[#1a1b2e] p-2 rounded-[20px] border border-white/5 shadow-2xl">
          {/* Selectores de Periodo */}
          <div className="flex items-center gap-2 px-3 border-r border-white/10 mr-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px] h-9 border-none bg-transparent text-[11px] font-black uppercase focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                {MONTHS.map(m => <SelectItem key={m} value={m} className="text-[10px] font-black uppercase">{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[90px] h-9 border-none bg-transparent text-[11px] font-black uppercase focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                {YEARS.map(y => <SelectItem key={y} value={y} className="text-[10px] font-black uppercase">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs de Navegación */}
          <div className="flex items-center gap-1 bg-[#0f101d] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('plan')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeSubTab === 'plan' ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              Lista Planificación
            </button>
            <button
              onClick={() => setActiveTab('ops')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeSubTab === 'ops' ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              <Activity className="h-4 w-4" />
              Operaciones ERP
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-40 text-center space-y-4 opacity-50">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Consultando registros maestros...</p>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
          <div className="bg-[#1a1b2e] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
            <div className="px-8 py-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeSubTab === 'plan' ? <Briefcase className="h-5 w-5 text-indigo-400" /> : <Activity className="h-5 w-5 text-indigo-400" />}
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  {activeSubTab === 'plan' 
                    ? `Asignaciones de Turno — ${selectedMonth} ${selectedYear}` 
                    : 'Monitor de Tareas y Requerimientos'}
                </h3>
              </div>
              <Badge className="bg-white/5 text-muted-foreground border-white/10 text-[10px] font-black px-4 py-1">
                {activeSubTab === 'plan' ? joinedSchedules.length : combinedOperations.length} REGISTROS
              </Badge>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <Table>
                <TableHeader className="bg-black/20">
                  {activeSubTab === 'plan' ? (
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase text-muted-foreground pl-8 h-14">Cliente / Puesto</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-muted-foreground h-14">Colaborador Asignado</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center h-14">Turno Hoy ({new Date().getDate()})</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right pr-8 h-14">Estado</TableHead>
                    </TableRow>
                  ) : (
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase text-muted-foreground pl-8 h-14">ID / Tipo</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-muted-foreground h-14">Requerimiento / Tarea</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-muted-foreground h-14">Asignado A</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right pr-8 h-14">Estado Actual</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {activeSubTab === 'plan' ? (
                    joinedSchedules.map((item) => (
                      <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="pl-8 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-white uppercase group-hover:text-indigo-400 transition-colors">
                              {item.customerName}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                {item.puestoName}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                              <User className="h-4 w-4 text-indigo-400" />
                            </div>
                            <span className="text-xs font-bold text-white/90 uppercase">{item.employeeName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn(
                            "px-3 py-1 text-[11px] font-black font-mono border-none",
                            item.todayShift === 'LIBRE' ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                          )}>
                            {item.todayShift}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[8px] font-black text-muted-foreground uppercase">Actualizado</span>
                            <span className="text-[10px] font-bold text-white/40">
                              {item.updatedAt?.toDate ? item.updatedAt.toDate().toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    combinedOperations.map((item) => (
                      <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="pl-8 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-indigo-400 font-mono">#{item.displayId || item.id.substring(0,6).toUpperCase()}</span>
                            <Badge variant="outline" className="w-fit text-[7px] font-black uppercase px-2 bg-indigo-500/5 border-indigo-500/20 text-indigo-300">
                              {item.type || item.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-white uppercase tracking-tight leading-none">{item.title || item.description || 'SIN TÍTULO'}</span>
                            {item.category === 'Solicitud SI' && (
                              <span className="text-[8px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <AlertCircle className="h-2 w-2" /> REQUERIMIENTO INTERNO
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-500/40" />
                            <span className="text-[10px] font-bold text-white/70 uppercase">{item.assignedTo || 'SIN ASIGNAR'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge className={cn(
                            "text-[9px] font-black uppercase tracking-tighter px-3",
                            item.status === 'Completada' ? "bg-emerald-500/10 text-emerald-500" :
                            item.status === 'En Proceso' ? "bg-blue-500/10 text-blue-500" :
                            "bg-amber-500/10 text-amber-500"
                          )}>
                            {item.status || 'PENDIENTE'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {(activeSubTab === 'plan' ? joinedSchedules : combinedOperations).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white">No se detectaron registros maestros en este periodo</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 p-6 bg-indigo-500/5 rounded-[24px] border border-indigo-500/10 backdrop-blur-md">
            <ExternalLink className="h-6 w-6 text-indigo-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest leading-none">Aviso de Integración Táctica</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed max-w-4xl">
                Los datos visualizados en esta terminal son una réplica exacta del <span className="text-indigo-300">Núcleo ERP de Grupo Pacsa</span>. El acceso es estrictamente de solo lectura. Para ajustes en la planificación o asignación de tareas, debe utilizarse la plataforma central de Gestión Empresarial.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
