
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
  Calendar,
  Loader2,
  FileText
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
        title: "PROYECTO GUARDADO",
        description: `El proyecto ${formData.code} ha sido registrado exitosamente.`
      });
      
      setFormData({
        code: '',
        name: '',
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
                Guardias Requeridos por Día
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {(['lun', 'mar', 'mie', 'jue'] as const).map((day) => (
                    <div key={day} className="space-y-1 text-center">
                      <Label className="text-[8px] font-black uppercase text-muted-foreground">{day === 'mie' ? 'MIÉ' : day.toUpperCase()}</Label>
                      <Input 
                        type="number"
                        value={formData.requirements[day]}
                        onChange={(e) => handleRequirementChange(day, e.target.value)}
                        className="bg-[#252535] border-none h-8 text-center p-0 font-bold text-xs"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 px-6">
                  {(['vie', 'sab', 'dom'] as const).map((day) => (
                    <div key={day} className="space-y-1 text-center">
                      <Label className="text-[8px] font-black uppercase text-muted-foreground">{day === 'sab' ? 'SÁB' : day.toUpperCase()}</Label>
                      <Input 
                        type="number"
                        value={formData.requirements[day]}
                        onChange={(e) => handleRequirementChange(day, e.target.value)}
                        className="bg-[#252535] border-none h-8 text-center p-0 font-bold text-xs"
                      />
                    </div>
                  ))}
                </div>
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
                <TableHead className="text-muted-foreground text-[11px] font-bold h-12">Tipo</TableHead>
                <TableHead className="text-muted-foreground text-[11px] font-bold h-12 text-center">Req. Hoy</TableHead>
                <TableHead className="text-right text-muted-foreground text-[11px] font-bold h-12 pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <TableRow key={project.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-mono text-[#6366f1] font-bold text-xs">{project.code}</TableCell>
                    <TableCell>
                      <div className="font-bold text-sm text-white">{project.name}</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-medium">{project.location || 'UBICACIÓN PENDIENTE'}</div>
                    </TableCell>
                    <TableCell className="text-xs text-white/70">{project.type}</TableCell>
                    <TableCell className="text-center">
                      <div className="bg-[#6366f1]/10 text-[#6366f1] px-3 py-0.5 rounded-full text-xs font-black inline-block">
                        {getTodayRequirement(project)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
    </div>
  );
}
