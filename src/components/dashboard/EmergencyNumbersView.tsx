
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  ShieldAlert, 
  LifeBuoy, 
  Ambulance, 
  Flame, 
  UserCircle,
  PhoneCall,
  Search,
  Plus,
  Trash2,
  MapPin,
  Building2,
  Loader2,
  Save,
  Terminal
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: string;
  zone: string;
  createdAt?: any;
}

const ESTAMENTOS = [
  'Policía Nacional',
  'Bomberos',
  'SINAPROC',
  'Cruz Roja',
  'SUME 911',
  'Autoridad del Tránsito',
  'Mando PACSA',
  'Seguridad Privada'
];

const ZONAS = [
  'Panamá Centro',
  'Panamá Este',
  'Panamá Oeste',
  'Colón',
  'Chiriquí',
  'Coclé',
  'Herrera',
  'Los Santos',
  'Veraguas',
  'Bocas del Toro',
  'Darién'
];

export function EmergencyNumbersView() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    number: '',
    category: ESTAMENTOS[0],
    zone: ZONAS[0]
  });

  useEffect(() => {
    const q = query(collection(db, 'emergency-contacts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmergencyContact[];
      setContacts(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.number) {
      toast({
        title: "DATOS INCOMPLETOS",
        description: "Nombre y número son obligatorios.",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      await addDoc(collection(db, 'emergency-contacts'), {
        ...formData,
        name: formData.name.toUpperCase(),
        createdAt: serverTimestamp()
      });
      toast({
        title: "CONTACTO REGISTRADO",
        description: `Se ha añadido a ${formData.name} a la base de emergencias.`
      });
      setFormData({ name: '', number: '', category: ESTAMENTOS[0], zone: ZONAS[0] });
      setShowAddForm(false);
    } catch (err) {
      toast({
        title: "ERROR",
        description: "No se pudo guardar el contacto.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'emergency-contacts', id));
      toast({
        title: "REGISTRO ELIMINADO",
        description: "El contacto ha sido removido de la base de datos."
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro.",
        variant: "destructive"
      });
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.number.includes(searchTerm) ||
      c.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  const getIconForCategory = (category: string) => {
    if (category.includes('Policía')) return ShieldAlert;
    if (category.includes('Bomberos')) return Flame;
    if (category.includes('SUME') || category.includes('Cruz')) return Ambulance;
    if (category.includes('PACSA')) return LifeBuoy;
    return PhoneCall;
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <PhoneCall className="h-8 w-8 text-red-600 animate-pulse" />
            Emergencia Base - Panamá
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">
            Base de datos operativa de estamentos de seguridad por zona
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`h-12 px-6 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all ${showAddForm ? 'bg-secondary' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {showAddForm ? 'CANCELAR CARGA' : <><Plus className="h-4 w-4 mr-2" /> NUEVO CONTACTO</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Izquierdo: Formulario de Carga (Opcional) */}
        {showAddForm && (
          <div className="lg:col-span-4 animate-in slide-in-from-left duration-300">
            <Card className="bg-[#1a1b2e] border-white/5 rounded-3xl shadow-2xl overflow-hidden sticky top-24">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3 text-red-500">
                  <Terminal className="h-5 w-5" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Carga de Emergencias</h3>
                </div>

                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre / Dependencia</Label>
                    <Input 
                      placeholder="EJ. POLICÍA - CALIDONIA" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                      className="bg-[#0f101d] border-none h-12 text-sm font-bold text-white rounded-xl focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Número Telefónico</Label>
                    <Input 
                      placeholder="104, 555-0000" 
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="bg-[#0f101d] border-none h-12 font-mono text-base font-black text-primary rounded-xl focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estamento</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                        <SelectTrigger className="bg-[#0f101d] border-none h-12 text-[10px] font-black uppercase rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1b2e] border-white/10">
                          {ESTAMENTOS.map(e => <SelectItem key={e} value={e} className="text-[10px] font-black uppercase">{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Zona</Label>
                      <Select value={formData.zone} onValueChange={(v) => setFormData({...formData, zone: v})}>
                        <SelectTrigger className="bg-[#0f101d] border-none h-12 text-[10px] font-black uppercase rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1b2e] border-white/10">
                          {ZONAS.map(z => <SelectItem key={z} value={z} className="text-[10px] font-black uppercase">{z}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={actionLoading}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg mt-4"
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> GUARDAR EN BASE</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lado Derecho: Listado y Búsqueda */}
        <div className={`${showAddForm ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          {/* Barra de Filtro Rápido */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/10 to-primary/10 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-[#1a1b2e] border border-white/5 rounded-2xl p-2 flex items-center gap-4">
              <div className="pl-4">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input 
                placeholder="BUSQUEDA RÁPIDA POR NOMBRE, ZONA O ESTAMENTO..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none flex-1 h-12 text-sm font-black uppercase tracking-wider text-white outline-none placeholder:text-muted-foreground/50"
              />
              <Badge className="bg-white/5 text-muted-foreground border-white/10 text-[9px] font-black uppercase tracking-widest px-4 h-8 mr-2">
                {filteredContacts.length} REGISTROS
              </Badge>
            </div>
          </div>

          {/* Listado de Contactos */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-20 text-center opacity-50">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Base de Emergencias...</p>
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => {
                const CategoryIcon = getIconForCategory(contact.category);
                return (
                  <Card key={contact.id} className="bg-[#1a1b2e] border-white/5 hover:border-red-500/30 transition-all duration-300 group relative overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-2xl border bg-[#0f101d] transition-all group-hover:scale-110 ${contact.category.includes('PACSA') ? 'text-primary border-primary/20' : 'text-red-500 border-red-500/20'}`}>
                            <CategoryIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge className="bg-white/5 text-muted-foreground border-white/5 text-[7px] font-black uppercase tracking-tighter px-1.5 py-0">
                                {contact.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-[7px] font-black text-primary uppercase">
                                <MapPin className="h-2.5 w-2.5" />
                                {contact.zone}
                              </div>
                            </div>
                            <h4 className="text-sm font-black text-white uppercase leading-tight line-clamp-1">{contact.name}</h4>
                            <p className="text-xl font-mono font-black text-red-500 mt-2 tracking-tighter">{contact.number}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="icon" 
                            variant="secondary"
                            onClick={() => handleCall(contact.number)}
                            className="h-10 w-10 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleDelete(contact.id)}
                            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    {/* Indicador de Zona */}
                    <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                      <Building2 className="h-12 w-12 text-white" />
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-32 bg-[#1a1b2e] border-2 border-dashed border-white/5 rounded-3xl text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 italic">
                  Sin registros detectados en la zona o estamento seleccionado
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
