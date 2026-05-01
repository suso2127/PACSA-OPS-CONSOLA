
"use client"

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Calendar, Clock, Search, Building2, Loader2 } from 'lucide-react';

export function GuardRegistrationForm() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [detectedProject, setDetectedProject] = useState<{name: string, client: string} | null>(null);
  
  const [formData, setFormData] = useState({
    guardName: '',
    projectCode: '',
    duration: '8h',
    shiftType: 'Diurno'
  });

  const { toast } = useToast();

  // Reloj en tiempo real
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Búsqueda de proyecto por código
  useEffect(() => {
    const searchProject = async () => {
      if (formData.projectCode.length >= 4) {
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
        status: 'Activo'
      });
      
      toast({
        title: "Entrada Registrada",
        description: `Turno iniciado para ${formData.guardName}.`
      });
      
      setFormData({ guardName: '', projectCode: '', duration: '8h', shiftType: 'Diurno' });
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date).replace(/^\w/, (c) => c.toUpperCase());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-[#1a1b2e] border border-white/5 rounded-2xl shadow-2xl p-8 max-w-xl mx-auto space-y-8">
      {/* Título */}
      <div className="flex items-center gap-3 text-primary">
        <UserPlus className="h-6 w-6" />
        <h2 className="text-xl font-bold tracking-tight">Nuevo Registro de Turno</h2>
      </div>

      {/* Header de Fecha/Hora */}
      <div className="bg-[#25273c] border border-white/5 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha de Operación</p>
            <p className="text-sm font-semibold">{currentTime ? formatDate(currentTime) : 'Cargando...'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Hora de Entrada</p>
          <p className="text-3xl font-black text-primary tracking-tighter tabular-nums">
            {currentTime ? formatTime(currentTime) : '--:-- --'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre */}
        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight">Nombre Completo del Guardia</Label>
          <Input 
            placeholder="Ingrese el nombre del elemento" 
            value={formData.guardName}
            onChange={(e) => setFormData({...formData, guardName: e.target.value})}
            className="h-14 bg-[#25273c] border-white/5 focus:ring-primary/20 text-lg placeholder:text-muted-foreground/30"
          />
        </div>

        {/* Código de Proyecto */}
        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight">Código del Proyecto / Cliente</Label>
          <div className="relative">
            <Input 
              placeholder="INGRESE EL CÓDIGO (EJ. EP01)" 
              value={formData.projectCode}
              onChange={(e) => setFormData({...formData, projectCode: e.target.value.toUpperCase()})}
              className="h-14 bg-[#25273c] border-white/5 focus:ring-primary/20 text-lg font-mono uppercase pr-12 placeholder:text-muted-foreground/30"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {projectLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Search className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>
        </div>

        {/* Status Detección */}
        <div className={`bg-[#25273c] border ${detectedProject ? 'border-primary/20' : 'border-dashed border-white/10'} rounded-xl p-4 flex items-center gap-4 transition-all duration-300`}>
          <div className={`p-3 rounded-lg ${detectedProject ? 'bg-primary/20' : 'bg-muted/10'}`}>
            <Building2 className={`h-5 w-5 ${detectedProject ? 'text-primary' : 'text-muted-foreground/50'}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cliente Detectado</p>
            <p className={`text-sm italic ${detectedProject ? 'text-foreground font-medium' : 'text-muted-foreground/50'}`}>
              {detectedProject ? `${detectedProject.client} - ${detectedProject.name}` : 'Esperando código válido...'}
            </p>
          </div>
        </div>

        {/* Selectores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight">Duración Turno (Hrs)</Label>
            <Select value={formData.duration} onValueChange={(v) => setFormData({...formData, duration: v})}>
              <SelectTrigger className="h-12 bg-[#25273c] border-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8h">8h</SelectItem>
                <SelectItem value="12h">12h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight">Tipo de Turno</Label>
            <Select value={formData.shiftType} onValueChange={(v) => setFormData({...formData, shiftType: v})}>
              <SelectTrigger className="h-12 bg-[#25273c] border-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Diurno">Diurno</SelectItem>
                <SelectItem value="Nocturno">Nocturno</SelectItem>
                <SelectItem value="Mixto">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg uppercase tracking-wider rounded-xl shadow-lg transition-all"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Registrar Entrada"}
        </Button>
      </form>
    </div>
  );
}
