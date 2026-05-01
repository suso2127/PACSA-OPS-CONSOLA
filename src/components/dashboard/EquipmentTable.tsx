
"use client"

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Trash2, Package, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EquipmentRecord {
  id: string;
  guardName: string;
  shirtSize: string;
  pantsSize: string;
  bootsSize: string;
  equipment: {
    vest: boolean;
    flashlight: boolean;
    baton: boolean;
    helmet: boolean;
    belt: boolean;
    zambon: boolean;
    cap: boolean;
    taser: boolean;
  };
  createdAt: any;
}

export function EquipmentTable() {
  const [records, setRecords] = useState<EquipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(
      collection(db, 'equipment-registrations'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EquipmentRecord[];
      setRecords(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'equipment-registrations', id));
      toast({ title: "REGISTRO ELIMINADO", description: "El registro de dotación ha sido removido." });
    } catch (err) {
      toast({ title: "ERROR", description: "No se pudo eliminar el registro.", variant: "destructive" });
    }
  };

  const getEquipmentSummary = (equip: EquipmentRecord['equipment']) => {
    const active = Object.entries(equip)
      .filter(([_, val]) => val)
      .map(([key, _]) => {
        const labels: Record<string, string> = {
          vest: 'CHL', flashlight: 'LNT', baton: 'VRA', 
          helmet: 'CSC', belt: 'COR', zambon: 'ZAM', 
          cap: 'GOR', taser: 'TSR'
        };
        return labels[key] || key;
      });
    return active.length > 0 ? active.join(', ') : 'SIN EQUIPO';
  };

  return (
    <div className="bg-[#12121c] border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-500 h-full">
      <div className="px-5 py-3 bg-[#1a1b2e]/60 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#10b981]/10 rounded-lg border border-[#10b981]/20">
            <Package className="h-4 w-4 text-[#10b981]" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-tight">REGISTROS DE DOTACIÓN</h3>
        </div>
        <Badge className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 text-[8px] font-black uppercase tracking-widest px-2 py-1">
          {records.length} ASIGNACIONES
        </Badge>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-white/[0.01]">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground pl-5">Guardia</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground text-center">Camisa / Pantalón / Botas</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground">Equipo Asignado</TableHead>
              <TableHead className="text-right text-[11px] font-black uppercase tracking-tight text-muted-foreground pr-5">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 opacity-50">Sincronizando...</TableCell></TableRow>
            ) : records.length > 0 ? (
              records.map((record) => (
                <TableRow key={record.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-white/50" />
                      </div>
                      <span className="text-sm font-black text-white uppercase">{record.guardName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono text-[10px] bg-black/20 border-white/10 px-3 flex items-center justify-center gap-2 h-7 min-w-[120px]">
                      <span className="text-primary">{record.shirtSize}</span>
                      <span className="text-white/20">|</span>
                      <span className="text-white">{record.pantsSize}</span>
                      <span className="text-white/20">|</span>
                      <span className="text-[#10b981]">{record.bootsSize}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                        {getEquipmentSummary(record.equipment)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(record.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">No hay registros de dotación.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
