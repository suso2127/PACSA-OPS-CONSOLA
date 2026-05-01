
"use client"

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Map as MapIcon, 
  MapPin, 
  Building2, 
  Search,
  Crosshair,
  Maximize2,
  Shield,
  Activity
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
}

export function MapView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Cabecera del Mapa */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Mapa Operativo</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Geolocalización y análisis de puestos en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
            Sincronización Satelital Activa
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
        {/* Panel de Control Lateral */}
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
                    <div className={`p-2 rounded-lg ${selectedProject?.id === project.id ? 'bg-primary text-primary-foreground' : 'bg-[#1a1b2e] text-primary'}`}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{project.code}</p>
                      <p className="text-xs font-bold truncate text-white">{project.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate mt-1 flex items-center gap-1">
                        <MapPin className="h-2 w-2" />
                        {project.location || 'UBICACIÓN NO DEFINIDA'}
                      </p>
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

        {/* Visualizador de Mapa Táctico */}
        <div className="lg:col-span-9 bg-[#1a1b2e] border border-white/5 rounded-3xl overflow-hidden relative group">
          {/* Fondo de Mapa Estilizado */}
          <div className="absolute inset-0 bg-[#0f101d] opacity-50 overflow-hidden pointer-events-none">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }} />
             <div className="absolute top-0 left-0 w-full h-full border-[100px] border-[#3b82f6]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Interfaz de Radar */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-[500px] h-[500px] rounded-full border border-primary/10 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-primary/5" />
          </div>

          {/* Controles de Mapa */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
            <Button size="icon" variant="secondary" className="bg-[#25273c] border-white/5 hover:bg-primary hover:text-primary-foreground h-10 w-10">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="bg-[#25273c] border-white/5 hover:bg-primary hover:text-primary-foreground h-10 w-10">
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>

          {/* Marcadores de Proyectos (Simulados en una distribución visual) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {filteredProjects.map((project, index) => {
              // Generar posición pseudo-aleatoria basada en el ID para que sea consistente
              const hash = project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const x = (hash % 70) + 15;
              const y = ((hash * 13) % 70) + 15;

              return (
                <div 
                  key={project.id}
                  className="absolute pointer-events-auto transition-all duration-500"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="relative flex flex-col items-center">
                    <button 
                      onClick={() => setSelectedProject(project)}
                      className={`group/marker relative z-10 p-2 rounded-full border-2 transition-all duration-300 ${
                        selectedProject?.id === project.id 
                          ? 'bg-primary border-white scale-125 shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
                          : 'bg-[#25273c] border-primary/40 hover:border-primary'
                      }`}
                    >
                      <Shield className={`h-4 w-4 ${selectedProject?.id === project.id ? 'text-white' : 'text-primary'}`} />
                      
                      {/* Onda de actividad */}
                      <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping -z-10" />
                    </button>
                    
                    {/* Etiqueta del marcador */}
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

          {/* Panel de Información Seleccionado */}
          {selectedProject && (
            <div className="absolute bottom-6 left-6 right-6 bg-[#0f101d]/95 border border-primary/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 p-4 rounded-xl border border-primary/20">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary text-primary-foreground text-[8px] font-black uppercase px-2 py-0">ACTIVO</Badge>
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
                    <p className="text-lg font-black text-green-500">100%</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tipo Servicio</p>
                    <p className="text-lg font-black text-primary">{selectedProject.type.toUpperCase()}</p>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] h-10 px-6 rounded-lg ml-2"
                  >
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Overlay de Carga */}
          {!selectedProject && projects.length > 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="bg-[#0f101d]/80 backdrop-blur-sm border border-white/5 p-8 rounded-3xl">
                <MapIcon className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">Seleccione un objetivo táctico</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
