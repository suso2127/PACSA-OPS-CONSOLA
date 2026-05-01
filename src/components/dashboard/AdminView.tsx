
"use client"

import React, { useState } from 'react';
import { GuardRegistrationForm } from './GuardRegistrationForm';
import { ShiftTable } from './ShiftTable';
import { 
  Users, 
  ShieldCheck, 
  FileText, 
  UserPlus, 
  ListChecks, 
  Copy, 
  LayoutGrid, 
  Map as MapIcon, 
  History, 
  Building2, 
  Settings,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AdminTab = 'Registro' | 'Estado' | 'Dobles' | 'Dashboard' | 'Mapa' | 'Historial' | 'Proyectos' | 'Config';

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>('Registro');

  const stats = [
    { label: 'Guardias Activos', value: '42', icon: Users, color: 'text-primary' },
    { label: 'Proyectos', value: '12', icon: ShieldCheck, color: 'text-accent' },
    { label: 'Informes Pendientes', value: '5', icon: FileText, color: 'text-yellow-500' },
  ];

  const navItems = [
    { id: 'Registro', label: 'Registro', icon: UserPlus },
    { id: 'Estado', label: 'Estado', icon: ListChecks },
    { id: 'Dobles', label: 'Dobles', icon: Copy },
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'Mapa', label: 'Mapa', icon: MapIcon },
    { id: 'Historial', label: 'Historial', icon: History },
    { id: 'Proyectos', label: 'Proyectos', icon: Building2 },
    { id: 'Config', label: 'Config', icon: Settings },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Barra de Comandos (Navegación de Funciones) */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 p-1.5 bg-[#1a1b2e]/80 border border-white/5 rounded-2xl min-w-max">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "h-4.5 w-4.5",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                )} />
                <span className="text-sm font-semibold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido Dinámico basado en la pestaña activa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-300">
        {activeTab === 'Registro' && (
          <>
            <div className="lg:col-span-1">
              <GuardRegistrationForm />
            </div>
            <div className="lg:col-span-2">
              <ShiftTable />
            </div>
          </>
        )}
        
        {activeTab === 'Estado' && (
          <div className="lg:col-span-3">
            <ShiftTable />
          </div>
        )}

        {activeTab !== 'Registro' && activeTab !== 'Estado' && (
          <div className="lg:col-span-3 py-20 flex flex-col items-center justify-center bg-card/30 border border-dashed border-border rounded-3xl opacity-60">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold">Módulo en Desarrollo</h3>
            <p className="text-muted-foreground">La sección de {activeTab} estará disponible próximamente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
