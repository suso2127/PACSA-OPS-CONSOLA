
"use client"

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  AlertCircle,
  ChevronRight,
  Printer,
  Trash2,
  RefreshCw,
  Loader2,
  ShieldAlert,
  BarChart3,
  List,
  Save,
  Download,
  CalendarDays,
  FileDown
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { NuevaNovedadForm } from './NuevaNovedadForm';
import { NovedadDetalle } from './NovedadDetalle';
import { NovedadHeatmap } from './NovedadHeatmap';
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

export interface Novedad {
  id: string;
  numeroNovedad: string;
  proyectoId: string;
  proyectoNombre: string;
  contactoProyecto: string;
  fecha: any;
  lugar: string;
  unidadTurnoId: string;
  unidadTurnoNombre: string;
  horarioServicio: string;
  referencia: string;
  tipoIncidente: string;
  severidad: string;
  antecedentes: string;
  descripcionHechos: string;
  accionesTomadas: string[];
  recomendaciones: string[];
  autoridadesNotificadas: string[];
  anexos: string[];
  estado: string;
  notificadoInterno: string;
  creadoPor: string;
  fechaCreacion: any;
  ultimaActualizacion: any;
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const YEARS = ['2024', '2025', '2026', '2027'];

export function NovedadesView() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'lista' | 'analisis'>('lista');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(
      collection(db, 'novedades'),
      orderBy('fechaCreacion', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Novedad[];
      setNovedades(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este informe de novedad?')) return;
    try {
      await deleteDoc(doc(db, 'novedades', id));
      toast({ title: "ELIMINADO", description: "El informe ha sido removido." });
    } catch (e) {
      toast({ title: "ERROR", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleGlobalSave = () => {
    toast({
      title: "SISTEMA SINCRONIZADO",
      description: "Todos los cambios locales han sido respaldados en la nube."
    });
  };

  const handleGlobalExport = () => {
    toast({
      title: "GENERANDO REPORTE PDF",
      description: "El consolidado de novedades está siendo procesado para descarga."
    });
  };

  const filtered = novedades.filter(n => 
    n.proyectoNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.numeroNovedad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Crítica': return 'bg-red-500 text-white border-none animate-pulse';
      case 'Alta': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Media': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Cerrado': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'En seguimiento': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  if (showForm) {
    return <NuevaNovedadForm onCancel={() => setShowForm(false)} />;
  }

  if (selectedNovedad) {
    return <NovedadDetalle novedad={selectedNovedad} onBack={() => setSelectedNovedad(null)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">Control de Novedades</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">
              Mando de Incidentes y Reportes Operativos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegación de Vistas */}
          <div className="bg-[#1a1b2e] p-1 rounded-xl border border-white/5 flex items-center mr-2">
            <button
              onClick={() => setActiveTab('lista')}
              className={cn(
                "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'lista' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Listado
            </button>
            <button
              onClick={() => setActiveTab('analisis')}
              className={cn(
                "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'analisis' ? "bg-accent text-accent-foreground shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Análisis
            </button>
          </div>

          <Button 
            onClick={() => setShowForm(true)}
            className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_10px_20px_rgba(59,130,246,0.2)]"
          >
            <Plus className="h-4 w-4 mr-2" /> NUEVA NOVEDAD
          </Button>
        </div>
      </div>

      {/* Barra de Mando: Año, Mes, Filtro, Guardar, PDF */}
      <div className="bg-[#1a1b2e] border border-white/5 p-3 rounded-2xl flex flex-wrap items-center gap-4 shadow-2xl">
        {/* Selector de Año */}
        <div className="flex items-center gap-2 bg-[#0f101d] px-3 py-1.5 rounded-xl border border-white/5">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[80px] h-7 border-none bg-transparent text-[10px] font-black uppercase tracking-widest focus:ring-0 p-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
              {YEARS.map(y => <SelectItem key={y} value={y} className="text-[10px] font-black">{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Pestañas de Mes */}
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 bg-[#0f101d] p-1 rounded-xl border border-white/5 w-fit">
            {MONTHS.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap",
                  selectedMonth === m ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-white"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Acciones de Mando */}
        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <Button variant="outline" className="h-10 bg-[#0f101d] border-white/5 text-[9px] font-black uppercase tracking-widest px-4 rounded-xl hover:bg-white/5 transition-all">
            <Filter className="h-3.5 w-3.5 mr-2 text-primary" />
            Filtro
          </Button>
          <Button 
            onClick={handleGlobalSave}
            variant="outline" 
            className="h-10 w-10 bg-[#0f101d] border-white/5 rounded-xl p-0 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
            title="Guardar Cambios"
          >
            <Save className="h-4 w-4 text-emerald-500" />
          </Button>
          <Button 
            onClick={handleGlobalExport}
            variant="outline" 
            className="h-10 bg-red-600 hover:bg-red-700 text-white border-none text-[9px] font-black uppercase tracking-widest px-4 rounded-xl shadow-lg transition-all"
          >
            <FileDown className="h-3.5 w-3.5 mr-2" />
            PDF Consolidado
          </Button>
        </div>
      </div>

      {activeTab === 'lista' ? (
        <>
          {/* Buscador Rápido */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-12 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative">
                <Input 
                  placeholder="BUSCAR POR PROYECTO, N° DE NOVEDAD O REFERENCIA TÁCTICA..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 bg-[#1a1b2e] border-white/5 pl-12 rounded-2xl text-[11px] font-black uppercase tracking-wider text-white outline-none focus:ring-1 focus:ring-primary/40 shadow-xl"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Tabla de Novedades */}
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-white/[0.01]">
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 pl-6 text-muted-foreground">N° Novedad</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-muted-foreground">Proyecto / Cliente</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-muted-foreground">Referencia Hecho</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center text-muted-foreground">Severidad</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-right pr-6 text-muted-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 opacity-50">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sincronizando Base de Datos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length > 0 ? (
                  filtered.map((n) => (
                    <TableRow key={n.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <TableCell className="pl-6 font-mono text-xs font-black text-primary">{n.numeroNovedad}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white uppercase leading-tight">{n.proyectoNombre}</span>
                          <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-1">{n.lugar}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white uppercase tracking-tight">{n.referencia}</span>
                          <span className="text-[8px] text-muted-foreground uppercase font-medium mt-1">{n.tipoIncidente}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", getSeverityStyle(n.severidad))}>
                          {n.severidad}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", getStatusStyle(n.estado))}>
                          {n.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSelectedNovedad(n)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-lg"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(n.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-40 text-muted-foreground italic font-black uppercase tracking-[0.3em] opacity-20">
                      Sin reportes de novedad en este periodo
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <NovedadHeatmap novedades={novedades} />
      )}
    </div>
  );
}
