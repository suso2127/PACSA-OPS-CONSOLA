
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
import { EmergencyNumbersView } from './EmergencyNumbersView';
import { EquipmentRegistrationForm } from './EquipmentRegistrationForm';
import { EquipmentTable } from './EquipmentTable';
import { NovedadesView } from './NovedadesView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  FileSpreadsheet,
  Package,
  Lock,
  ShieldCheck,
  AlertCircle,
  PhoneCall,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type AdminTab = 'dashboard' | 'registro' | 'estado' | 'novedades' | 'dobles' | 'estadistica' | 'mapa' | 'historial' | 'planilla';
type RegistroSubTab = 'guardia' | 'proyecto' | 'dotacion' | 'emergencia' | 'config';

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activeRegistroSubTab, setActiveRegistroSubTab] = useState<RegistroSubTab>('guardia');
  const [configPass, setConfigPass] = useState('');
  const [isConfigUnlocked, setIsConfigUnlocked] = useState(false);
  const { toast } = useToast();

  const handleUnlockConfig = () => {
    if (configPass === 'grupopacsa') {
      setIsConfigUnlocked(true);
      toast({
        title: "ACCESO AUTORIZADO",
        description: "Terminal de configuración desbloqueada con éxito."
      });
    } else {
      toast({
        variant: "destructive",
        title: "CLAVE INCORRECTA",
        description: "No tiene privilegios para acceder a esta terminal."
      });
      setConfigPass('');
    }
  };

  const COMMAND_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'registro', label: 'Registro', icon: UserPlus },
    { id: 'estado', label: 'Operaciones', icon: ListTodo },
    { id: 'novedades', label: 'Novedades', icon: FileText },
    { id: 'dobles', label: 'Dobles', icon: Copy },
    { id: 'estadistica', label: 'Estadística', icon: BarChart3 },
    { id: 'mapa', label: 'Mapa', icon: MapIcon },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'planilla', label: 'Planilla', icon: FileSpreadsheet },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Barra de Comandos Táctica - Fuente 12px */}
      <div className="bg-card/40 backdrop-blur-md border border-border p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full shadow-2xl">
        {COMMAND_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as AdminTab);
              if (item.id !== 'registro') setIsConfigUnlocked(false);
            }}
            style={{ fontFamily: 'Arial, sans-serif' }}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all duration-300 whitespace-nowrap font-black text-[12px] flex-1 min-w-fit",
              activeTab === item.id 
                ? "bg-primary text-primary-foreground shadow-[0_0_25px_rgba(59,130,246,0.4)] scale-[1.02]" 
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
          <div className="space-y-6">
            <div className="bg-card/40 border border-white/5 p-1 rounded-xl flex items-center gap-1 w-fit overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  setActiveRegistroSubTab('guardia');
                  setIsConfigUnlocked(false);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                  activeRegistroSubTab === 'guardia' 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Registro Guardia
              </button>
              <button
                onClick={() => {
                  setActiveRegistroSubTab('proyecto');
                  setIsConfigUnlocked(false);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                  activeRegistroSubTab === 'proyecto' 
                    ? "bg-[#6366f1] text-white shadow-lg" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                Comando Proyecto
              </button>
              <button
                onClick={() => {
                  setActiveRegistroSubTab('dotacion');
                  setIsConfigUnlocked(false);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                  activeRegistroSubTab === 'dotacion' 
                    ? "bg-[#10b981] text-white shadow-lg" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <Package className="h-3.5 w-3.5" />
                Comando Dotación
              </button>
              <button
                onClick={() => {
                  setActiveRegistroSubTab('emergencia');
                  setIsConfigUnlocked(false);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                  activeRegistroSubTab === 'emergencia' 
                    ? "bg-red-600 text-white shadow-lg" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Emergencia Base
              </button>
              <button
                onClick={() => setActiveRegistroSubTab('config')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                  activeRegistroSubTab === 'config' 
                    ? "bg-slate-700 text-white shadow-lg" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <Settings className="h-3.5 w-3.5" />
                Configuración
              </button>
            </div>

            {activeRegistroSubTab === 'guardia' && (
              <div className="max-w-4xl mx-auto">
                <GuardRegistrationForm />
              </div>
            )}

            {activeRegistroSubTab === 'proyecto' && (
              <ProjectManagement />
            )}

            {activeRegistroSubTab === 'dotacion' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5">
                  <EquipmentRegistrationForm />
                </div>
                <div className="lg:col-span-7">
                  <EquipmentTable />
                </div>
              </div>
            )}

            {activeRegistroSubTab === 'emergencia' && (
              <EmergencyNumbersView />
            )}

            {activeRegistroSubTab === 'config' && (
              isConfigUnlocked ? (
                <ConfigView />
              ) : (
                <div className="max-w-md mx-auto bg-[#1a1b2e] border border-red-500/20 rounded-3xl p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                  <div className="text-center space-y-2">
                    <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                      <Lock className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Terminal Bloqueada</h3>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Requiere Autorización ADMIN-02</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Clave de Acceso</label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={configPass}
                        onChange={(e) => setConfigPass(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlockConfig()}
                        className="h-14 bg-black/40 border-white/5 rounded-xl text-center tracking-[0.5em] text-white text-lg focus:ring-1 focus:ring-red-500/50"
                      />
                    </div>
                    <Button 
                      onClick={handleUnlockConfig}
                      className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.3em] rounded-xl shadow-lg transition-all"
                    >
                      <ShieldCheck className="h-5 w-5 mr-2" />
                      AUTORIZAR ACCESO
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-[9px] font-bold text-red-500/70 uppercase leading-tight">Esta área contiene parámetros críticos del sistema PACSA.</p>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'estado' && (
          <div className="w-full">
            <ShiftTable showObservations={true} />
          </div>
        )}

        {activeTab === 'novedades' && (
          <NovedadesView />
        )}

        {activeTab === 'dobles' && (
          <DoubleShiftControl />
        )}

        {activeTab === 'planilla' && <PayrollView />}

        {activeTab === 'historial' && (
          <HistoryView />
        )}

        {activeTab === 'estadistica' && <StatisticsView />}

        {activeTab === 'mapa' && <MapView />}
      </div>
    </div>
  );
}
