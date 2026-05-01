
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
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const getTodayRequirement = (project: Project) => {
    const days = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const today = days[new Date().getDay()] as keyof typeof project.requirements;
    return project.requirements[today] || 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
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
  );
}
