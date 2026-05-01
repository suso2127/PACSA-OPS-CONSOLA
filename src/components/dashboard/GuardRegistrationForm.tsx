
"use client"

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Calendar, Clock, Search, Building2, Loader2, LogOut } from 'lucide-react';

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

  const calculateExitTime = () => {
    if (!currentTime) return '--:-- --';
    const hoursToAdd = parseInt(formData.duration) || 8;
    const exitDate = new Date(currentTime.getTime() + hoursToAdd * 60 * 60 * 1000);
    return exitDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-[#1a1b2e] border border-white/5 rounded-2xl shadow-2xl p-6 w-full space-y-6">
      <div className="flex items-center gap-3 text-primary">
        <UserPlus className="h-6 w-6" />
        <h2 className="text-xl font-bold tracking-tight">Nuevo Registro de Turno</h2>
      </div>

      <div className="bg-[#25273c] border border-white/5 rounded-xl p-4 grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3 border-r border-white/5 pr-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Entrada Actual</p>
            <p className="text-xl font-black text-white tabular-nums">
              {currentTime ? formatTime(currentTime) : '--:-- --'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 pl-4">
          <div className="p-2 bg-accent/10 rounded-lg">
            <LogOut className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Término Programado</p>
            <p className="text-xl font-black text-accent tabular-nums">
              {calculateExitTime()}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del Guardia</Label>
          <Input 
            placeholder="Ingrese el nombre del elemento" 
            value={formData.guardName}
            onChange={(e) => setFormData({...formData, guardName: e.target.value})}
            className="h-11 bg-[#25273c] border-white/5 focus:ring-primary/20 text-md"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código de Proyecto</Label>
          <div className="relative">
            <Input 
              placeholder="EJ. ABC-01" 
              value={formData.projectCode}
              onChange={(e) => setFormData({...formData, projectCode: e.target.value.toUpperCase()})}
              className="h-11 bg-[#25273c] border-white/5 focus:ring-primary/20 text-md font-mono"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {projectLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </div>

        <div className={`bg-[#25273c] border ${detectedProject ? 'border-primary/20' : 'border-dashed border-white/10'} rounded-xl p-3 flex items-center gap-3 transition-all duration-300`}>
          <div className={`p-2 rounded-lg ${detectedProject ? 'bg-primary/20' : 'bg-muted/10'}`}>
            <Building2 className={`h-4 w-4 ${detectedProject ? 'text-primary' : 'text-muted-foreground/50'}`} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Proyecto Detectado</p>
            <p className={`text-xs truncate ${detectedProject ? 'text-foreground font-medium' : 'text-muted-foreground/50 italic'}`}>
              {detectedProject ? detectedProject.name : 'Ingrese código de proyecto...'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duración del Turno</Label>
            <Select value={formData.duration} onValueChange={(v) => setFormData({...formData, duration: v})}>
              <SelectTrigger className="h-11 bg-[#25273c] border-white/5">
                <SelectValue placeholder="Seleccione horas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8h">8 Horas (Estándar)</SelectItem>
                <SelectItem value="12h">12 Horas (Operativo)</SelectItem>
                <SelectItem value="24h">24 Horas (Doble)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Turno</Label>
            <Select value={formData.shiftType} onValueChange={(v) => setFormData({...formData, shiftType: v})}>
              <SelectTrigger className="h-11 bg-[#25273c] border-white/5">
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
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-md uppercase tracking-wider rounded-xl shadow-lg mt-2"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Registrar Entrada"}
        </Button>
      </form>
    </div>
  );
}
