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

  const stats = [
    { label: 'Proyectos', value: '12', icon: ShieldCheck, color: 'text-accent' },
    { label: 'Informes Pendientes', value: '5', icon: FileText, color: 'text-yellow-500' },
  ];

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Estadísticas Rápidas */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-card border-border overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-secondary rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Barra de Comandos - Mejorada para ser más larga y sin scroll visible */}
      <div className="bg-card/40 backdrop-blur-md border border-white/5 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar w-full mb-8 shadow-2xl">
        {COMMAND_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-black text-[10px] flex-1 min-w-fit",
              activeTab === item.id 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
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

        {activeTab === 'config' && (
          <div className="dashboard-card flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 bg-secondary rounded-full mb-4">
              <Settings className="h-12 w-12 text-muted-foreground animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-widest">Módulo en Desarrollo</h3>
            <p className="text-muted-foreground mt-2">La sección de CONFIGuración estará disponible próximamente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
