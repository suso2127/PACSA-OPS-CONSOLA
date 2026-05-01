
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
  Globe,
  Trash,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [isConfigLocked, setIsConfigLocked] = useState(true);
  const [masterCode, setMasterCode] = useState('GRUPOPACSA');
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
    if (isConfigLocked) {
      toast({
        variant: "destructive",
        title: "SISTEMA BLOQUEADO",
        description: "Debe desactivar el bloqueo de seguridad para guardar cambios."
      });
      return;
    }
    
    setConfigLoading(true);
    setTimeout(() => {
      setConfigLoading(false);
      toast({
        title: "CONFIGURACIÓN SINCRONIZADA",
        description: "Los parámetros de la plataforma han sido actualizados exitosamente."
      });
    }, 1200);
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
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Plus className="h-5 w-5" />
              <h2 className="text-lg font-bold uppercase tracking-tight">Nuevo Proyecto</h2>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Configuración de Sitio Operativo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ID del Proyecto</Label>
              <Input 
                placeholder="EJ. ABC-01" 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="bg-secondary/30 border-border h-11 font-mono uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre / Cliente</Label>
              <Input 
                placeholder="Ej. Corporativo Alfa" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-secondary/30 border-border h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ubicación</Label>
              <div className="relative">
                <Input 
                  placeholder="Dirección del puesto" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="bg-secondary/30 border-border h-11 pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <LayoutList className="h-3 w-3" />
                Planilla de Guardias (Día)
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {(['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const).map((day) => (
                  <div key={day} className="space-y-1">
                    <Label className="text-[9px] uppercase block text-center font-black text-muted-foreground">{day}</Label>
                    <Input 
                      type="number"
                      value={formData.requirements[day]}
                      onChange={(e) => handleRequirementChange(day, e.target.value)}
                      className="bg-secondary/30 border-border h-9 text-center p-0 font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl shadow-lg mt-4"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Proyecto"}
            </Button>
          </form>
        </div>

        {/* Listado de Proyectos */}
        <div className="lg:col-span-8 bg-card/40 border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-tight">Proyectos Activos</h2>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Código</TableHead>
                  <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Proyecto</TableHead>
                  <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Req. Hoy</TableHead>
                  <TableHead className="text-right text-muted-foreground text-[10px] font-black uppercase tracking-widest">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <TableRow key={project.id} className="border-b border-border/50 hover:bg-secondary/20">
                      <TableCell className="font-mono text-primary font-black">{project.code}</TableCell>
                      <TableCell>
                        <div className="font-bold text-sm">{project.name}</div>
                        <div className="text-[9px] text-muted-foreground uppercase font-medium">{project.location || 'UBICACIÓN PENDIENTE'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-center text-xs font-black inline-block">
                          {getTodayRequirement(project)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic text-sm">
                      Sincronizando base de datos de proyectos...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* SECCIÓN: CONFIGURACIÓN DE PLATAFORMA (RÉPLICA IMAGEN) */}
      <div className="pt-8 border-t border-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-2xl border border-primary/20 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase text-foreground leading-none mb-1">Configuración de Plataforma</h2>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Panel de Ajustes Estructurales</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5 px-8 py-3 bg-secondary/30 rounded-2xl border border-border">
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isConfigLocked ? 'text-destructive' : 'text-green-500'}`}>
                ESTADO: {isConfigLocked ? 'BLOQUEADO' : 'EDITABLE'}
              </span>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Bloqueo de Seguridad</p>
            </div>
            <Switch 
              checked={!isConfigLocked} 
              onCheckedChange={(v) => setIsConfigLocked(!v)}
              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-destructive"
            />
          </div>
        </div>

        <Accordion type="multiple" defaultValue={["security"]} className="space-y-4">
          {/* Acordeón: Seguridad de Acceso y Código Corporativo */}
          <AccordionItem value="security" className="border-none bg-card rounded-2xl overflow-hidden shadow-xl">
            <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-secondary/10 transition-all border-none">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <span className="text-foreground text-base font-black uppercase tracking-tight block">Seguridad de Acceso y Código Corporativo</span>
                  <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-widest">Parámetros de identificación global</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Código Corporativo (Maestro)</Label>
                  <div className="relative">
                    <Input 
                      value={masterCode}
                      onChange={(e) => setMasterCode(e.target.value.toUpperCase())}
                      disabled={isConfigLocked}
                      className="bg-secondary/20 border-border h-11 rounded-xl text-primary font-black tracking-widest pl-10 focus:ring-1 focus:ring-primary/50" 
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                  </div>
                  <p className="text-[8px] text-muted-foreground font-medium italic">Acceso genérico para emergencias</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">PIN Administrador</Label>
                  <Input 
                    type="password" 
                    defaultValue="1234" 
                    disabled={isConfigLocked}
                    className="bg-secondary/20 border-border h-11 rounded-xl tracking-[0.5em] focus:ring-1 focus:ring-primary/50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">PIN Supervisor</Label>
                  <Input 
                    type="password" 
                    defaultValue="5678" 
                    disabled={isConfigLocked}
                    className="bg-secondary/20 border-border h-11 rounded-xl tracking-[0.5em] focus:ring-1 focus:ring-primary/50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">PIN Guardia</Label>
                  <Input 
                    type="password" 
                    defaultValue="0000" 
                    disabled={isConfigLocked}
                    className="bg-secondary/20 border-border h-11 rounded-xl tracking-[0.5em] focus:ring-1 focus:ring-primary/50" 
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Acordeón: Límites Operativos */}
          <AccordionItem value="limits" className="border-none bg-card rounded-2xl overflow-hidden shadow-xl">
            <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-secondary/10 transition-all border-none">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-sky-500" />
                <div className="text-left">
                  <span className="text-foreground text-base font-black uppercase tracking-tight block">Límites Operativos</span>
                  <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-widest">Control global de jornadas y alertas</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="space-y-6 pt-4 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Máximo Jornada Normal (Hrs)</Label>
                    <Input 
                      type="number" 
                      defaultValue="12" 
                      disabled={isConfigLocked}
                      className="bg-secondary/20 border-border h-11 rounded-xl text-white w-24 text-center font-bold" 
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-xl border border-border">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-black uppercase text-foreground tracking-widest">Alertas de Doble Jornada</Label>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">Notificación visual en dashboard</p>
                    </div>
                    <Switch defaultChecked disabled={isConfigLocked} className="data-[state=checked]:bg-primary" />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Acordeón: Respaldo y Datos */}
          <AccordionItem value="backup" className="border-none bg-card rounded-2xl overflow-hidden shadow-xl">
            <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-secondary/10 transition-all border-none">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <span className="text-foreground text-base font-black uppercase tracking-tight block">Respaldo Estructural de la Plataforma</span>
                  <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-widest">Exportación completa de proyectos y registros</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="space-y-6 pt-4 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" disabled={isConfigLocked} className="h-14 bg-secondary/20 border-border text-primary hover:bg-primary hover:text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl transition-all">
                    <Download className="mr-3 h-4 w-4" />
                    EXPORTAR ESTRUCTURA FULL (.JSON)
                  </Button>
                  <Button variant="outline" disabled={isConfigLocked} className="h-14 bg-secondary/20 border-border text-foreground hover:bg-secondary font-black uppercase text-[10px] tracking-widest rounded-xl transition-all">
                    <Upload className="mr-3 h-4 w-4" />
                    RESTAURAR ESTRUCTURA
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Mantenimiento de Base de Datos */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 group shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-7 w-7" />
              <h4 className="text-xl font-black uppercase tracking-tight">Mantenimiento de Base de Datos</h4>
            </div>
            <p className="text-[10px] text-destructive/60 font-black uppercase tracking-[0.15em] ml-10">Acciones permanentes sobre el historial operativo</p>
          </div>
          <Button 
            variant="destructive"
            disabled={isConfigLocked}
            className="bg-destructive hover:bg-destructive/90 text-white font-black uppercase text-[10px] tracking-widest h-14 px-12 rounded-xl shadow-lg transition-all"
            onClick={() => toast({ variant: "destructive", title: "AUTORIZACIÓN REQUERIDA", description: "El vaciado de datos requiere clave ADMIN-01." })}
          >
            <Trash className="mr-3 h-4 w-4" />
            VACIAR HISTORIAL DE TURNOS
          </Button>
        </div>

        {/* Botón Guardar Cambios Global */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSaveConfig}
            disabled={configLoading || isConfigLocked}
            className={`h-16 px-16 font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl transition-all duration-500 ${
              isConfigLocked 
                ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed border border-border' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 active:scale-95'
            }`}
          >
            {configLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="flex items-center gap-4">
                {isConfigLocked ? <Lock className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                {isConfigLocked ? "SISTEMA BLOQUEADO" : "SINCRONIZAR AJUSTES ESTRUCTURALES"}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

