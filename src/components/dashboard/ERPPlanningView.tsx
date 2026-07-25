
"use client"

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { erpDb } from '@/lib/firebase-erp';
import { 
  Calendar, 
  ClipboardList, 
  Database, 
  Activity, 
  Lock,
  Loader2,
  ExternalLink,
  ChevronRight,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';

interface ERPRecord {
  id: string;
  [key: string]: any;
}

export function ERPPlanningView() {
  const [operations, setOperations] = useState<ERPRecord[]>([]);
  const [planning, setPlanning] = useState<ERPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveTab] = useState<'plan' | 'ops'>('plan');

  useEffect(() => {
    // Sincronización en tiempo real con Colección Planificación del ERP
    const qPlan = query(collection(erpDb, 'planificacion'), limit(50));
    const unsubPlan = onSnapshot(qPlan, (snap) => {
      setPlanning(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error ERP Plan:", err));

    // Sincronización en tiempo real con Colección Operaciones del ERP
    const qOps = query(collection(erpDb, 'operaciones'), limit(50));
    const unsubOps = onSnapshot(qOps, (snap) => {
      setOperations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => console.error("Error ERP Ops:", err));

    return () => {
      unsubPlan();
      unsubOps();
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Cabecera del Módulo ERP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Database className="h-8 w-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none flex items-center gap-3">
              Mando Planificación ERP
              <Badge variant="outline" className="bg-indigo-500/5 border-indigo-500/30 text-indigo-400 text-[8px] font-black tracking-[0.2em] px-3">
                READ-ONLY MIRROR
              </Badge>
            </h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <Lock className="h-3 w-3" /> Puente Seguro: studio-672610643-a82f1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#1a1b2e] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('plan')}
            className={cn(
              "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeSubTab === 'plan' ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            Lista Planificación
          </button>
          <button
            onClick={() => setActiveTab('ops')}
            className={cn(
              "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeSubTab === 'ops' ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            Operaciones ERP
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-40 text-center space-y-4 opacity-50">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Estableciendo túnel de datos con ERP...</p>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  {activeSubTab === 'plan' ? 'Registros de Planificación Central' : 'Estado de Operaciones Corporativas'}
                </h3>
              </div>
              <Badge className="bg-white/5 text-muted-foreground border-white/10 text-[9px] font-black">
                {activeSubTab === 'plan' ? planning.length : operations.length} DOCUMENTOS
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-black/20">
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground pl-6">ID Documento</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Descripción / Cliente</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Fecha / Registro</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right pr-6">Estado ERP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activeSubTab === 'plan' ? planning : operations).map((item) => (
                    <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <TableCell className="pl-6 font-mono text-[10px] text-indigo-400/70">{item.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white uppercase">
                            {item.cliente || item.proyecto || item.nombre || 'REGISTRO SIN NOMBRE'}
                          </span>
                          <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                            {item.descripcion || item.servicio || 'Sin descripción adicional'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-white/70">
                            {item.fecha || item.creado || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] font-black uppercase tracking-tighter">
                          {item.estado || 'PROCESADO'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(activeSubTab === 'plan' ? planning : operations).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-muted-foreground italic text-xs uppercase tracking-widest opacity-20">
                        No se detectaron registros en el módulo del ERP
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <ExternalLink className="h-4 w-4 text-indigo-500" />
            <p className="text-[10px] font-bold text-indigo-400/80 uppercase leading-relaxed">
              Los datos mostrados arriba son una réplica exacta del ERP corporativo. Cualquier discrepancia debe ser corregida desde la plataforma central de Gestión Empresarial.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
