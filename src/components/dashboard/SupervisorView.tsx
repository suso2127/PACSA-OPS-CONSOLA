
"use client"

import React from 'react';
import { ShiftTable } from './ShiftTable';
import { Eye, Map, AlertTriangle } from 'lucide-react';

export function SupervisorView() {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dashboard-card flex items-center justify-between border-l-4 border-l-accent">
          <div>
            <h3 className="font-semibold text-lg">Shift Monitoring</h3>
            <p className="text-sm text-muted-foreground">Active supervision of all post sites</p>
          </div>
          <Eye className="h-10 w-10 text-accent/50" />
        </div>
        <div className="dashboard-card flex items-center justify-between border-l-4 border-l-destructive">
          <div>
            <h3 className="font-semibold text-lg">Alert Status</h3>
            <p className="text-sm text-muted-foreground">No critical alerts in last 12h</p>
          </div>
          <AlertTriangle className="h-10 w-10 text-destructive/50" />
        </div>
      </div>
      <ShiftTable />
    </div>
  );
}
