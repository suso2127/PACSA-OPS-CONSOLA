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
  FileText,
  MessageSquare,
  Sparkles,
  CheckCheck
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
  const [whatsappInput, setWhatsappInput] = useState('');
  const [parsedSummary, setParsedSummary] = useState<any>(null);
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

  // Analizar y extraer automáticamente los datos del reporte de WhatsApp
  const handleParseWhatsApp = (text: string) => {
    setWhatsappInput(text);
    if (!text.trim()) {
      setParsedSummary(null);
      return;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let guardName = '';
    let projectCode = '';
    let clasificacion = '';
    let detalles = '';
    let fecha = '';
    let hora = '';

    // Extracción de timestamp típico de WhatsApp ej: [16/09/2026, 14:30] ó 16/09/2026 14:30
    const waTimeMatch = text.match(/\[?(\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4})[,\s]+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?)\]?/i);
    if (waTimeMatch) {
      fecha = waTimeMatch[1];
      hora = waTimeMatch[2];
    }

    for (const line of lines) {
      // guardName
      const gMatch = line.match(/(?:guardia|agente|oficial|unidad|nombre|reporta|guardName)\s*[:=-]\s*(.+)/i);
      if (gMatch && !guardName) guardName = gMatch[1].trim();

      // projectCode
      const pMatch = line.match(/(?:proyecto|puesto|sitio|c[oó]digo|projectCode|cliente)\s*[:=-]\s*(.+)/i);
      if (pMatch && !projectCode) projectCode = pMatch[1].trim();

      // clasificacion
      const cMatch = line.match(/(?:clasificaci[oó]n|tipo(?:\s+de\s+incidente)?|incidente|categor[ií]a)\s*[:=-]\s*(.+)/i);
      if (cMatch && !clasificacion) clasificacion = cMatch[1].trim();

      // fecha
      const dMatch = line.match(/(?:fecha)\s*[:=-]\s*(\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4})/i);
      if (dMatch && !fecha) fecha = dMatch[1].trim();

      // hora
      const hMatch = line.match(/(?:hora|horario)\s*[:=-]\s*(\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?)/i);
      if (hMatch && !hora) hora = hMatch[1].trim();

      // detalles
      const dtMatch = line.match(/(?:detalles?|hechos?|descripci[oó]n|novedad|suceso|ocurrencia)\s*[:=-]\s*(.+)/i);
      if (dtMatch && !detalles) detalles = dtMatch[1].trim();
    }

    // Si detalles no tiene clave directa, tomar párrafos que no sean campos clave
    if (!detalles) {
      const nonKeyLines = lines.filter(l => 
        !l.match(/^(?:guardia|agente|oficial|unidad|nombre|reporta|proyecto|puesto|sitio|c[oó]digo|cliente|clasificaci[oó]n|tipo|fecha|hora|horario)\s*[:=-]/i) &&
        !l.match(/^\[?\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}/)
      );
      if (nonKeyLines.length > 0) {
        detalles = nonKeyLines.join('\n');
      } else {
        detalles = text;
      }
    }

    // Normalizar Fecha a formato ISO YYYY-MM-DD
    let formattedDate = '';
    if (fecha) {
      const parts = fecha.split(/[-/.]/);
      if (parts.length === 3) {
        let y = parts[2];
        let m = parts[1];
        let d = parts[0];
        if (d.length === 4) {
          y = parts[0];
          m = parts[1].padStart(2, '0');
          d = parts[2].padStart(2, '0');
        } else {
          d = d.padStart(2, '0');
          m = m.padStart(2, '0');
          if (y.length === 2) y = '20' + y;
        }
        if (!isNaN(Number(y)) && !isNaN(Number(m)) && !isNaN(Number(d))) {
          formattedDate = `${y}-${m}-${d}`;
        }
      }
    }

    // Normalizar Clasificación a una de las categorías válidas
    let normalizedClass = 'Control de acceso';
    const classLower = (clasificacion || '').toLowerCase();
    if (classLower.includes('robo') || classLower.includes('hurto')) normalizedClass = 'Robo/hurto';
    else if (classLower.includes('médic') || classLower.includes('medic') || classLower.includes('salud') || classLower.includes('accidente')) normalizedClass = 'Emergencia médica';
    else if (classLower.includes('daño') || classLower.includes('propiedad') || classLower.includes('rotura') || classLower.includes('cristal')) normalizedClass = 'Daño a propiedad';
    else if (classLower.includes('orden') || classLower.includes('pelea') || classLower.includes('discusi')) normalizedClass = 'Alteración del orden';
    else if (classLower.includes('falla') || classLower.includes('equipo') || classLower.includes('cámara') || classLower.includes('luz')) normalizedClass = 'Falla de equipo';
    else if (classLower.includes('persona') && classLower.includes('sospech')) normalizedClass = 'Persona sospechosa';
    else if (classLower.includes('veh') && classLower.includes('sospech')) normalizedClass = 'Vehículo sospechoso';
    else if (classLower.includes('acceso') || classLower.includes('entrada') || classLower.includes('puerta')) normalizedClass = 'Control de acceso';
    else if (clasificacion) normalizedClass = 'Otro';

    // Buscar proyecto coincidente
    let matchedProject = proyectos.find(p => 
      (projectCode && p.code?.toUpperCase() === projectCode.toUpperCase()) ||
      (projectCode && p.name?.toLowerCase().includes(projectCode.toLowerCase())) ||
      (projectCode && projectCode.toLowerCase().includes(p.name?.toLowerCase()))
    );

    // Si guardName no está en personal, registrarlo en la lista local para selección
    if (guardName) {
      setPersonal(prev => {
        if (prev.some(p => p.nombre.toLowerCase() === guardName.toLowerCase())) return prev;
        return [...prev, { id: `custom-${Date.now()}`, nombre: guardName }];
      });
    }

    // Auto-completar formulario
    setFormData(prev => ({
      ...prev,
      unidadTurnoNombre: guardName || prev.unidadTurnoNombre,
      proyectoId: matchedProject ? matchedProject.id : prev.proyectoId,
      proyectoNombre: matchedProject ? matchedProject.name : prev.proyectoNombre,
      contactoProyecto: matchedProject ? (matchedProject.location || 'MANDO GRUPSA') : prev.contactoProyecto,
      tipoIncidente: normalizedClass,
      descripcionHechos: detalles || prev.descripcionHechos,
      referencia: (clasificacion || normalizedClass).toUpperCase() + (detalles ? ` - ${detalles.slice(0, 35)}` : ''),
      fecha: formattedDate || prev.fecha,
      horarioServicio: hora ? hora : prev.horarioServicio,
    }));

    setParsedSummary({
      guardName: guardName || 'No detectado',
      projectCode: projectCode || (matchedProject ? matchedProject.code : 'No detectado'),
      projectName: matchedProject ? matchedProject.name : null,
      clasificacion: normalizedClass,
      detalles: detalles ? `${detalles.slice(0, 45)}...` : 'No detectados',
      fecha: formattedDate || 'Actual',
      hora: hora || 'No detectada'
    });

    toast({
      title: "REPORTE DE WHATSAPP PROCESADO",
      description: "Los campos del formulario se completaron automáticamente."
    });
  };

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
        {/* Importador Inteligente de Novedad desde WhatsApp */}
        <div className="bg-gradient-to-br from-[#1a1b2e] to-[#121324] border border-emerald-500/20 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Pegar Reporte WhatsApp
                  </h3>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Auto-Extracción
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Pegue el mensaje recibido por WhatsApp. El sistema analizará y extraerá automáticamente: guardia, puesto/código, clasificación, detalles, fecha y hora.
                </p>
              </div>
            </div>

            {whatsappInput && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setWhatsappInput('');
                  setParsedSummary(null);
                }}
                className="text-[10px] font-bold text-muted-foreground hover:text-white h-7"
              >
                Limpiar
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <Textarea
              placeholder={`Pegue aquí el reporte recibido por WhatsApp...\nEjemplo:\nGuardia: Juan Pérez\nPuesto: PRJ-NSE-001\nFecha: 16/09/2026\nHora: 14:30\nClasificación: Daño a propiedad\nDetalles: Se reporta impacto en portón vehicular por camión de reparto...`}
              value={whatsappInput}
              onChange={(e) => handleParseWhatsApp(e.target.value)}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData('text');
                if (pastedText) {
                  setTimeout(() => handleParseWhatsApp(pastedText), 50);
                }
              }}
              className="min-h-[110px] bg-[#0c0d18] border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-300/90 focus:border-emerald-500/50"
            />

            {parsedSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-[#0a0b14] p-3 rounded-2xl border border-white/5 text-[10px]">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Guardia</span>
                  <span className="font-bold text-emerald-400 truncate">{parsedSummary.guardName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Proyecto / Puesto</span>
                  <span className="font-bold text-emerald-400 truncate">{parsedSummary.projectName || parsedSummary.projectCode}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Clasificación</span>
                  <span className="font-bold text-emerald-400 truncate">{parsedSummary.clasificacion}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Fecha</span>
                  <span className="font-bold text-emerald-400 truncate">{parsedSummary.fecha}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Hora</span>
                  <span className="font-bold text-emerald-400 truncate">{parsedSummary.hora}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1">
                    <CheckCheck className="h-3 w-3" /> Formulario Lleno
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

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
                value={formData.proyectoId}
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
                value={formData.unidadTurnoNombre}
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
