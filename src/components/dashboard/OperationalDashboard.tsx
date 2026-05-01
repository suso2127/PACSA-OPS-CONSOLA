
"use client"

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  User, 
  Copy, 
  UserMinus, 
  TrendingUp, 
  Calendar,
  ShieldCheck,
  Building2,
  Activity,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function OperationalDashboard() {
  const [currentDay, setCurrentDay] = useState('');
  const [stats, setStats] = useState({
    required: 0,
    active: 0,
    double: 0,
    missing: 0,
    coverage: 0
  });

  useEffect(() => {
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const d = new Date();
    setCurrentDay(days[d.getDay()]);

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const dayKey = days[d.getDay()].toLowerCase().slice(0, 3) as any;
      const totalReq = snapshot.docs.reduce((acc, doc) => {
        const reqs = doc.data().requirements || {};
        return acc + (reqs[dayKey] || 0);
      }, 0);
      
      const qShifts = query(
        collection(db, 'shift-registrations'),
        where('status', 'in', ['Activo', 'Doble'])
      );

      const unsubShifts = onSnapshot(qShifts, (shiftSnap) => {
        const activeCount = shiftSnap.docs.filter(s => s.data().status === 'Activo').length;
        const doubleCount = shiftSnap.docs.filter(s => s.data().status === 'Doble').length;
        const totalInSite = activeCount + doubleCount;
        const missing = Math.max(0, totalReq - totalInSite);
        const coverage = totalReq > 0 ? Math.round((totalInSite / totalReq) * 100) : 0;

        setStats({
          required: totalReq,
          active: activeCount,
          double: doubleCount,
          missing,
          coverage
        });
      });

      return () => unsubShifts();
    });

    return () => unsubProjects();
  }, []);

  const metrics = [
    { label: 'Personal Requerido', value: stats.required, icon: Users, color: 'text-blue-500', desc: 'Planilla del día' },
    { label: 'Guardias en Puesto', value: stats.active, icon: User, color: 'text-green-500', desc: 'Despliegue estándar' },
    { label: 'Jornada Doble', value: stats.double, icon: Copy, color: 'text-red-500', desc: 'Turnos 24 horas' },
    { label: 'Déficit de Fuerza', value: stats.missing, icon: UserMinus, color: 'text-orange-500', desc: 'Puestos sin cubrir' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera de Estado */}
      <div className="bg-card border border-border p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Consola de Operaciones</h2>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">SISTEMA OPERATIVO</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              REQ: {currentDay}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6 bg-secondary/30 px-6 py-3 rounded-lg border border-border">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cobertura Global</p>
            <p className="text-2xl font-black text-primary">{stats.coverage}%</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg bg-secondary/50 ${metric.color}`}>
                  <metric.icon className="h-5 w-5" />
                </div>
                <Activity className="h-4 w-4 text-muted-foreground/20" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{metric.label}</p>
              <h4 className="text-3xl font-black mt-1">{metric.value}</h4>
              <p className="text-[10px] text-muted-foreground mt-1">{metric.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas Críticas */}
      {stats.missing > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-destructive/10 rounded-full">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-destructive uppercase">Alerta: Déficit de Fuerza Detectado</h3>
            <p className="text-xs text-muted-foreground">Existen {stats.missing} puestos sin cubrir según la planilla requerida para hoy.</p>
          </div>
          <Badge className="bg-destructive text-white uppercase text-[10px]">Acción Requerida</Badge>
        </div>
      )}
    </div>
  );
}
