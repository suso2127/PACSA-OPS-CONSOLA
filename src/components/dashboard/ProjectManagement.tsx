
"use client"

import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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
  Calendar,
  Loader2,
  FileText,
  Edit2,
  Power,
  PowerOff,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  type: string;
  isActive?: boolean;
  requirements: {
    lun: number;
    mar: number;
    mie: number;
    jue: number;
    vie: number;
    sab: number;
    dom: number;
  };
  shiftHours: {
    lun: string;
    mar: string;
    mie: string;
    jue: string;
    vie: string;
    sab: string;
    dom: string;
  };
}

export function ProjectManagement() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    type: 'Comercial',
    requirements: {
      lun: 0, mar: 0, mie: 0, jue: 0, vie: 0, sab: 0, dom: 0,
    },
    shiftHours: {
      lun: '12h', mar: '12h', mie: '12h', jue: '12h', vie: '12h', sab: '12h', dom: '12h',
    }
  });

  const hourOptions = Array.from({ length: 24 }, (_, i) => `${i + 1}h`);

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

  const handleShiftHoursChange = (day: keyof typeof formData.shiftHours, value: string) => {
    setFormData(prev => ({
      ...prev,
      shiftHours: {
        ...prev.shiftHours,
        [day]: value
      }
    }));
  };

  const handleEditRequirementChange = (day: keyof Project['requirements'], value: string) => {
    const numValue = parseInt(value) || 0;
    if (editingProject) {
      setEditingProject({
        ...editingProject,
        requirements: {
          ...editingProject.requirements,
          [day]: numValue
        }
      });
    }
  };

  const handleEditShiftHoursChange = (day: keyof Project['shiftHours'], value: string) => {
    if (editingProject) {
      setEditingProject({
        ...editingProject,
        shiftHours: {
          ...editingProject.shiftHours,
          [day]: value
        }
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
      toast({
        title: "PROYECTO ELIMINADO",
        description: "El registro del proyecto ha sido removido del sistema."
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto.",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = currentStatus === undefined ? false : !currentStatus;
      await updateDoc(doc(db, 'projects', id), {
        isActive: newStatus
      });
      toast({
        title: "ESTADO ACTUALIZADO",
        description: `El proyecto ahora está ${newStatus ? 'ACTIVO' : 'INACTIVO'}.`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del proyecto.",
        variant: "destructive"
      });
    }
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
        isActive: true,
        code: formData.code.trim().toUpperCase(),
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "PROYECTO GUARDADO",
        description: `El proyecto ${formData.code} ha sido registrado exitosamente.`
      });
      
      setFormData({
        code: '',
        name: '',
        location: '',
        type: 'Comercial',
        requirements: { lun: 0, mar: 0, mie: 0, jue: 0, vie: 0, sab: 0, dom: 0 },
        shiftHours: { lun: '12h', mar: '12h', mie: '12h', jue: '12h', vie: '12h', sab: '12h', dom: '12h' }
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

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    if (!editingProject.code?.trim() || !editingProject.name?.trim()) {
      toast({
        title: "Campos Requeridos",
        description: "El código y el nombre del proyecto son obligatorios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const projectRef = doc(db, 'projects', editingProject.id);
      await updateDoc(projectRef, {
        code: editingProject.code.trim().toUpperCase(),
        name: editingProject.name,
        location: editingProject.location,
        type: editingProject.type,
        requirements: editingProject.requirements,
        shiftHours: editingProject.shiftHours || { lun: '12h', mar: '12h', mie: '12h', jue: '12h', vie: '12h', sab: '12h', dom: '12h' }
      });

      toast({
        title: "PROYECTO ACTUALIZADO",
        description: `Los cambios en ${editingProject.code.trim().toUpperCase()} han sido sincronizados.`
      });
      setEditingProject(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el proyecto.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTodayRequirement = (project: Project) => {
    const days = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const today = days[new Date().getDay()] as keyof typeof project.requirements;
    return project.requirements[today] || 0;
  };

  const getTodayHours = (project: Project) => {
    const days = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const today = days[new Date().getDay()] as keyof typeof project.shiftHours;
    return project.shiftHours?.[today] || '12h';
  };

  const daysList = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500 pb-20">
      {/* Columna Izquierda: Formulario */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-[#1c1c28] border border-white/5 rounded-xl p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-[#6366f1] text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Proyecto / Cliente
            </h2>
            <p className="text-muted-foreground text-[10px] font-medium mt-1">Configure el servicio y planilla semanal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-white/90">Código Alfanumérico (ID)</Label>
              <Input 
                placeholder="EJ. ABC-01" 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="bg-[#252535] border-none h-10 text-sm focus-visible:ring-1 focus-visible:ring-[#6366f1]/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-white/90">Nombre del Cliente / Proyecto</Label>
              <Input 
                placeholder="Ej. Corporativo Alfa" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-[#252535] border-none h-10 text-sm focus-visible:ring-1 focus-visible:ring-[#6366f1]/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-white/90">Ubicación</Label>
              <Input 
                placeholder="Dirección completa" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="bg-[#252535] border-none h-10 text-sm focus-visible:ring-1 focus-visible:ring-[#6366f1]/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-white/90">Tipo de Servicio</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger className="bg-[#252535] border-none h-10 text-sm focus:ring-1 focus:ring-[#6366f1]/50">
                  <SelectValue placeholder="Comercial" />
                </SelectTrigger>
                <SelectContent className="bg-[#1c1c28] border-white/10">
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Residencial">Residencial</SelectItem>
                  <SelectItem value="Bancario">Bancario</SelectItem>
                  <SelectItem value="Construcción">Construcción</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <div className="flex items-center gap-2 mb-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                <Calendar className="h-3 w-3" />
                Requerimientos Semanales
              </div>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {daysList.map((day) => (
                  <div key={day} className="flex items-center gap-4 bg-[#252535]/50 p-3 rounded-xl border border-white/5">
                    <div className="w-10">
                      <Label className="text-[10px] font-black uppercase text-primary">{day === 'mie' ? 'MIÉ' : day === 'sab' ? 'SÁB' : day.toUpperCase()}</Label>
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <Label className="text-[8px] font-bold uppercase text-muted-foreground">Guardias</Label>
                      <Input 
                        type="number"
                        value={formData.requirements[day]}
                        onChange={(e) => handleRequirementChange(day, e.target.value)}
                        className="bg-[#1a1a2e] border-none h-8 text-center font-bold text-xs"
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <Label className="text-[8px] font-bold uppercase text-muted-foreground">Horas</Label>
                      <Select value={formData.shiftHours[day]} onValueChange={(v) => handleShiftHoursChange(day, v)}>
                        <SelectTrigger className="bg-[#1a1a2e] border-none h-8 text-xs font-bold p-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1c1c28] border-white/10">
                          {hourOptions.map((h) => (
                            <SelectItem key={h} value={h} className="text-[10px] font-bold">{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-black uppercase tracking-widest rounded-lg shadow-lg mt-6"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> GUARDAR PROYECTO</>}
            </Button>
          </form>
        </div>
      </div>

      {/* Columna Derecha: Tabla */}
      <div className="lg:col-span-8 bg-[#1c1c28] border border-white/5 rounded-xl p-6 shadow-xl h-fit">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-5 w-5 text-white/70" />
          <h2 className="text-white text-lg font-bold">Listado de Proyectos Activos</h2>
        </div>

        <div className="overflow-hidden rounded-lg">
          <Table>
            <TableHeader className="bg-[#252535]/50 border-b border-white/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-muted-foreground text-[11px] font-bold h-12">Código</TableHead>
                <TableHead className="text-muted-foreground text-[11px] font-bold h-12">Cliente / Proyecto</TableHead>
                <TableHead className="text-muted-foreground text-[11px] font-bold h-12 text-center">Plan Hoy</TableHead>
                <TableHead className="text-muted-foreground text-[11px] font-bold h-12 text-center">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground text-[11px] font-bold h-12 pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <TableRow key={project.id} className={cn("border-b border-white/5 hover:bg-white/[0.02] transition-colors", project.isActive === false && "opacity-40")}>
                    <TableCell className="font-mono text-[#6366f1] font-bold text-xs">{project.code}</TableCell>
                    <TableCell>
                      <div className="font-bold text-sm text-white">{project.name}</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-medium">{project.location || 'UBICACIÓN PENDIENTE'}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="outline" className="bg-[#6366f1]/10 text-[#6366f1] border-none px-2 py-0 text-[9px] font-black">
                          {getTodayRequirement(project)} ELMS
                        </Badge>
                        <Badge variant="outline" className="bg-white/5 text-muted-foreground border-none px-2 py-0 text-[8px] font-bold">
                          {getTodayHours(project)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2", 
                          project.isActive !== false ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}
                      >
                        {project.isActive !== false ? "ACTIVO" : "INACTIVO"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleToggleStatus(project.id, project.isActive)}
                          className={cn("h-8 w-8", project.isActive !== false ? "text-emerald-500 hover:text-red-500" : "text-red-500 hover:text-emerald-500")}
                          title={project.isActive !== false ? "Desactivar Puesto" : "Activar Puesto"}
                        >
                          {project.isActive !== false ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEditingProject(project)}
                          className="text-muted-foreground hover:text-primary h-8 w-8"
                          title="Editar Proyecto"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(project.id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          title="Eliminar Proyecto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic text-sm">
                    No hay proyectos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialogo de Edición */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="bg-[#1c1c28] border border-white/10 text-white max-w-2xl rounded-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Editar Proyecto: {editingProject?.code}
            </DialogTitle>
          </DialogHeader>
          
          {editingProject && (
            <div className="grid grid-cols-1 gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-white/70">Código Alfanumérico (ID)</Label>
                  <Input 
                    value={editingProject.code}
                    onChange={(e) => setEditingProject({...editingProject, code: e.target.value.toUpperCase()})}
                    placeholder="EJ. ABC-01"
                    className="bg-[#252535] border-none h-11 text-sm font-mono font-bold text-[#6366f1] focus-visible:ring-1 focus-visible:ring-[#6366f1]/50 uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-white/70">Nombre del Cliente</Label>
                  <Input 
                    value={editingProject.name}
                    onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                    className="bg-[#252535] border-none h-11 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-white/70">Ubicación</Label>
                  <Input 
                    value={editingProject.location}
                    onChange={(e) => setEditingProject({...editingProject, location: e.target.value})}
                    className="bg-[#252535] border-none h-11 text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Planilla Semanal
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const).map((day) => (
                    <div key={day} className="flex items-center gap-3 bg-[#252535] p-3 rounded-xl border border-white/5">
                      <div className="w-12">
                        <Label className="text-[10px] font-black uppercase text-primary">{day === 'mie' ? 'MIÉ' : day === 'sab' ? 'SÁB' : day.toUpperCase()}</Label>
                      </div>
                      <div className="flex-1">
                        <Label className="text-[8px] font-bold text-muted-foreground uppercase">Elms</Label>
                        <Input 
                          type="number"
                          value={editingProject.requirements[day]}
                          onChange={(e) => handleEditRequirementChange(day, e.target.value)}
                          className="bg-[#1a1a2e] border-none h-8 text-center text-xs font-bold text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-[8px] font-bold text-muted-foreground uppercase">Hrs</Label>
                        <Select 
                          value={editingProject.shiftHours?.[day] || '12h'} 
                          onValueChange={(v) => handleEditShiftHoursChange(day, v)}
                        >
                          <SelectTrigger className="bg-[#1a1a2e] border-none h-8 text-xs font-bold p-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1c1c28] border-white/10 text-white">
                            {hourOptions.map((h) => (
                              <SelectItem key={h} value={h} className="text-[10px] font-bold">{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 mt-4">
            <Button variant="ghost" onClick={() => setEditingProject(null)} className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateProject} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 rounded-xl"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sincronizar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
