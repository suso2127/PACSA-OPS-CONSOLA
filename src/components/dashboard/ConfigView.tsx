
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
  History,
  AlertTriangle
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seguridad de Acceso (PIN) */}
        <Card className="bg-[#1a1b2e] border-none shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white/90 text-base font-bold">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              Seguridad de Acceso (PIN)
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[11px] font-medium">
              Claves operativas de la estructura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/70">Clave de Operador (Acceso Total)</Label>
              <Input type="password" defaultValue="••••" className="bg-[#25273c] border-none h-11 focus-visible:ring-1 focus-visible:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/70">Clave de Supervisor (Solo Estado)</Label>
              <Input type="password" defaultValue="••••" className="bg-[#25273c] border-none h-11 focus-visible:ring-1 focus-visible:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/70">Clave de Guardia (Operativo)</Label>
              <Input type="password" defaultValue="••••" className="bg-[#25273c] border-none h-11 focus-visible:ring-1 focus-visible:ring-indigo-500" />
            </div>
          </CardContent>
        </Card>

        {/* Límites Operativos */}
        <Card className="bg-[#1a1b2e] border-none shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white/90 text-base font-bold">
              <Bell className="h-5 w-5 text-sky-500" />
              Límites Operativos
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[11px] font-medium">
              Parámetros globales de turnos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-white/70">Límite turno normal (Horas)</Label>
              <Input type="number" defaultValue="12" className="bg-[#25273c] border-none h-11 text-white font-bold max-w-[100px]" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-white/90">Alertas Sonoras (24h)</Label>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Respaldo Estructural */}
      <Card className="bg-[#1a1b2e] border-none shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-indigo-500 text-base font-bold">
            <Database className="h-5 w-5" />
            Respaldo Estructural de la Plataforma
          </CardTitle>
          <CardDescription className="text-muted-foreground text-[11px] font-medium">
            Exportación completa de proyectos, códigos y planillas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-14 bg-[#25273c] border-none text-indigo-400 hover:bg-indigo-600 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all">
              <Download className="mr-3 h-4 w-4" />
              Exportar Estructura Full (.JSON)
            </Button>
            <Button variant="outline" className="h-14 bg-[#25273c] border-none text-white/80 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest transition-all">
              <Upload className="mr-3 h-4 w-4" />
              Restaurar Estructura
            </Button>
          </div>
          <p className="text-[9px] text-center font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <Lock className="h-3 w-3" />
            EL RESPALDO INCLUYE: 0 PROYECTOS Y 0 REGISTROS
          </p>
        </CardContent>
      </Card>

      {/* Mantenimiento de Base de Datos */}
      <Card className="bg-[#2c1a1a] border-none shadow-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-500 text-base font-bold">
            <AlertTriangle className="h-5 w-5" />
            Mantenimiento de Base de Datos
          </CardTitle>
          <CardDescription className="text-red-400/60 text-[11px] font-medium">
            Acciones permanentes sobre el historial
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-6">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-red-500 uppercase tracking-tight">VACIAR HISTORIAL DE TURNOS</h4>
            <p className="text-[11px] text-muted-foreground font-medium">Borra todos los registros históricos, preservando proyectos y códigos.</p>
          </div>
          <Button 
            onClick={handleClearData}
            className="bg-[#ff4d4d] hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-lg"
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
          className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-lg shadow-2xl shadow-indigo-600/20"
        >
          {loading ? "Procesando..." : <><Save className="mr-2 h-5 w-5" /> GUARDAR CONFIGURACIÓN</>}
        </Button>
      </div>
    </div>
  );
}
