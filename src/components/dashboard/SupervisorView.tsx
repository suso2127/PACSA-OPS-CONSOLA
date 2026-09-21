
"use client"

import React from 'react';
import { ShiftTable } from './ShiftTable';
import { Eye, AlertTriangle } from 'lucide-react';

export function SupervisorView({ refreshKey = 0 }: { refreshKey?: number }) {
  return (
    <div key={refreshKey} className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dashboard-card flex items-center justify-between border-l-4 border-l-accent">
          <div>
            <h3 className="font-semibold text-lg">Monitoreo de Turnos</h3>
            <p className="text-sm text-muted-foreground">Supervisión activa de todos los puestos</p>
          </div>
          <Eye className="h-10 w-10 text-accent/50" />
        </div>
        <div className="dashboard-card flex items-center justify-between border-l-4 border-l-destructive">
          <div>
            <h3 className="font-semibold text-lg">Estado de Alertas</h3>
            <p className="text-sm text-muted-foreground">Sin alertas críticas en las últimas 12h</p>
          </div>
          <AlertTriangle className="h-10 w-10 text-destructive/50" />
        </div>
      </div>
      <ShiftTable />
    </div>
  );
}
