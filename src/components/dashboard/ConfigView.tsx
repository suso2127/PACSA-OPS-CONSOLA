
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
  AlertTriangle,
  Fingerprint
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
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      {/* Cabecera de Configuración */}
      <div className="border-b border-white/5 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <Fingerprint className="h-8 w-8 text-primary" />
            Configuración de Estructura
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] mt-1">Parámetros Críticos y Seguridad del Sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Seguridad de Acceso (PIN) */}
        <Card className="bg-[#1a1b2e] border-none shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-6">
            <CardTitle className="flex items-center gap-3 text-white text-lg font-black uppercase tracking-tight">
              <ShieldCheck className="h-6 w-6 text-indigo-500" />
              Seguridad de Acceso (PIN)
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              Codificación de Accesos por Jerarquía Operativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/50">Clave de Operador (Full System Access)</Label>
              <Input type="password" defaultValue="1234" className="bg-[#25273c] border-none h-14 rounded-xl text-lg tracking-[0.5em] focus-visible:ring-1 focus-visible:ring-indigo-500/50" />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/50">Clave de Supervisor (State Only Access)</Label>
              <Input type="password" defaultValue="5678" className="bg-[#25273c] border-none h-14 rounded-xl text-lg tracking-[0.5em] focus-visible:ring-1 focus-visible:ring-indigo-500/50" />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/50">Clave de Guardia (Operational Terminal)</Label>
              <Input type="password" defaultValue="0000" className="bg-[#25273c] border-none h-14 rounded-xl text-lg tracking-[0.5em] focus-visible:ring-1 focus-visible:ring-indigo-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Límites Operativos */}
        <Card className="bg-[#1a1b2e] border-none shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-6">
            <CardTitle className="flex items-center gap-3 text-white text-lg font-black uppercase tracking-tight">
              <Bell className="h-6 w-6 text-sky-500" />
              Límites Operativos
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              Parámetros Globales de Gestión de Turnos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10 pt-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/50">Límite Turno Estándar (Horas)</Label>
              <Input type="number" defaultValue="12" className="bg-[#25273c] border-none h-14 rounded-xl text-2xl font-black text-white w-[120px] text-center" />
            </div>
            <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="space-y-1">
                <Label className="text-sm font-black text-white uppercase tracking-tight">Alertas Sonoras Activas</Label>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Notificación 24/7 de estados críticos</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-indigo-600 scale-125" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Respaldo Estructural (Igual a la imagen) */}
      <Card className="bg-[#1a1b2e] border-none shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-6">
          <CardTitle className="flex items-center gap-3 text-indigo-500 text-lg font-black uppercase tracking-tight">
            <Database className="h-6 w-6" />
            Respaldo Estructural de la Plataforma
          </CardTitle>
          <CardDescription className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Exportación Completa de Proyectos, Códigos y Planillas Centrales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-10 px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button variant="outline" className="h-16 bg-[#25273c] border-none text-indigo-400 hover:bg-indigo-600 hover:text-white font-black uppercase text-xs tracking-widest transition-all rounded-2xl shadow-lg">
              <Download className="mr-3 h-5 w-5" />
              Exportar Estructura Full (.JSON)
            </Button>
            <Button variant="outline" className="h-16 bg-[#25273c] border-none text-white/80 hover:bg-white/10 font-black uppercase text-xs tracking-widest transition-all rounded-2xl border border-white/5">
              <Upload className="mr-3 h-5 w-5" />
              Restaurar Estructura Sistema
            </Button>
          </div>
          <p className="text-[10px] text-center font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center justify-center gap-3 pt-4">
            <Lock className="h-4 w-4" />
            SISTEMA DE RESPALDO PROTEGIDO POR ENCRIPTACIÓN AES-256
          </p>
        </CardContent>
      </Card>

      {/* Mantenimiento de Base de Datos (Panel Rojo) */}
      <Card className="bg-[#2c1a1a] border-none shadow-2xl rounded-[2rem] overflow-hidden border-l-[8px] border-l-red-600">
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-10 p-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <AlertTriangle className="h-6 w-6" />
              <h4 className="text-xl font-black uppercase tracking-tighter">Limpieza Crítica de Historial</h4>
            </div>
            <p className="text-sm text-red-100/60 font-medium max-w-xl">
              Esta acción eliminará de forma permanente todos los registros históricos de turnos. Los proyectos, clientes y configuraciones de acceso no se verán afectados.
            </p>
          </div>
          <Button 
            onClick={handleClearData}
            className="bg-[#ff4d4d] hover:bg-red-700 text-white font-black uppercase text-xs tracking-[0.2em] h-16 px-12 rounded-2xl shadow-2xl shadow-red-900/40 transition-all active:scale-95"
          >
            <Trash2 className="mr-3 h-5 w-5" />
            VACIAR BASE DE DATOS
          </Button>
        </CardContent>
      </Card>

      {/* Botón Guardar Global de Alto Impacto */}
      <div className="flex justify-end pt-10">
        <Button 
          onClick={handleSave}
          disabled={loading}
          className="h-20 px-16 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-[0.3em] rounded-3xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all active:translate-y-1"
        >
          {loading ? "SINCRONIZANDO..." : <><Save className="mr-4 h-6 w-6" /> GUARDAR CONFIGURACIÓN GLOBAL</>}
        </Button>
      </div>
    </div>
  );
}
