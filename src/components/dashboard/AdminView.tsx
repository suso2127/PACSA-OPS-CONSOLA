
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
  ShieldCheck, 
  FileText,
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
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AdminTab = 'registro' | 'estado' | 'dobles' | 'dashboard' | 'mapa' | 'historial' | 'proyectos' | 'config' | 'estadistica' | 'planilla';

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const COMMAND_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'registro', label: 'Registro', icon: UserPlus },
    { id: 'estado', label: 'Estado', icon: ListTodo },
    { id: 'dobles', label: 'Dobles', icon: Copy },
    { id: 'estadistica', label: 'Estadística', icon: BarChart3 },
    { id: 'mapa', label: 'Mapa', icon: MapIcon },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'planilla', label: 'Planilla', icon: FileSpreadsheet },
    { id: 'proyectos', label: 'Proyectos', icon: Building2 },
    { id: 'config', label: 'Config', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Barra de Comandos Ancha */}
      <div className="bg-card/40 backdrop-blur-md border border-border p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar w-full shadow-lg">
        {COMMAND_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap font-bold text-[10px] flex-1 min-w-fit",
              activeTab === item.id 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <item.icon className={cn("h-4 w-4", activeTab === item.id ? "text-primary-foreground" : "text-primary")} />
            <span className="uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido Dinámico */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'dashboard' && <OperationalDashboard />}
        
        {activeTab === 'registro' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <GuardRegistrationForm />
            </div>
            <div className="lg:col-span-7">
              <ShiftTable />
            </div>
          </div>
        )}

        {activeTab === 'estado' && (
          <div className="max-w-6xl mx-auto">
            <ShiftTable />
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
