
"use client"

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Search, Building2, Loader2, LogOut, Shield, Database, Users } from 'lucide-react';

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

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
      <div className="bg-secondary/50 rounded-lg p-5 flex items-center justify-between border border-border">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight uppercase leading-none">Comando Guardia</h2>
            <div className="flex flex-col mt-1.5">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Comando Dotación</span>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Terminal de Registro Sincronizada</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end text-primary/40">
          <Database className="h-4 w-4" />
          <span className="text-[7px] uppercase font-black">Sync Active</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del Guardia</Label>
          <Input 
            placeholder="Ingrese el nombre" 
            value={formData.guardName}
            onChange={(e) => setFormData({...formData, guardName: e.target.value})}
            className="h-11 bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código de Proyecto</Label>
          <div className="relative">
            <Input 
              placeholder="EJ. ABC-01" 
              value={formData.projectCode}
              onChange={(e) => setFormData({...formData, projectCode: e.target.value.toUpperCase()})}
              className="h-11 bg-background font-mono"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {projectLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duración</Label>
            <Select value={formData.duration} onValueChange={(v) => setFormData({...formData, duration: v})}>
              <SelectTrigger className="h-11 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8h">8 Horas</SelectItem>
                <SelectItem value="12h">12 Horas</SelectItem>
                <SelectItem value="24h">24 Horas (Doble)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Turno</Label>
            <Select value={formData.shiftType} onValueChange={(v) => setFormData({...formData, shiftType: v})}>
              <SelectTrigger className="h-11 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Diurno">Diurno</SelectItem>
                <SelectItem value="Nocturno">Nocturno</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-14 bg-primary text-primary-foreground font-bold uppercase tracking-widest rounded-lg shadow-sm"
        >
          {loading ? "Procesando..." : "Registrar Entrada"}
        </Button>
      </form>
    </div>
  );
}
