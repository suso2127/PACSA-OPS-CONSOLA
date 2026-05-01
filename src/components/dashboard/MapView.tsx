
"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Map as MapIcon, 
  MapPin, 
  Building2, 
  Search,
  Crosshair,
  Maximize2,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  UserMinus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  code: string;
  name: string;
  location: string;
  type: string;
  requirements?: {
    lun: number;
    mar: number;
    mie: number;
    jue: number;
    vie: number;
    sab: number;
    dom: number;
  };
}

interface Registration {
  projectCode: string;
  status: string;
}

export function MapView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    // Escuchar proyectos
    const qProjects = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(fetched);
      setLoading(false);
    });

    // Escuchar registros activos/dobles
    const qRegs = query(
      collection(db, 'shift-registrations'), 
      where('status', 'in', ['Activo', 'Doble'])
    );
    const unsubRegs = onSnapshot(qRegs, (snapshot) => {
      const fetched = snapshot.docs.map(doc => doc.data() as Registration);
      setRegistrations(fetched);
    });

    return () => {
      unsubProjects();
      unsubRegs();
    };
  }, []);

  const projectStatus = useMemo(() => {
    const days = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const today = days[new Date().getDay()] as keyof NonNullable<Project['requirements']>;
    
    return projects.reduce((acc, project) => {
      const required = project.requirements?.[today] || 0;
      const onSite = registrations.filter(r => r.projectCode === project.code).length;
      
      let status: 'red' | 'yellow' | 'green' = 'red';
      if (onSite >= required && required > 0) status = 'green';
      else if (onSite > 0 && onSite < required) status = 'yellow';
      else if (required === 0) status = 'green'; // Si no requiere, se considera cubierto

      acc[project.id] = { status, onSite, required };
      return acc;
    }, {} as Record<string, { status: 'red' | 'yellow' | 'green', onSite: number, required: number }>);
  }, [projects, registrations]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMarkerColor = (projectId: string) => {
    const s = projectStatus[projectId]?.status;
    if (s === 'green') return 'bg-green-500 border-green-200';
    if (s === 'yellow') return 'bg-yellow-500 border-yellow-200';
    return 'bg-red-500 border-red-200';
  };

  const getStatusText = (projectId: string) => {
    const s = projectStatus[projectId]?.status;
    if (s === 'green') return 'CUBIERTO';
    if (s === 'yellow') return 'POR CUBRIR';
    return 'SIN CUBRIR';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Mapa Operativo</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Geolocalización y análisis de puestos en tiempo real</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-[#1a1b2e] px-4 py-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Sin Cubrir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Por Cubrir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Cubierto</span>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
            Sincronización Satelital Activa
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
        <div className="lg:col-span-3 bg-[#1a1b2e] border border-white/5 rounded-3xl p-6 flex flex-col space-y-6 overflow-hidden">
          <div className="space-y-4">
            <div className="relative">
              <Input 
                placeholder="Buscar puesto..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0f101d] border-none h-11 pl-11 rounded-xl text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Puestos Detectados</span>
              <span className="text-[10px] font-black text-primary">{filteredProjects.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                <Activity className="h-6 w-6 animate-pulse text-primary" />
                <p className="text-xs font-bold uppercase tracking-tighter">Buscando señales...</p>
              </div>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${
                    selectedProject?.id === project.id 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-[#25273c] border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      projectStatus[project.id]?.status === 'green' ? 'bg-green-500/20 text-green-500' :
                      projectStatus[project.id]?.status === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{project.code}</p>
                        <span className={`text-[7px] font-black px-1.5 rounded-full ${
                          projectStatus[project.id]?.status === 'green' ? 'bg-green-500 text-white' :
                          projectStatus[project.id]?.status === 'yellow' ? 'bg-yellow-500 text-black' :
                          'bg-red-500 text-white'
                        }`}>
                          {projectStatus[project.id]?.onSite}/{projectStatus[project.id]?.required}
                        </span>
                      </div>
                      <p className="text-xs font-bold truncate text-white">{project.name}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10 opacity-30">
                <p className="text-xs italic">No se encontraron coordenadas</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-9 bg-[#1a1b2e] border border-white/5 rounded-3xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-[#0f101d] opacity-50 overflow-hidden pointer-events-none">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>

          <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
            <Button size="icon" variant="secondary" className="bg-[#25273c] border-white/5 hover:bg-primary hover:text-primary-foreground h-10 w-10">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="bg-[#25273c] border-white/5 hover:bg-primary hover:text-primary-foreground h-10 w-10">
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {filteredProjects.map((project) => {
              const hash = project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const x = (hash % 70) + 15;
              const y = ((hash * 13) % 70) + 15;
              const colorClass = getMarkerColor(project.id);

              return (
                <div 
                  key={project.id}
                  className="absolute pointer-events-auto transition-all duration-500"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="relative flex flex-col items-center">
                    <button 
                      onClick={() => setSelectedProject(project)}
                      className={`group/marker relative z-10 p-2 rounded-full border-2 transition-all duration-300 ${colorClass} ${
                        selectedProject?.id === project.id ? 'scale-125 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : ''
                      }`}
                    >
                      <Shield className={`h-4 w-4 ${selectedProject?.id === project.id ? 'text-white' : 'text-white/90'}`} />
                      <span className={`absolute inset-0 rounded-full animate-ping -z-10 opacity-40 ${
                        projectStatus[project.id]?.status === 'red' ? 'bg-red-500' : 
                        projectStatus[project.id]?.status === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                    </button>
                    <div className={`mt-2 px-2 py-1 rounded bg-[#0f101d]/90 border border-white/10 backdrop-blur-md transition-opacity duration-300 ${
                      selectedProject?.id === project.id ? 'opacity-100' : 'opacity-0 group-hover/marker:opacity-100'
                    }`}>
                      <p className="text-[8px] font-black text-white whitespace-nowrap">{project.code}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedProject && (
            <div className="absolute bottom-6 left-6 right-6 bg-[#0f101d]/95 border border-primary/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-xl border ${
                    projectStatus[selectedProject.id]?.status === 'green' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                    projectStatus[selectedProject.id]?.status === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                    'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[8px] font-black uppercase px-2 py-0 border-none ${
                        projectStatus[selectedProject.id]?.status === 'green' ? 'bg-green-500 text-white' :
                        projectStatus[selectedProject.id]?.status === 'yellow' ? 'bg-yellow-500 text-black' :
                        'bg-red-500 text-white'
                      }`}>
                        {getStatusText(selectedProject.id)}
                      </Badge>
                      <span className="text-primary font-black text-xs tracking-tighter uppercase">{selectedProject.code}</span>
                    </div>
                    <h3 className="text-xl font-black text-white">{selectedProject.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                      <MapPin className="h-3 w-3 text-red-500" />
                      {selectedProject.location || 'UBICACIÓN POR DEFINIR'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-center px-4 border-r border-white/10">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Estado Fuerza</p>
                    <p className={`text-lg font-black ${
                      projectStatus[selectedProject.id]?.status === 'green' ? 'text-green-500' :
                      projectStatus[selectedProject.id]?.status === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {projectStatus[selectedProject.id]?.onSite}/{projectStatus[selectedProject.id]?.required}
                    </p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tipo Servicio</p>
                    <p className="text-lg font-black text-primary">{selectedProject.type.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
