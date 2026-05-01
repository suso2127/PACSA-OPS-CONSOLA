
"use client"

import React, { useState } from 'react';
import { GuardRegistrationForm } from './GuardRegistrationForm';
import { ShiftTable } from './ShiftTable';
import { OperationalDashboard } from './OperationalDashboard';
import { ProjectManagement } from './ProjectManagement';
import { HistoryView } from './HistoryView';
import { StatisticsView } from './StatisticsView';
import { MapView } from './MapView';
import { DoubleShiftControl } from './DoubleShiftControl';
import { PayrollView } from './PayrollView';
import { ConfigView } from './ConfigView';
import { 
  UserPlus,
  History,
  Map as MapIcon,
  Settings,
  ListTodo,
  Copy,
  LayoutGrid,
  Building2,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminTab = 'registro' | 'estado' | 'dobles' | 'dashboard' | 'mapa' | 'historial' | 'planilla' | 'proyectos' | 'config' | 'estadistica';

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activeRegistroSubTab, setActiveRegistroSubTab] = useState<'guardia' | 'proyecto'>('guardia');

  const COMMAND_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'registro', label: 'Registro', icon: UserPlus },
    { id: 'estado', label: 'Operaciones', icon: ListTodo },
    { id: 'dobles', label: 'Dobles', icon: Copy },
    { id: 'estadistica', label: 'Estadística', icon: BarChart3 },
    { id: 'mapa', label: 'Mapa', icon: MapIcon },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'planilla', label: 'Planilla', icon: FileSpreadsheet },
    { id: 'proyectos', label: 'Proyecto', icon: Building2 },
    { id: 'config', label: 'Configuración', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Barra de Comandos Táctica Restaurada al formato ancho */}
      <div className="bg-card/40 backdrop-blur-md border border-border p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full shadow-2xl">
        {COMMAND_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{ fontFamily: 'Arial, sans-serif' }}
            className={cn(
              "flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl transition-all duration-300 whitespace-nowrap font-black text-[11px] flex-1 min-w-fit",
              activeTab === item.id 
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-[1.01]" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <item.icon className={cn("h-4 w-4", activeTab === item.id ? "text-primary-foreground" : "text-primary")} />
            <span className="uppercase tracking-[0.15em]">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido Dinámico */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'dashboard' && <OperationalDashboard />}
        
        {activeTab === 'registro' && (
          <div className="space-y-6">
            {/* Sub-Navegación Táctica dentro de Registro */}
            <div className="bg-card/40 border border-white/5 p-1 rounded-xl flex items-center gap-1 w-fit">
              <button
                onClick={() => setActiveRegistroSubTab('guardia')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  activeRegistroSubTab === 'guardia' 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Registro Guardia
              </button>
              <button
                onClick={() => setActiveRegistroSubTab('proyecto')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  activeRegistroSubTab === 'proyecto' 
                    ? "bg-[#6366f1] text-white shadow-lg" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                Comando Proyecto
              </button>
            </div>

            {activeRegistroSubTab === 'guardia' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5">
                  <GuardRegistrationForm />
                </div>
                <div className="lg:col-span-7">
                  <ShiftTable hideExitTime={true} />
                </div>
              </div>
            ) : (
              <ProjectManagement />
            )}
          </div>
        )}

        {activeTab === 'estado' && (
          <div className="w-full">
            <ShiftTable showObservations={true} />
          </div>
        )}

        {activeTab === 'dobles' && (
          <DoubleShiftControl />
        )}

        {activeTab === 'planilla' && (
          <PayrollView />
        )}

        {activeTab === 'proyectos' && (
          <ProjectManagement />
        )}

        {activeTab === 'historial' && (
          <HistoryView />
        )}

        {activeTab === 'estadistica' && <StatisticsView />}

        {activeTab === 'mapa' && <MapView />}

        {activeTab === 'config' && <ConfigView />}
      </div>
    </div>
  );
}
