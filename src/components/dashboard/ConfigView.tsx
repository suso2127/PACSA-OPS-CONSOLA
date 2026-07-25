
"use client"

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Bell, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Save,
  Lock,
  AlertTriangle,
  LifeBuoy,
  ExternalLink
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
        title: "SISTEMA ACTUALIZADO",
        description: "Los parámetros operativos han sido sincronizados globalmente."
      });
    }, 1200);
  };

  const handleClearData = () => {
    toast({
      variant: "destructive",
      title: "ACCESO DENEGADO",
      description: "El vaciado de datos requiere autorización de nivel ADMIN-01."
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seguridad de Acceso (PIN) */}
        <Card className="bg-[#1a1b2e] border-none shadow-2xl rounded-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-lg font-bold">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              Seguridad de Acceso (PIN)
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Claves operativas de la estructura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs text-white/70">Clave de Operador (Acceso Total)</Label>
              <Input type="password" defaultValue="1234" className="bg-[#25273c] border-none h-12 rounded-lg tracking-widest focus-visible:ring-1 focus-visible:ring-indigo-500/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/70">Clave de Supervisor (Solo Estado)</Label>
              <Input type="password" defaultValue="5678" className="bg-[#25273c] border-none h-12 rounded-lg tracking-widest focus-visible:ring-1 focus-visible:ring-indigo-500/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/70">Clave de Guardia (Operativo)</Label>
              <Input type="password" defaultValue="0000" className="bg-[#25273c] border-none h-12 rounded-lg tracking-widest focus-visible:ring-1 focus-visible:ring-indigo-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Límites Operativos */}
        <Card className="bg-[#1a1b2e] border-none shadow-2xl rounded-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-lg font-bold">
              <Bell className="h-5 w-5 text-sky-500" />
              Límites Operativos
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Parámetros globales de turnos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label className="text-xs text-white/70">Límite turno normal (Horas)</Label>
              <Input type="number" defaultValue="12" className="bg-[#25273c] border-none h-12 rounded-lg text-white w-24 text-center" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs text-white/70">Alertas Sonoras (24h)</Label>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Respaldo Estructural */}
      <Card className="bg-[#1a1b2e] border-none shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-indigo-500 text-lg font-bold">
            <Database className="h-5 w-5" />
            Respaldo Estructural de la Plataforma
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Exportación completa de proyectos, códigos y planillas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-14 bg-[#25273c] border-none text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all">
              <Download className="mr-2 h-4 w-4" />
              EXPORTAR ESTRUCTURA FULL (.JSON)
            </Button>
            <Button variant="outline" className="h-14 bg-[#25273c] border-none text-white/80 hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest rounded-xl border border-white/5">
              <Upload className="mr-2 h-4 w-4" />
              RESTAURAR ESTRUCTURA
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest pt-2">
            <Lock className="h-3 w-3" />
            EL RESPALDO INCLUYE: 0 PROYECTOS Y 0 REGISTROS
          </div>
        </CardContent>
      </Card>

      {/* Panel de Soporte Técnico PACSA */}
      <Card className="bg-[#1a1b2e] border-primary/20 shadow-2xl rounded-3xl overflow-hidden border-dashed">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3 text-primary mb-1">
                <LifeBuoy className="h-6 w-6" />
                <h4 className="text-lg font-black uppercase tracking-tighter">Soporte Técnico de Terminal</h4>
              </div>
              <p className="text-sm text-muted-foreground max-w-md font-medium">
                ¿Problemas con la sincronización de la consola? Contacte al centro de sistemas de PACSA Ops para soporte inmediato.
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest rounded-2xl">
                Manual de Usuario
              </Button>
              <Button className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Ticket
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mantenimiento de Base de Datos */}
      <Card className="bg-[#2c1a1a] border-none shadow-2xl rounded-xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <AlertTriangle className="h-5 w-5" />
                <h4 className="text-sm font-bold uppercase">Mantenimiento de Base de Datos</h4>
              </div>
              <p className="text-xs text-white/50 font-medium">Acciones permanentes sobre el historial</p>
              <div className="mt-4">
                <p className="text-xs font-bold text-red-500 uppercase">VACIAR HISTORIAL DE TURNOS</p>
                <p className="text-[10px] text-white/40">Borra todos los registros históricos, preservando proyectos y códigos.</p>
              </div>
            </div>
            <Button 
              onClick={handleClearData}
              className="bg-[#ff4d4d] hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-widest h-12 px-8 rounded-lg shadow-lg"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              LIMPIAR DATOS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Botón Guardar Global */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave}
          disabled={loading}
          className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all"
        >
          {loading ? "SINCRONIZANDO..." : <><Save className="mr-3 h-5 w-5" /> GUARDAR CONFIGURACIÓN</>}
        </Button>
      </div>
    </div>
  );
}
