
"use client"

import React from 'react';
import { 
  Phone, 
  ShieldAlert, 
  LifeBuoy, 
  Ambulance, 
  Flame, 
  UserCircle,
  PhoneCall,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EmergencyContact {
  name: string;
  number: string;
  category: string;
  icon: any;
  color: string;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    category: "Autoridades Locales",
    name: "Emergencias Nacionales",
    number: "911",
    icon: ShieldAlert,
    color: "text-red-500 bg-red-500/10 border-red-500/20"
  },
  {
    category: "Autoridades Locales",
    name: "Policía Nacional",
    number: "105",
    icon: ShieldAlert,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
  },
  {
    category: "Servicios Médicos",
    name: "Bomberos",
    number: "116",
    icon: Flame,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20"
  },
  {
    category: "Servicios Médicos",
    name: "SAMU / Ambulancia",
    number: "106",
    icon: Ambulance,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
  },
  {
    category: "Mando PACSA",
    name: "Central de Monitoreo 24/7",
    number: "555-0100",
    icon: LifeBuoy,
    color: "text-primary bg-primary/10 border-primary/20"
  },
  {
    category: "Mando PACSA",
    name: "Supervisión General",
    number: "555-0199",
    icon: UserCircle,
    color: "text-accent bg-accent/10 border-accent/20"
  }
];

export function EmergencyNumbersView() {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const categories = Array.from(new Set(EMERGENCY_CONTACTS.map(c => c.category)));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-6xl mx-auto">
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
          <PhoneCall className="h-8 w-8 text-red-500 animate-pulse" />
          Directorio de Emergencia
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-1 uppercase tracking-widest">Protocolo de Respuesta Inmediata PACSA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">
              {category}
            </h3>
            <div className="space-y-3">
              {EMERGENCY_CONTACTS.filter(c => c.category === category).map((contact, i) => (
                <Card key={i} className="bg-[#1a1b2e] border-white/5 hover:border-primary/30 transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border transition-transform group-hover:scale-110 ${contact.color}`}>
                          <contact.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{contact.category}</p>
                          <h4 className="text-sm font-black text-white uppercase mt-0.5">{contact.name}</h4>
                          <p className="text-lg font-mono font-black text-primary mt-1">{contact.number}</p>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="secondary"
                        onClick={() => handleCall(contact.number)}
                        className="h-12 w-12 rounded-xl bg-white/5 hover:bg-primary hover:text-primary-foreground border border-white/5 transition-all"
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Panel de Soporte Técnico PACSA */}
      <Card className="bg-[#1a1b2e] border-primary/20 shadow-2xl rounded-3xl overflow-hidden mt-12 border-dashed">
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
    </div>
  );
}
