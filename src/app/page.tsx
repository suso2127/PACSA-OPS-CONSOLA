
"use client"

import React, { useState, useEffect } from 'react';
import { PinScreen } from '@/components/auth/PinScreen';
import { AdminView } from '@/components/dashboard/AdminView';
import { SupervisorView } from '@/components/dashboard/SupervisorView';
import { GuardView } from '@/components/dashboard/GuardView';
import { LogOut, LayoutDashboard, Shield, Bell, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

type Role = 'Admin' | 'Supervisor' | 'Guard';

const ROLE_LABELS: Record<Role, string> = {
  'Admin': 'ADMINISTRADOR',
  'Supervisor': 'SUPERVISOR',
  'Guard': 'GUARDIA'
};

export default function Home() {
  const [role, setRole] = useState<Role | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }));
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => setRole(null);

  if (!role) {
    return (
      <>
        <PinScreen onAuthenticated={setRole} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navegación Principal */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase leading-none">PACSA OPS</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <Activity className="h-2.5 w-2.5 text-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">System Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />
          
          {/* Reloj Robusto de Impacto */}
          <div className="flex items-center gap-4 px-5 py-2 bg-[#1a1b2e] rounded-xl border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] group">
            <div className="hidden lg:flex flex-col items-end border-r border-white/10 pr-4">
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Standard Time</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">UTC-6 MX</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xl font-black font-mono tracking-tighter tabular-nums text-white group-hover:text-primary transition-colors">
                {currentTime || '00:00:00'}
              </span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive font-bold uppercase text-[10px] tracking-widest">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Log Out</span>
          </Button>
        </div>
      </header>

      {/* Área de Contenido Principal */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-black tracking-tighter uppercase">
            {role === 'Admin' && 'Panel de Operaciones'}
            {role === 'Supervisor' && 'Supervisión de Sitio'}
            {role === 'Guard' && 'Control de Puesto'}
          </h2>
        </div>

        {role === 'Admin' && <AdminView />}
        {role === 'Supervisor' && <SupervisorView />}
        {role === 'Guard' && <GuardView />}
      </main>

      {/* Estado del Pie de Página */}
      <footer className="border-t bg-card/50 px-6 py-3 flex items-center justify-between text-[10px] uppercase tracking-tighter text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Sistemas Operativos
          </span>
          <span className="font-mono">Srv: Studio-8627810775</span>
        </div>
        <div className="font-bold">
          &copy; {new Date().getFullYear()} Operaciones de Seguridad PACSA
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
