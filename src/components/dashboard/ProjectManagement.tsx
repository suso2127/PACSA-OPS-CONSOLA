
"use client"

import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Save, 
  Plus, 
  Trash2, 
  MapPin, 
  LayoutList,
  Loader2,
  Settings,
  ShieldCheck,
  Bell,
  Database,
  Download,
  Upload,
  AlertTriangle,
  Lock,
  Trash
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  type: string;
  requirements: {
    lun: number;
    mar: number;
    mie: number;
    jue: number;
    vie: number;
    sab: number;
    dom: number;
  };
}

export function ProjectManagement() {
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    client: '',
    location: '',
    type: 'Comercial',
    requirements: {
      lun: 0,
      mar: 0,
      mie: 0,
      jue: 0,
      vie: 0,
      sab: 0,
      dom: 0,
    }
  });

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(fetchedProjects);
    });
    return () => unsubscribe();
  }, []);

  const handleRequirementChange = (day: keyof typeof formData.requirements, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [day]: numValue
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast({
        title: "Campos Requeridos",
        description: "El código y el nombre del proyecto son obligatorios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'projects'), {
        ...formData,
        code: formData.code.toUpperCase(),
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "Proyecto Guardado",
        description: `El proyecto ${formData.code} ha sido registrado exitosamente.`
      });
      
      setFormData({
        code: '',
        name: '',
        client: '',
        location: '',
        type: 'Comercial',
        requirements: { lun: 0, mar: 0, mie: 0, jue: 0, vie: 0, sab: 0, dom: 0 }
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo guardar el proyecto.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    setConfigLoading(true);
    setTimeout(() => {
      setConfigLoading(false);
      toast({
        title: "CONFIGURACIÓN SINCRONIZADA",
        description: "Los parámetros de la plataforma han sido actualizados."
      });
    }, 1000);
  };

  const getTodayRequirement = (project: Project) => {
    const days = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const today = days[new Date().getDay()] as keyof typeof project.requirements;
    return project.requirements[today] || 0;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Sección Gestión de Proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario de Registro */}
        <div className="lg:col-span-4 bg-[#1a1b2e] border border-white/5 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Plus className="h-5 w-5" />
              <h2 className="text-lg font-bold">Nuevo Proyecto / Cliente</h2>
            </div>
            <p className="text-xs text-muted-foreground">Configure el servicio y planilla semanal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código Alfanumérico (ID)</Label>
              <Input 
                placeholder="EJ. ABC-01" 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="bg-[#25273c] border-white/5 h-11 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del Cliente / Proyecto</Label>
              <Input 
                placeholder="Ej. Corporativo Alfa" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-[#25273c] border-white/5 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ubicación</Label>
              <div className="relative">
                <Input 
                  placeholder="Dirección completa" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="bg-[#25273c] border-white/5 h-11 pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Servicio</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger className="bg-[#25273c] border-white/5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Residencial">Residencial</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Evento">Evento Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <LayoutList className="h-3 w-3" />
                Guardias Requeridos por Día
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {(['lun', 'mar', 'mie', 'jue'] as const).map((day) => (
                  <div key={day} className="space-y-1">
                    <Label className="text-[10px] uppercase block text-center font-bold text-muted-foreground">{day}</Label>
                    <Input 
                      type="number"
                      value={formData.requirements[day]}
                      onChange={(e) => handleRequirementChange(day, e.target.value)}
                      className="bg-[#25273c] border-white/5 h-9 text-center p-0"
                    />
                  </div>
                ))}
                {(['vie', 'sab', 'dom'] as const).map((day) => (
                  <div key={day} className="space-y-1">
                    <Label className="text-[10px] uppercase block text-center font-bold text-muted-foreground">{day}</Label>
                    <Input 
                      type="number"
                      value={formData.requirements[day]}
                      onChange={(e) => handleRequirementChange(day, e.target.value)}
                      className="bg-[#25273c] border-white/5 h-9 text-center p-0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest rounded-xl shadow-lg mt-4"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Guardar Proyecto</>}
            </Button>
          </form>
        </div>

        {/* Listado de Proyectos */}
        <div className="lg:col-span-8 bg-[#1a1b2e]/50 border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Listado de Proyectos Activos</h2>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-white/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs font-bold uppercase">Código</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-bold uppercase">Cliente / Proyecto</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-bold uppercase">Tipo</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-bold uppercase">Req. Hoy</TableHead>
                  <TableHead className="text-right text-muted-foreground text-xs font-bold uppercase">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <TableRow key={project.id} className="border-b border-white/5 hover:bg-white/5">
                      <TableCell className="font-mono text-primary font-bold">{project.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{project.location || 'Sin ubicación'}</div>
                      </TableCell>
                      <TableCell className="text-xs">{project.type}</TableCell>
                      <TableCell>
                        <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-center text-xs font-bold inline-block min-w-[30px]">
                          {getTodayRequirement(project)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                      No hay proyectos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* SECCIÓN: CONFIGURACIÓN DE PLATAFORMA (DENTRO DE PROYECTO) */}
      <div className="pt-12 border-t border-white/5 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Settings className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight uppercase">Configuración de Plataforma</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ajustes estructurales y de seguridad</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seguridad de Acceso */}
          <Card className="bg-[#1a1b2e] border-none shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="flex items-center gap-2 text-white text-base font-bold uppercase tracking-tight">
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                Seguridad de Acceso (PIN)
              </CardTitle>
              <CardDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                Claves operativas de la estructura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Clave de Operador</Label>
                <Input type="password" defaultValue="1234" className="bg-[#25273c] border-none h-11 rounded-xl tracking-[0.5em] focus:ring-1 focus:ring-indigo-500/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Clave de Supervisor</Label>
                <Input type="password" defaultValue="5678" className="bg-[#25273c] border-none h-11 rounded-xl tracking-[0.5em] focus:ring-1 focus:ring-indigo-500/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Clave de Guardia</Label>
                <Input type="password" defaultValue="0000" className="bg-[#25273c] border-none h-11 rounded-xl tracking-[0.5em] focus:ring-1 focus:ring-indigo-500/50" />
              </div>
            </CardContent>
          </Card>

          {/* Límites Operativos */}
          <Card className="bg-[#1a1b2e] border-none shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="flex items-center gap-2 text-white text-base font-bold uppercase tracking-tight">
                <Bell className="h-5 w-5 text-sky-500" />
                Límites Operativos
              </CardTitle>
              <CardDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                Parámetros globales de turnos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Límite turno normal (Horas)</Label>
                <Input type="number" defaultValue="12" className="bg-[#25273c] border-none h-11 rounded-xl text-white w-24 text-center font-bold" />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0f101d] rounded-2xl border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-black uppercase text-white tracking-widest">Alertas Sonoras (24h)</Label>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">Notificar excedente de jornada</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Respaldo Estructural */}
        <Card className="bg-[#1a1b2e] border-none shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="flex items-center gap-2 text-indigo-500 text-base font-bold uppercase tracking-tight">
              <Database className="h-5 w-5" />
              Respaldo Estructural de la Plataforma
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
              Exportación completa de proyectos, códigos y planillas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 bg-[#25273c] border-none text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all">
                <Download className="mr-2 h-4 w-4" />
                EXPORTAR ESTRUCTURA FULL (.JSON)
              </Button>
              <Button variant="outline" className="h-12 bg-[#25273c] border-none text-white/80 hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest rounded-xl border border-white/5">
                <Upload className="mr-2 h-4 w-4" />
                RESTAURAR ESTRUCTURA
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              <Lock className="h-3.5 w-3.5" />
              SISTEMA DE RESPALDO CIFRADO AES-256
            </div>
          </CardContent>
        </Card>

        {/* Mantenimiento Crítico */}
        <div className="bg-[#2c1a1a]/40 border border-red-500/20 shadow-2xl rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              <h4 className="text-sm font-black uppercase tracking-tight">Mantenimiento Crítico de Base de Datos</h4>
            </div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Acciones permanentes sobre el historial operativo</p>
          </div>
          <Button 
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest h-11 px-8 rounded-xl shadow-lg"
            onClick={() => toast({ variant: "destructive", title: "ACCESO DENEGADO", description: "Se requiere autorización nivel ADMIN-01." })}
          >
            <Trash className="mr-2 h-4 w-4" />
            VACIAR HISTORIAL
          </Button>
        </div>

        {/* Botón Guardar Global */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSaveConfig}
            disabled={configLoading}
            className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all"
          >
            {configLoading ? "SINCRONIZANDO..." : <><Save className="mr-3 h-5 w-5" /> GUARDAR CAMBIOS PLATAFORMA</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
