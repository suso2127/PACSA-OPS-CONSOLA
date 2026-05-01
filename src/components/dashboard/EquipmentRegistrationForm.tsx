
"use client"

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Shield, 
  User, 
  Save, 
  Loader2,
  Zap,
  Terminal
} from 'lucide-react';

export function EquipmentRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    guardName: '',
    shirtSize: 'M',
    pantsSize: '',
    bootsSize: '',
    status: 'SOLICITUD',
    equipment: {
      vest: false,
      flashlight: false,
      baton: false,
      helmet: false,
      belt: false,
      zambon: false,
      cap: false,
      taser: false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guardName) {
      toast({
        title: "INFORMACIÓN FALTANTE",
        description: "El nombre del guardia es obligatorio.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'equipment-registrations'), {
        ...formData,
        guardName: formData.guardName.toUpperCase(),
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "DOTACIÓN REGISTRADA",
        description: `El equipo para ${formData.guardName} ha sido sincronizado.`
      });
      
      setFormData({
        guardName: '',
        shirtSize: 'M',
        pantsSize: '',
        bootsSize: '',
        status: 'SOLICITUD',
        equipment: {
          vest: false,
          flashlight: false,
          baton: false,
          helmet: false,
          belt: false,
          zambon: false,
          cap: false,
          taser: false
        }
      });
    } catch (err) {
      toast({
        title: "ERROR",
        description: "No se pudo registrar la dotación.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentChange = (key: keyof typeof formData.equipment) => {
    setFormData(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [key]: !prev.equipment[key]
      }
    }));
  };

  return (
    <div className="bg-[#12121c] border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-700">
      <div className="p-8 bg-[#1a1b2e]/80 border-b border-white/5 flex items-center gap-4">
        <div className="bg-[#10b981]/20 p-3 rounded-2xl border border-[#10b981]/30">
          <Package className="h-8 w-8 text-[#10b981]" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">Control Dotación</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1.5">Registro de Uniformes y Activos</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex items-center gap-3 text-[#10b981]/70">
          <Terminal className="h-5 w-5" />
          <h3 className="text-xs font-black uppercase tracking-[0.3em]">Registro de Tallas y Equipo</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del Guardia */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Completo del Guardia</Label>
            <div className="relative">
              <Input 
                placeholder="NOMBRE Y APELLIDO" 
                value={formData.guardName}
                onChange={(e) => setFormData({...formData, guardName: e.target.value.toUpperCase()})}
                className="h-14 bg-[#1a1b2e] border-white/5 focus:ring-1 focus:ring-[#10b981]/50 text-white font-bold pl-12 rounded-xl"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            </div>
          </div>

          {/* Tallas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Talla Camisa</Label>
              <Select value={formData.shirtSize} onValueChange={(v) => setFormData({...formData, shirtSize: v})}>
                <SelectTrigger className="h-12 bg-[#1a1b2e] border-white/5 rounded-xl text-xs font-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <SelectItem key={size} value={size} className="text-[10px] font-black">{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Talla Pantalón</Label>
              <Input 
                placeholder="28, 30..." 
                value={formData.pantsSize}
                onChange={(e) => setFormData({...formData, pantsSize: e.target.value})}
                className="h-12 bg-[#1a1b2e] border-white/5 rounded-xl text-center font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Talla Botas</Label>
              <Input 
                placeholder="38, 40..." 
                value={formData.bootsSize}
                onChange={(e) => setFormData({...formData, bootsSize: e.target.value})}
                className="h-12 bg-[#1a1b2e] border-white/5 rounded-xl text-center font-bold"
              />
            </div>
          </div>

          {/* Equipo Operativo */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Asignación de Equipo Operativo</Label>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              {[
                { id: 'vest', label: 'Chaleco' },
                { id: 'flashlight', label: 'Linterna' },
                { id: 'baton', label: 'Vara Policial' },
                { id: 'helmet', label: 'Casco' },
                { id: 'belt', label: 'Correa' },
                { id: 'zambon', label: 'Zambon' },
                { id: 'cap', label: 'Gorra' },
                { id: 'taser', label: 'Taser' }
              ].map((item) => (
                <div key={item.id} className="flex items-center space-x-3 group">
                  <Checkbox 
                    id={item.id} 
                    checked={formData.equipment[item.id as keyof typeof formData.equipment]}
                    onCheckedChange={() => handleEquipmentChange(item.id as keyof typeof formData.equipment)}
                    className="border-white/20 data-[state=checked]:bg-[#10b981] data-[state=checked]:border-[#10b981]"
                  />
                  <label htmlFor={item.id} className="text-[11px] font-black text-white/70 uppercase tracking-tighter cursor-pointer group-hover:text-white transition-colors">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-16 bg-[#10b981] hover:bg-[#059669] text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-lg mt-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Zap className="h-5 w-5 mr-2" /> REGISTRAR DOTACIÓN</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
