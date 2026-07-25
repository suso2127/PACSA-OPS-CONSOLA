"use client"

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Minus, 
  Save, 
  X, 
  ShieldAlert, 
  Clock, 
  Terminal,
  Loader2,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NuevaNovedadFormProps {
  onCancel: () => void;
}

export function NuevaNovedadForm({ onCancel }: NuevaNovedadFormProps) {
  const [loading, setLoading] = useState(false);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    proyectoId: '',
    proyectoNombre: '',
    contactoProyecto: '',
    fecha: new Date().toISOString().split('T')[0],
    lugar: '',
    unidadTurnoId: '',
    unidadTurnoNombre: '',
    horarioServicio: '',
    referencia: '',
    tipoIncidente: 'Control de acceso',
    severidad: 'Baja',
    antecedentes: '',
    descripcionHechos: '',
    accionesTomadas: [''],
    recomendaciones: [''],
    autoridadesNotificadas: ['Ninguna'],
    estado: 'Abierto',
    notificadoInterno: ''
  });

  useEffect(() => {
    // Carga de Proyectos Dinámicos
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProyectos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Carga de Personal (Usamos registros de turno recientes para obtener nombres)
    const unsubPersonal = onSnapshot(query(collection(db, 'shift-registrations'), limit(50)), (snap) => {
      const names = Array.from(new Set(snap.docs.map(d => d.data().guardName)));
      setPersonal(names.map((name, i) => ({ id: `p-${i}`, nombre: name })));
    });

    return () => {
      unsubProjects();
      unsubPersonal();
    };
  }, []);

  const handleAddListItem = (field: 'accionesTomadas' | 'recomendaciones') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };

  const handleRemoveListItem = (field: 'accionesTomadas' | 'recomendaciones', index: number) => {
    const list = [...formData[field]];
    if (list.length === 1) return;
    list.splice(index, 1);
    setFormData({ ...formData, [field]: list });
  };

  const handleListItemChange = (field: 'accionesTomadas' | 'recomendaciones', index: number, value: string) => {
    const list = [...formData[field]];
    list[index] = value;
    setFormData({ ...formData, [field]: list });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.proyectoId || !formData.unidadTurnoNombre || !formData.referencia) {
      toast({ title: "CAMPOS REQUERIDOS", description: "Complete la información básica del incidente.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const year = new Date().getFullYear();
      // Nota: Para un contador exacto se debería usar una función atómica, aquí usamos una aproximación para el MVP
      const snap = await onSnapshot(collection(db, 'novedades'), () => {});
      const numeroNovedad = `NOV-${year}-${Math.floor(Math.random() * 90000) + 10000}`;

      await addDoc(collection(db, 'novedades'), {
        ...formData,
        numeroNovedad,
        fechaCreacion: serverTimestamp(),
        ultimaActualizacion: serverTimestamp(),
        creadoPor: 'ADMIN-01',
        anexos: []
      });

      toast({ title: "NOVEDAD REGISTRADA", description: `Se ha generado el informe ${numeroNovedad}.` });
      onCancel();
    } catch (e) {
      toast({ title: "ERROR", description: "No se pudo sincronizar el reporte.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">Nueva Novedad</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1.5">Terminal de Reporte Narrativo</p>
          </div>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-white font-black uppercase text-[10px] tracking-widest">
          <X className="h-4 w-4 mr-2" /> Cancelar Operación
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sección 1: Encabezado Operativo */}
        <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 text-primary/70 mb-2">
            <Terminal className="h-5 w-5" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em]">Encabezado Operativo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proyecto / Cliente</Label>
              <Select 
                onValueChange={(val) => {
                  const p = proyectos.find(x => x.id === val);
                  setFormData({...formData, proyectoId: val, proyectoNombre: p?.name, contactoProyecto: p?.location || 'MANDO GRUPSA'});
                }}
              >
                <SelectTrigger className="h-12 bg-[#0f101d] border-none text-[10px] font-black uppercase rounded-xl">
                  <SelectValue placeholder="SELECCIONAR PROYECTO" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10">
                  {proyectos.map(p => <SelectItem key={p.id} value={p.id} className="text-[10px] font-black uppercase">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha del Incidente</Label>
              <Input 
                type="date" 
                value={formData.fecha}
                onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                className="h-12 bg-[#0f101d] border-none text-[11px] font-black uppercase rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Área / Lugar Específico</Label>
              <Input 
                placeholder="EJ. ESTACIONAMIENTO P1" 
                value={formData.lugar}
                onChange={(e) => setFormData({...formData, lugar: e.target.value.toUpperCase()})}
                className="h-12 bg-[#0f101d] border-none text-[11px] font-black uppercase rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unidad de Turno</Label>
              <Select 
                onValueChange={(val) => setFormData({...formData, unidadTurnoNombre: val})}
              >
                <SelectTrigger className="h-12 bg-[#0f101d] border-none text-[10px] font-black uppercase rounded-xl">
                  <SelectValue placeholder="SELECCIONAR GUARDIA" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10">
                  {personal.map(p => <SelectItem key={p.id} value={p.nombre} className="text-[10px] font-black uppercase">{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horario de Servicio</Label>
              <Input 
                placeholder="EJ. 18:00 - 06:00" 
                value={formData.horarioServicio}
                onChange={(e) => setFormData({...formData, horarioServicio: e.target.value})}
                className="h-12 bg-[#0f101d] border-none text-[11px] font-black uppercase rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Referencia (Título)</Label>
              <Input 
                placeholder="TÍTULO CORTO DEL HECHO" 
                value={formData.referencia}
                onChange={(e) => setFormData({...formData, referencia: e.target.value.toUpperCase()})}
                className="h-12 bg-[#0f101d] border-none text-[11px] font-black uppercase rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Narrativa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 space-y-4 shadow-2xl">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Antecedentes</Label>
            <Textarea 
              placeholder="Describa el contexto previo al incidente..." 
              value={formData.antecedentes}
              onChange={(e) => setFormData({...formData, antecedentes: e.target.value})}
              className="min-h-[200px] bg-[#0f101d] border-none rounded-2xl p-4 text-xs font-medium leading-relaxed"
            />
          </div>
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 space-y-4 shadow-2xl">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Descripción de los Hechos</Label>
            <Textarea 
              placeholder="Describa cronológicamente lo ocurrido..." 
              value={formData.descripcionHechos}
              onChange={(e) => setFormData({...formData, descripcionHechos: e.target.value})}
              className="min-h-[200px] bg-[#0f101d] border-none rounded-2xl p-4 text-xs font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* Sección 3: Listas Dinámicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Acciones Tomadas</Label>
              <Button type="button" size="icon" onClick={() => handleAddListItem('accionesTomadas')} className="h-6 w-6 bg-primary text-white rounded-full">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-3">
              {formData.accionesTomadas.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-xs font-black text-primary/40 mt-3">{idx + 1}.</span>
                  <Input 
                    value={item}
                    onChange={(e) => handleListItemChange('accionesTomadas', idx, e.target.value)}
                    className="h-10 bg-[#0f101d] border-none text-[10px] font-bold"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveListItem('accionesTomadas', idx)} className="h-10 w-10 text-red-500">
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Recomendaciones</Label>
              <Button type="button" size="icon" onClick={() => handleAddListItem('recomendaciones')} className="h-6 w-6 bg-emerald-600 text-white rounded-full">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-3">
              {formData.recomendaciones.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-xs font-black text-emerald-500/40 mt-3">{idx + 1}.</span>
                  <Input 
                    value={item}
                    onChange={(e) => handleListItemChange('recomendaciones', idx, e.target.value)}
                    className="h-10 bg-[#0f101d] border-none text-[10px] font-bold"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveListItem('recomendaciones', idx)} className="h-10 w-10 text-red-500">
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sección 4: Metadatos y Clasificación */}
        <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-8 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Incidente</Label>
            <Select value={formData.tipoIncidente} onValueChange={(v) => setFormData({...formData, tipoIncidente: v})}>
              <SelectTrigger className="h-12 bg-[#0f101d] border-none text-[10px] font-black uppercase rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10">
                {["Control de acceso", "Emergencia médica", "Robo/hurto", "Daño a propiedad", "Alteración del orden", "Falla de equipo", "Persona sospechosa", "Vehículo sospechoso", "Otro"].map(t => (
                  <SelectItem key={t} value={t} className="text-[10px] font-black uppercase">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Severidad</Label>
            <Select value={formData.severidad} onValueChange={(v) => setFormData({...formData, severidad: v})}>
              <SelectTrigger className="h-12 bg-[#0f101d] border-none text-[10px] font-black uppercase rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10">
                {["Baja", "Media", "Alta", "Crítica"].map(t => (
                  <SelectItem key={t} value={t} className="text-[10px] font-black uppercase">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notificado Interno</Label>
            <Input 
              placeholder="NOMBRE ENCARGADO" 
              value={formData.notificadoInterno}
              onChange={(e) => setFormData({...formData, notificadoInterno: e.target.value.toUpperCase()})}
              className="h-12 bg-[#0f101d] border-none text-[11px] font-black uppercase rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado Reporte</Label>
            <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
              <SelectTrigger className="h-12 bg-[#0f101d] border-none text-[10px] font-black uppercase rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b2e] border-white/10">
                {["Abierto", "En seguimiento", "Cerrado"].map(t => (
                  <SelectItem key={t} value={t} className="text-[10px] font-black uppercase">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-20 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.4em] rounded-3xl shadow-xl transition-all"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6 mr-3" /> GUARDAR INFORME OPERATIVO</>}
        </Button>
      </form>
    </div>
  );
}
