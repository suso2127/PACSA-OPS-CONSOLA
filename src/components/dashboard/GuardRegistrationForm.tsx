
"use client"

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Search, 
  Building2, 
  Loader2, 
  Shield, 
  Database, 
  Terminal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function GuardRegistrationForm() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [detectedProject, setDetectedProject] = useState<{name: string, client: string} | null>(null);
  
  const [formData, setFormData] = useState({
    guardName: '',
    projectCode: '',
    duration: '12h',
    shiftType: 'Diurno'
  });

  const { toast } = useToast();

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const searchProject = async () => {
      if (formData.projectCode.length >= 3) {
        setProjectLoading(true);
        try {
          const q = query(collection(db, 'projects'), where('code', '==', formData.projectCode.toUpperCase()));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setDetectedProject({ name: data.name, client: data.client || 'Cliente PACSA' });
          } else {
            setDetectedProject(null);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setProjectLoading(false);
        }
      } else {
        setDetectedProject(null);
      }
    };

    const debounce = setTimeout(searchProject, 500);
    return () => clearTimeout(debounce);
  }, [formData.projectCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guardName || !formData.projectCode) {
      toast({
        title: "Información Faltante",
        description: "Por favor complete todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'shift-registrations'), {
        guardName: formData.guardName,
        projectCode: formData.projectCode.toUpperCase(),
        clientName: detectedProject?.client || 'Pendiente',
        projectName: detectedProject?.name || 'No Identificado',
        shiftType: formData.shiftType,
        duration: formData.duration,
        entryTime: serverTimestamp(),
        status: formData.duration === '24h' ? 'Doble' : 'Activo'
      });
      
      toast({
        title: "Entrada Registrada",
        description: `Turno iniciado para ${formData.guardName}.`
      });
      
      setFormData({ guardName: '', projectCode: '', duration: '12h', shiftType: 'Diurno' });
      setDetectedProject(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo registrar la entrada.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = currentTime?.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const formattedTime = currentTime?.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="bg-[#12121c] border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-700">
      {/* Cabecera Principal - Estilo Imagen */}
      <div className="p-8 bg-[#1a1b2e]/80 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">Comando Guardia</h2>
            <div className="flex flex-col mt-1">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">Terminal de Registro</span>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">Sincronizada</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-primary/50" />
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Real-Time Sync</span>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Título de Sección Táctico */}
        <div className="flex items-center gap-3 text-primary">
          <Terminal className="h-5 w-5" />
          <h3 className="text-sm font-black uppercase tracking-[0.2em]">Terminal de Registro Táctico</h3>
        </div>

        {/* Card de Fecha y Reloj - Estilo Imagen */}
        <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/50 rounded-2xl">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha Operativa</p>
              <p className="text-base font-black text-white capitalize">{formattedDate}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reloj de Comando</p>
            <p className="text-4xl font-black font-mono text-primary leading-none tracking-tighter">{formattedTime}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Nombre del Elemento */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre del Elemento</Label>
            <Input 
              placeholder="NOMBRE Y APELLIDO" 
              value={formData.guardName}
              onChange={(e) => setFormData({...formData, guardName: e.target.value.toUpperCase()})}
              className="h-16 bg-[#1a1b2e] border-white/5 focus-visible:ring-1 focus-visible:ring-primary/50 text-base font-black tracking-tight rounded-2xl pl-6"
            />
          </div>

          {/* Código de Proyecto */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Código de Proyecto</Label>
            <div className="relative">
              <Input 
                placeholder="ID CLIENTE" 
                value={formData.projectCode}
                onChange={(e) => setFormData({...formData, projectCode: e.target.value.toUpperCase()})}
                className="h-16 bg-[#1a1b2e] border-white/5 focus-visible:ring-1 focus-visible:ring-primary/50 font-mono text-base font-black tracking-widest rounded-2xl pl-6"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                {projectLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Search className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Validador de Cliente - Estilo Imagen */}
          <div className={`bg-[#1a1b2e] border-2 border-dashed rounded-3xl p-6 transition-all duration-500 ${detectedProject ? 'border-primary/40 bg-primary/5' : 'border-white/5'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${detectedProject ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground'}`}>
                {detectedProject ? <CheckCircle2 className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente Validado</span>
                <p className={`text-sm font-black uppercase italic tracking-tighter mt-1 ${detectedProject ? 'text-white' : 'text-muted-foreground/30'}`}>
                  {detectedProject ? `${detectedProject.name} — ${detectedProject.client}` : 'Esperando código...'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jornada</Label>
              <Select value={formData.duration} onValueChange={(v) => setFormData({...formData, duration: v})}>
                <SelectTrigger className="h-14 bg-[#1a1b2e] border-white/5 rounded-2xl font-black uppercase text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10">
                  <SelectItem value="8h">8 Horas</SelectItem>
                  <SelectItem value="12h">12 Horas</SelectItem>
                  <SelectItem value="24h">24 Horas (Doble)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Turno</Label>
              <Select value={formData.shiftType} onValueChange={(v) => setFormData({...formData, shiftType: v})}>
                <SelectTrigger className="h-14 bg-[#1a1b2e] border-white/5 rounded-2xl font-black uppercase text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10">
                  <SelectItem value="Diurno">Diurno</SelectItem>
                  <SelectItem value="Nocturno">Nocturno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-20 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.3em] rounded-3xl shadow-[0_10px_40px_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "Sincronizando..." : "Registrar Entrada"}
          </Button>
        </form>
      </div>
    </div>
  );
}
