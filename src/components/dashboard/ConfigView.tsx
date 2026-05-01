
"use client"

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Bell, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Save,
  Lock,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function ConfigView() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Configuración Guardada",
        description: "Los parámetros del sistema han sido actualizados exitosamente."
      });
    }, 1000);
  };

  const handleClearData = () => {
    toast({
      variant: "destructive",
      title: "Acción Restringida",
      description: "Por seguridad, el vaciado de base de datos requiere una clave de nivel superior."
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seguridad de Acceso (PIN) */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              Seguridad de Acceso (PIN)
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
              Claves operativas de la estructura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Clave de Operador (Acceso Total)</Label>
              <Input type="password" placeholder="••••" className="bg-[#25273c] border-white/5 h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Clave de Supervisor (Solo Estado)</Label>
              <Input type="password" placeholder="••••" className="bg-[#25273c] border-white/5 h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Clave de Guardia (Operativo)</Label>
              <Input type="password" placeholder="••••" className="bg-[#25273c] border-white/5 h-12" />
            </div>
          </CardContent>
        </Card>

        {/* Límites Operativos */}
        <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sky-500">
              <Bell className="h-5 w-5" />
              Límites Operativos
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
              Parámetros globales de turnos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Límite turno normal (Horas)</Label>
              <Input type="number" defaultValue="12" className="bg-[#25273c] border-white/5 h-12 text-white font-black" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[#25273c] rounded-xl border border-white/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Alertas Sonoras (24h)</Label>
                <p className="text-[10px] text-muted-foreground">Activar notificaciones para personal en doble</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Respaldo Estructural */}
      <Card className="bg-[#1a1b2e] border-white/5 shadow-2xl border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Database className="h-5 w-5" />
            Respaldo Estructural de la Plataforma
          </CardTitle>
          <CardDescription className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
            Exportación completa de proyectos, códigos y planillas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-16 bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground font-black uppercase text-xs tracking-widest">
              <Download className="mr-3 h-5 w-5" />
              Exportar Estructura Full (.JSON)
            </Button>
            <Button variant="outline" className="h-16 bg-secondary/50 border-white/5 text-muted-foreground hover:bg-white/5 font-black uppercase text-xs tracking-widest">
              <Upload className="mr-3 h-5 w-5" />
              Restaurar Estructura
            </Button>
          </div>
          <p className="text-[9px] text-center font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
            <Lock className="h-3 w-3" />
            El respaldo incluye: Proyectos Registrados, Historial de Turnos y Códigos de Seguridad
          </p>
        </CardContent>
      </Card>

      {/* Mantenimiento de Base de Datos */}
      <Card className="bg-destructive/5 border-destructive/20 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <History className="h-32 w-32 text-destructive" />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Mantenimiento de Base de Datos
          </CardTitle>
          <CardDescription className="text-destructive/60 text-[10px] uppercase tracking-wider font-bold">
            Acciones permanentes sobre el historial
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-destructive uppercase">Vaciar Historial de Turnos</h4>
            <p className="text-xs text-muted-foreground">Borra todos los registros históricos, preservando proyectos y códigos.</p>
          </div>
          <Button 
            onClick={handleClearData}
            className="bg-destructive hover:bg-destructive/90 text-white font-black uppercase text-xs tracking-widest h-12 px-8"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Datos
          </Button>
        </CardContent>
      </Card>

      {/* Botón Guardar Global */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave}
          disabled={loading}
          className="h-14 px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-primary/20"
        >
          {loading ? "Procesando..." : <><Save className="mr-2 h-5 w-5" /> Guardar Configuración</>}
        </Button>
      </div>
    </div>
  );
}
