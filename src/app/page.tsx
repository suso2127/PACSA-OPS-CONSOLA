
"use client"

import React, { useState } from 'react';
import { PinScreen } from '@/components/auth/PinScreen';
import { AdminView } from '@/components/dashboard/AdminView';
import { SupervisorView } from '@/components/dashboard/SupervisorView';
import { GuardView } from '@/components/dashboard/GuardView';
import { LogOut, LayoutDashboard, Shield, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

type Role = 'Admin' | 'Supervisor' | 'Guard';

export default function Home() {
  const [role, setRole] = useState<Role | null>(null);

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
      {/* Navigation Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">PACSA OPS</h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{role} CONSOLE</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
          <div className="flex items-center gap-3 px-3 py-1.5 bg-secondary/50 rounded-full border border-border">
            <User className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium pr-1">{role}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold tracking-tight">
            {role === 'Admin' && 'Operations Dashboard'}
            {role === 'Supervisor' && 'Site Supervision'}
            {role === 'Guard' && 'Post Control'}
          </h2>
        </div>

        {role === 'Admin' && <AdminView />}
        {role === 'Supervisor' && <SupervisorView />}
        {role === 'Guard' && <GuardView />}
      </main>

      {/* Footer Status */}
      <footer className="border-t bg-card/50 px-6 py-3 flex items-center justify-between text-[10px] uppercase tracking-tighter text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Systems Operational
          </span>
          <span>Srv: Studio-8627810775</span>
        </div>
        <div>
          &copy; {new Date().getFullYear()} PACSA Security Operations
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
