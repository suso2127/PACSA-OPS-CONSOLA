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
  Terminal,
  RotateCcw,
  Filter,
  Copy,
  Check,
  Radio,
  ExternalLink,
  ShieldCheck,
  Database
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { OFFICIAL_EMERGENCY_CONTACTS, DefaultEmergencyContact } from '@/data/emergencyContacts';

interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: string;
  zone: string;
  address?: string;
  isOfficial?: boolean;
  createdAt?: any;
}

const ESTAMENTOS = [
  'Policía Nacional',
  'Bomberos',
  'SUME 911',
  'SINAPROC',
  'Cruz Roja',
  'Autoridad del Tránsito',
  'Mando PACSA',
  'Seguridad Privada'
];

const ZONAS_PRINCIPALES = [
  { id: 'all', label: 'Todas las Zonas' },
  { id: 'Panamá Centro', label: 'Panamá Centro' },
  { id: 'San Miguelito', label: 'San Miguelito' },
  { id: 'Panamá Norte', label: 'Panamá Norte' },
  { id: 'Panamá Este', label: 'Panamá Este' },
  { id: 'Panamá Oeste', label: 'Panamá Oeste' },
  { id: 'Nacional / Central', label: 'Nacional / Central' }
];

const TODAS_ZONAS = [
  'Panamá Centro',
  'San Miguelito',
  'Panamá Norte',
  'Panamá Este',
  'Panamá Oeste',
  'Nacional / Central',
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
  const [firestoreContacts, setFirestoreContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    number: '',
    category: ESTAMENTOS[0],
    zone: TODAS_ZONAS[0],
    address: ''
  });

  // Suscribir a la colección en Firestore
  useEffect(() => {
    const q = query(collection(db, 'emergency-contacts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as EmergencyContact[];
      setFirestoreContacts(fetched);
      setLoading(false);
    }, (err) => {
      console.warn('Error fetching emergency-contacts:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Consolidar contactos oficiales con los de Firestore (evitando duplicados por nombre normalizado)
  const allContacts = useMemo<EmergencyContact[]>(() => {
    const firestoreNameSet = new Set(firestoreContacts.map(c => c.name.trim().toUpperCase()));
    
    // Contactos oficiales que no estén explícitamente sobreescritos en Firestore
    const nonDuplicatedOfficials = OFFICIAL_EMERGENCY_CONTACTS.filter(
      official => !firestoreNameSet.has(official.name.trim().toUpperCase())
    ).map(o => ({
      id: o.id,
      name: o.name,
      number: o.number,
      category: o.category,
      zone: o.zone,
      address: o.address,
      isOfficial: true
    }));

    return [...firestoreContacts, ...nonDuplicatedOfficials];
  }, [firestoreContacts]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.number.trim()) {
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
        name: formData.name.trim().toUpperCase(),
        number: formData.number.trim(),
        category: formData.category,
        zone: formData.zone,
        address: formData.address.trim() || 'No especificada',
        isOfficial: false,
        createdAt: serverTimestamp()
      });
      toast({
        title: "CONTACTO REGISTRADO",
        description: `Se ha añadido ${formData.name.toUpperCase()} a la base de emergencias.`
      });
      setFormData({ name: '', number: '', category: ESTAMENTOS[0], zone: TODAS_ZONAS[0], address: '' });
      setShowAddForm(false);
    } catch (err) {
      toast({
        title: "ERROR",
        description: "No se pudo guardar el contacto en Firestore.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, isOfficial?: boolean) => {
    if (isOfficial) {
      toast({
        title: "CONTACTO INSTITUCIONAL",
        description: "Los estamentos oficiales predeterminados forman parte del catálogo nacional.",
      });
      return;
    }

    try {
      await deleteDoc(doc(db, 'emergency-contacts', id));
      toast({
        title: "REGISTRO ELIMINADO",
        description: "El contacto personalizado ha sido removido de la base de datos."
      });
    } catch (err) {
      toast({
        title: "ERROR",
        description: "No se pudo eliminar el registro de Firestore.",
        variant: "destructive"
      });
    }
  };

  // Sincronizar masivamente el catálogo oficial en Firestore si se desea persistir
  const handleSyncOfficialCatalog = async () => {
    setSyncingAll(true);
    try {
      const existingNames = new Set(firestoreContacts.map(c => c.name.trim().toUpperCase()));
      const toAdd = OFFICIAL_EMERGENCY_CONTACTS.filter(o => !existingNames.has(o.name.trim().toUpperCase()));

      if (toAdd.length === 0) {
        toast({
          title: "BASE YA SINCRONIZADA",
          description: "Todos los estamentos oficiales ya se encuentran registrados en Firestore."
        });
        setSyncingAll(false);
        return;
      }

      // Añadir en lote
      const batch = writeBatch(db);
      toAdd.slice(0, 50).forEach((item) => {
        const newRef = doc(collection(db, 'emergency-contacts'));
        batch.set(newRef, {
          name: item.name,
          number: item.number,
          category: item.category,
          zone: item.zone,
          address: item.address || '',
          isOfficial: true,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();

      toast({
        title: "SINCRONIZACIÓN EXITOSA",
        description: `Se sincronizaron ${Math.min(toAdd.length, 50)} estamentos oficiales en Firestore.`
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "ERROR DE SINCRONIZACIÓN",
        description: "No se pudo completar la carga masiva.",
        variant: "destructive"
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setZoneFilter('all');
  };

  const filteredContacts = useMemo(() => {
    return allContacts.filter(c => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(term) || 
        c.number.includes(term) ||
        (c.address && c.address.toLowerCase().includes(term));
      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesZone = zoneFilter === 'all' || c.zone === zoneFilter;
      
      return matchesSearch && matchesCategory && matchesZone;
    });
  }, [allContacts, searchTerm, categoryFilter, zoneFilter]);

  const getIconForCategory = (category: string) => {
    if (category.includes('Policía')) return ShieldAlert;
    if (category.includes('Bomberos')) return Flame;
    if (category.includes('SUME') || category.includes('Cruz')) return Ambulance;
    if (category.includes('SINAPROC')) return LifeBuoy;
    if (category.includes('Tránsito')) return ShieldCheck;
    if (category.includes('PACSA')) return Radio;
    return PhoneCall;
  };

  const handleCall = (number: string) => {
    const cleanNumber = number.replace(/[^0-9*]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  const handleCopy = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    toast({
      title: "NÚMERO COPIADO",
      description: `${number} copiado al portapapeles.`
    });
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // Contadores por zona para los badges rápidos
  const zoneCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allContacts.length };
    allContacts.forEach(c => {
      counts[c.zone] = (counts[c.zone] || 0) + 1;
    });
    return counts;
  }, [allContacts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <PhoneCall className="h-8 w-8 text-red-600 animate-pulse" />
            Emergencia Base - Estamentos de Seguridad
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">
            Directorio táctico oficial: Policía Nacional, Bomberos, Ambulancias y Rescate por zona
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            onClick={handleSyncOfficialCatalog}
            disabled={syncingAll}
            variant="outline"
            className="h-12 px-4 font-black uppercase tracking-widest text-[10px] rounded-xl border-white/10 bg-[#1a1b2e] hover:bg-white/10 text-white"
          >
            {syncingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2 text-primary" />}
            Sincronizar a Firestore
          </Button>

          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`h-12 px-5 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all ${
              showAddForm ? 'bg-secondary' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {showAddForm ? 'CANCELAR' : <><Plus className="h-4 w-4 mr-2" /> NUEVO CONTACTO</>}
          </Button>
        </div>
      </div>

      {/* Marcación Rápida Prioritaria (Líneas Nacionales de Emergencia) */}
      <div className="bg-[#1a1b2e] border border-white/5 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-red-500 animate-ping" />
            Marcación Rápida de Respuesta Inmediata (Nivel Nacional)
          </span>
          <span className="text-[9px] font-bold text-muted-foreground">Llamada de 1-toque</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button 
            onClick={() => handleCall('104')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0f101d] border border-blue-500/20 hover:border-blue-500 hover:bg-blue-500/10 transition-all group"
          >
            <ShieldAlert className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xl font-mono font-black text-white">104</span>
            <span className="text-[9px] font-black text-muted-foreground uppercase">Policía Nacional</span>
          </button>

          <button 
            onClick={() => handleCall('103')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0f101d] border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 transition-all group"
          >
            <Flame className="h-5 w-5 text-red-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xl font-mono font-black text-white">103</span>
            <span className="text-[9px] font-black text-muted-foreground uppercase">Bomberos BCBRP</span>
          </button>

          <button 
            onClick={() => handleCall('911')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0f101d] border border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all group"
          >
            <Ambulance className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xl font-mono font-black text-white">911</span>
            <span className="text-[9px] font-black text-muted-foreground uppercase">SUME 911</span>
          </button>

          <button 
            onClick={() => handleCall('*335')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0f101d] border border-amber-500/20 hover:border-amber-500 hover:bg-amber-500/10 transition-all group"
          >
            <LifeBuoy className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xl font-mono font-black text-white">*335</span>
            <span className="text-[9px] font-black text-muted-foreground uppercase">SINAPROC</span>
          </button>

          <button 
            onClick={() => handleCall('315-1388')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0f101d] border border-rose-500/20 hover:border-rose-500 hover:bg-rose-500/10 transition-all group"
          >
            <Ambulance className="h-5 w-5 text-rose-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-base font-mono font-black text-white">315-1388</span>
            <span className="text-[9px] font-black text-muted-foreground uppercase">Cruz Roja</span>
          </button>

          <button 
            onClick={() => handleCall('511-5100')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0f101d] border border-purple-500/20 hover:border-purple-500 hover:bg-purple-500/10 transition-all group"
          >
            <ShieldCheck className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-base font-mono font-black text-white">511-5100</span>
            <span className="text-[9px] font-black text-muted-foreground uppercase">DNOT Tránsito</span>
          </button>
        </div>
      </div>

      {/* Selector Rápido de Zonas Tácticas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {ZONAS_PRINCIPALES.map(z => {
          const isSelected = zoneFilter === z.id;
          const count = zoneCounts[z.id] || 0;
          return (
            <button
              key={z.id}
              onClick={() => setZoneFilter(z.id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
                  : 'bg-[#1a1b2e] border-white/5 text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              <MapPin className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-red-500'}`} />
              {z.label}
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-black/30 text-white' : 'bg-white/5 text-muted-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Carga Personalizada */}
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
                      placeholder="EJ. POLICÍA - SUBESTACIÓN SAN FRANCISCO" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                      className="bg-[#0f101d] border-none h-12 text-sm font-bold text-white rounded-xl focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Número Telefónico</Label>
                    <Input 
                      placeholder="511-0000, 104, 103" 
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="bg-[#0f101d] border-none h-12 font-mono text-base font-black text-primary rounded-xl focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ubicación / Dirección Exacta</Label>
                    <Input 
                      placeholder="Calle, Corregimiento o Referencia" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="bg-[#0f101d] border-none h-12 text-xs font-semibold text-white rounded-xl focus:ring-1 focus:ring-red-500/50"
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
                          {TODAS_ZONAS.map(z => <SelectItem key={z} value={z} className="text-[10px] font-black uppercase">{z}</SelectItem>)}
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

        {/* Listado y Búsqueda */}
        <div className={`${showAddForm ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          {/* Panel de Filtros Avanzados */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/10 to-primary/10 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-[#1a1b2e] border border-white/5 rounded-2xl p-2 flex items-center gap-4">
                <div className="pl-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input 
                  placeholder="BUSCAR SUBESTACIÓN, CUARTEL, CORREGIMIENTO O TELÉFONO..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none flex-1 h-11 text-[11px] font-black uppercase tracking-wider text-white outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-[#1a1b2e] border-white/5 h-[59px] rounded-2xl text-[9px] font-black uppercase tracking-widest text-primary focus:ring-1 focus:ring-primary/30">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    <SelectValue placeholder="ESTAMENTO" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b2e] border-white/10">
                  <SelectItem value="all" className="text-[9px] font-black uppercase">TODOS LOS ESTAMENTOS</SelectItem>
                  {ESTAMENTOS.map(e => <SelectItem key={e} value={e} className="text-[9px] font-black uppercase">{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 flex gap-2">
              <div className="flex-1">
                <Select value={zoneFilter} onValueChange={setZoneFilter}>
                  <SelectTrigger className="bg-[#1a1b2e] border-white/5 h-[59px] rounded-2xl text-[9px] font-black uppercase tracking-widest text-sky-500 focus:ring-1 focus:ring-sky-500/30">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <SelectValue placeholder="ZONA" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1b2e] border-white/10">
                    <SelectItem value="all" className="text-[9px] font-black uppercase">TODAS LAS ZONAS</SelectItem>
                    {TODAS_ZONAS.map(z => <SelectItem key={z} value={z} className="text-[9px] font-black uppercase">{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline"
                onClick={resetFilters}
                className="h-[59px] px-4 bg-secondary/20 border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white rounded-2xl transition-all"
                title="Limpiar Filtros"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              Mostrando {filteredContacts.length} de {allContacts.length} estamentos registrados
            </span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
              {zoneFilter === 'all' ? 'Cobertura Nacional' : `Zona: ${zoneFilter}`}
            </span>
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
                const isCopied = copiedNumber === contact.number;
                const isPN = contact.category.includes('Policía');
                const isBC = contact.category.includes('Bomberos');
                const is911 = contact.category.includes('SUME');

                return (
                  <Card 
                    key={contact.id} 
                    className="bg-[#1a1b2e] border-white/5 hover:border-red-500/40 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between"
                  >
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Cabecera de la Tarjeta */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 border ${
                              isPN ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              isBC ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              is911 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              'bg-white/5 text-muted-foreground border-white/10'
                            }`}>
                              {contact.category}
                            </Badge>

                            <div className="flex items-center gap-1 text-[8px] font-black text-sky-400 uppercase bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                              <MapPin className="h-2.5 w-2.5" />
                              {contact.zone}
                            </div>

                            {contact.isOfficial ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[7px] font-black uppercase px-1.5 py-0">
                                OFICIAL
                              </Badge>
                            ) : (
                              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[7px] font-black uppercase px-1.5 py-0">
                                PERSONALIZADO
                              </Badge>
                            )}
                          </div>

                          {!contact.isOfficial && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleDelete(contact.id, contact.isOfficial)}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Eliminar contacto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {/* Nombre y Dirección */}
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-2xl border bg-[#0f101d] transition-all group-hover:scale-105 shrink-0 ${
                            isPN ? 'text-blue-400 border-blue-500/20' :
                            isBC ? 'text-red-500 border-red-500/20' :
                            is911 ? 'text-emerald-400 border-emerald-500/20' :
                            'text-amber-400 border-amber-500/20'
                          }`}>
                            <CategoryIcon className="h-6 w-6" />
                          </div>

                          <div className="flex-1 overflow-hidden">
                            <h4 className="text-sm font-black text-white uppercase leading-snug">
                              {contact.name}
                            </h4>
                            {contact.address && (
                              <p className="text-[10px] text-muted-foreground font-semibold mt-1 line-clamp-2">
                                {contact.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Teléfono y Acciones de Llamada */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">
                            Línea Telefónica
                          </span>
                          <span className="text-xl font-mono font-black text-red-500 tracking-tighter">
                            {contact.number}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => handleCopy(contact.number)}
                            className="h-10 w-10 rounded-xl border-white/10 bg-[#0f101d] hover:bg-white/10 text-muted-foreground hover:text-white"
                            title="Copiar número"
                          >
                            {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </Button>

                          <Button 
                            onClick={() => handleCall(contact.number)}
                            className="h-10 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>Llamar</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>

                    {/* Marca de agua de fondo */}
                    <div className="absolute -bottom-2 -right-2 p-2 opacity-5 pointer-events-none">
                      <Building2 className="h-16 w-16 text-white" />
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-28 bg-[#1a1b2e] border-2 border-dashed border-white/5 rounded-3xl text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">
                  No se encontraron estamentos con los filtros seleccionados
                </p>
                <Button variant="link" onClick={resetFilters} className="text-primary text-[10px] font-black uppercase mt-3">
                  RESTAURAR FILTROS
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
