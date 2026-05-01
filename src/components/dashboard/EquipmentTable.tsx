
"use client"

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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
import { Trash2, Package, User, CheckCircle2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EquipmentRecord {
  id: string;
  guardName: string;
  shirtSize: string;
  pantsSize: string;
  bootsSize: string;
  status?: string;
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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'equipment-registrations', id), { status });
      toast({ 
        title: "ESTADO ACTUALIZADO", 
        description: `La dotación ahora se encuentra en estado: ${status}` 
      });
    } catch (err) {
      toast({ title: "ERROR", description: "No se pudo actualizar el estado.", variant: "destructive" });
    }
  };

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
          vest: 'CHALECO', flashlight: 'LINTERNA', baton: 'VARA POLICIAL', 
          helmet: 'CASCO', belt: 'CORREA', zambon: 'ZAMBON', 
          cap: 'GORRA', taser: 'TASER'
        };
        return labels[key] || key.toUpperCase();
      });
    return active.length > 0 ? active.join(', ') : 'SIN EQUIPO ASIGNADO';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ENTREGADO':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PROBADO':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'SOLICITUD':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      default:
        return 'bg-white/5 text-white/50 border-white/10';
    }
  };

  const exportSinglePDF = (record: EquipmentRecord) => {
    const doc = new jsPDF();
    const date = record.createdAt?.toDate ? record.createdAt.toDate().toLocaleString() : new Date().toLocaleString();

    doc.setFillColor(26, 27, 46);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PACSA OPERACIONES', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('COMPROBANTE DE DOTACIÓN Y EQUIPO', 105, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`GUARDIA: ${record.guardName}`, 20, 55);
    doc.text(`FECHA DE REGISTRO: ${date}`, 20, 62);
    doc.text(`ESTADO ACTUAL: ${record.status || 'SOLICITUD'}`, 20, 69);

    autoTable(doc, {
      startY: 80,
      head: [['CATEGORÍA', 'TALLA / DETALLE']],
      body: [
        ['CAMISA / SUÉTER', record.shirtSize],
        ['PANTALÓN', record.pantsSize || 'N/A'],
        ['BOTAS', record.bootsSize || 'N/A'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    const equipList = Object.entries(record.equipment)
      .filter(([_, val]) => val)
      .map(([key]) => {
        const labels: Record<string, string> = {
          vest: 'CHALECO', flashlight: 'LINTERNA', baton: 'VARA POLICIAL', 
          helmet: 'CASCO', belt: 'CORREA', zambon: 'ZAMBON', 
          cap: 'GORRA', taser: 'TASER'
        };
        return [labels[key] || key.toUpperCase(), 'ASIGNADO'];
      });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['EQUIPO OPERATIVO', 'ESTADO']],
      body: equipList.length > 0 ? equipList : [['SIN EQUIPO ASIGNADO', '-']],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 40;
    doc.line(20, finalY, 80, finalY);
    doc.text('FIRMA RECEPTOR', 35, finalY + 5);
    doc.line(130, finalY, 190, finalY);
    doc.text('FIRMA ENTREGADOR', 145, finalY + 5);

    doc.save(`Dotacion_${record.guardName.replace(/\s+/g, '_')}.pdf`);
  };

  const exportAllPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text('REPORTE GLOBAL DE DOTACIONES - PACSA OPS', 14, 20);
    
    const tableData = records.map(r => [
      r.guardName,
      `${r.shirtSize} / ${r.pantsSize} / ${r.bootsSize}`,
      getEquipmentSummary(r.equipment),
      r.status || 'SOLICITUD',
      r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : '-'
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['GUARDIA', 'TALLAS (C/P/B)', 'EQUIPO', 'ESTADO', 'FECHA']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('Reporte_Global_Dotaciones.pdf');
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
        <div className="flex items-center gap-3">
          <Button 
            onClick={exportAllPDF}
            variant="outline" 
            className="h-7 bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white text-[8px] font-black uppercase tracking-widest px-3"
          >
            <Download className="h-3 w-3 mr-1.5" />
            DESCARGAR REPORTE (PDF)
          </Button>
          <Badge className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 text-[8px] font-black uppercase tracking-widest px-2 py-1">
            {records.length} ASIGNACIONES
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <Table className="min-w-[1000px]">
          <TableHeader className="bg-white/[0.01]">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground pl-5">Guardia</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground text-center">Camisa / Pantalón / Botas</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground">Equipo Asignado</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-tight text-muted-foreground text-center">Estado de Entrega</TableHead>
              <TableHead className="text-right text-[11px] font-black uppercase tracking-tight text-muted-foreground pr-5">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 opacity-50">Sincronizando...</TableCell></TableRow>
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
                  <TableCell className="text-center">
                    <Select 
                      value={record.status || 'SOLICITUD'} 
                      onValueChange={(val) => handleUpdateStatus(record.id, val)}
                    >
                      <SelectTrigger className={`h-8 border font-black text-[9px] uppercase tracking-widest rounded-lg px-2 w-[140px] mx-auto ${getStatusStyle(record.status || 'SOLICITUD')}`}>
                        <div className="flex items-center justify-center gap-2">
                          {(record.status === 'ENTREGADO') && <CheckCircle2 className="h-3 w-3" />}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1b2e] border-white/10 text-white">
                        <SelectItem value="SOLICITUD" className="text-[9px] font-black uppercase text-sky-500">SOLICITUD</SelectItem>
                        <SelectItem value="PROBADO" className="text-[9px] font-black uppercase text-amber-500">PROBADO</SelectItem>
                        <SelectItem value="ENTREGADO" className="text-[9px] font-black uppercase text-emerald-500">ENTREGADO (OK)</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right pr-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => exportSinglePDF(record)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Descargar Comprobante PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(record.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No hay registros de dotación.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
