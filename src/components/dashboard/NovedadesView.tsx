
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
  ShieldAlert
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { NuevaNovedadForm } from './NuevaNovedadForm';
import { NovedadDetalle } from './NovedadDetalle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function NovedadesView() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Control de Novedades
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">
            Módulo de Registro de Incidentes y Reportes Operativos
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" /> NUEVA NOVEDAD
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-8 relative">
          <Input 
            placeholder="BUSCAR POR PROYECTO, N° O REFERENCIA..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 bg-[#1a1b2e] border-white/5 pl-12 rounded-2xl text-[11px] font-black uppercase tracking-wider text-white"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <Button variant="outline" className="h-14 flex-1 bg-[#1a1b2e] border-white/5 text-[9px] font-black uppercase tracking-widest rounded-2xl">
            <Filter className="h-4 w-4 mr-2" /> Filtros Avanzados
          </Button>
          <Button variant="outline" size="icon" className="h-14 w-14 bg-[#1a1b2e] border-white/5 rounded-2xl">
            <RefreshCw className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </div>

      <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/[0.01]">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 pl-6">N° Novedad</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Proyecto</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Referencia</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center">Severidad</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center">Estado</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 opacity-50">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Sincronizando Base de Datos...
                </TableCell>
              </TableRow>
            ) : filtered.length > 0 ? (
              filtered.map((n) => (
                <TableRow key={n.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell className="pl-6 font-mono text-xs font-black text-primary">{n.numeroNovedad}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white uppercase">{n.proyectoNombre}</span>
                      <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{n.lugar}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white uppercase">{n.referencia}</span>
                      <span className="text-[8px] text-muted-foreground uppercase">{n.tipoIncidente}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2", getSeverityStyle(n.severidad))}>
                      {n.severidad}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2", getStatusStyle(n.estado))}>
                      {n.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSelectedNovedad(n)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(n.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-32 text-muted-foreground italic font-black uppercase tracking-[0.3em] opacity-20">
                  Sin reportes de novedad en este periodo
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
