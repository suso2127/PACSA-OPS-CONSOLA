
"use client"

import React from 'react';
import { GuardRegistrationForm } from './GuardRegistrationForm';
import { ShiftTable } from './ShiftTable';
import { Users, ShieldCheck, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function AdminView() {
  const stats = [
    { label: 'Guardias Activos', value: '42', icon: Users, color: 'text-primary' },
    { label: 'Proyectos', value: '12', icon: ShieldCheck, color: 'text-accent' },
    { label: 'Informes Pendientes', value: '5', icon: FileText, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <GuardRegistrationForm />
        </div>
        <div className="lg:col-span-2">
          <ShiftTable />
        </div>
      </div>
    </div>
  );
}
