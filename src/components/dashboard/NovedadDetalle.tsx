
"use client"

import React from 'react';
import { Novedad } from './NovedadesView';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Printer, 
  FileText, 
  Clock, 
  MapPin, 
  User, 
  Activity,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Badge } from '@/components/ui/badge';

interface NovedadDetalleProps {
  novedad: Novedad;
  onBack: () => void;
}

export function NovedadDetalle({ novedad, onBack }: NovedadDetalleProps) {

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dateStr = novedad.fecha;
    
    // Encabezado Corporativo
    doc.setFillColor(26, 27, 46);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('GRUPO PACSA S.A.', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('INFORME TÁCTICO DE NOVEDAD / INCIDENTE', 105, 30, { align: 'center' });

    // Datos Operativos
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`N° NOVEDAD: ${novedad.numeroNovedad}`, 20, 50);
    doc.text(`PROYECTO: ${novedad.proyectoNombre}`, 20, 56);
    doc.text(`ENCARGADO: ${novedad.contactoProyecto}`, 20, 62);
    doc.text(`FECHA: ${dateStr}`, 20, 68);
    doc.text(`LUGAR: ${novedad.lugar}`, 130, 50);
    doc.text(`UNIDAD: ${novedad.unidadTurnoNombre}`, 130, 56);
    doc.text(`TURNO: ${novedad.horarioServicio}`, 130, 62);
    doc.text(`REF: ${novedad.referencia}`, 20, 78);

    doc.line(20, 82, 190, 82);

    // Antecedentes
    doc.setFontSize(12);
    doc.text('ANTECEDENTES', 20, 92);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitAntecedentes = doc.splitTextToSize(novedad.antecedentes || 'Sin antecedentes registrados.', 170);
    doc.text(splitAntecedentes, 20, 98);

    // Descripción
    const descY = 100 + (splitAntecedentes.length * 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DESCRIPCIÓN DE LOS HECHOS', 20, descY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitHechos = doc.splitTextToSize(novedad.descripcionHechos || 'Sin descripción detallada.', 170);
    doc.text(splitHechos, 20, descY + 6);

    // Acciones y Recomendaciones en Tablas
    autoTable(doc, {
      startY: descY + 12 + (splitHechos.length * 5),
      head: [['#', 'ACCIONES TOMADAS']],
      body: novedad.accionesTomadas.map((a, i) => [i + 1, a]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['#', 'RECOMENDACIONES OPERATIVAS']],
      body: novedad.recomendaciones.map((r, i) => [i + 1, r]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 }
    });

    // Pie de firmas
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.line(20, finalY, 80, finalY);
    doc.text('FIRMA RESPONSABLE', 35, finalY + 5);
    doc.line(130, finalY, 190, finalY);
    doc.text('FIRMA RECIBIDO CLIENTE', 145, finalY + 5);

    doc.save(`PACSA_NOVEDAD_${novedad.numeroNovedad}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-white font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Listado
        </Button>
        <Button 
          onClick={handleExportPDF}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl shadow-lg"
        >
          <Printer className="h-4 w-4 mr-2" /> Exportar PDF
        </Button>
      </div>

      <div className="bg-[#1a1b2e] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="p-10 bg-[#25273c]/50 border-b border-white/5 text-center">
          <h2 className="text-sm font-black text-primary uppercase tracking-[0.4em] mb-2">Informe de Novedad Operativa</h2>
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{novedad.proyectoNombre}</h3>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge className="bg-white/5 text-white/50 border-white/5 text-[9px] font-black uppercase tracking-widest px-3 py-1">
              N° {novedad.numeroNovedad}
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest px-3 py-1">
              {novedad.tipoIncidente}
            </Badge>
          </div>
        </div>

        <div className="p-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Fecha:</span>
                <span className="text-sm font-bold text-white">{novedad.fecha}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Lugar:</span>
                <span className="text-sm font-bold text-white">{novedad.lugar}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Unidad:</span>
                <span className="text-sm font-bold text-white">{novedad.unidadTurnoNombre}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Turno:</span>
                <span className="text-sm font-bold text-white">{novedad.horarioServicio}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
              <Activity className="h-4 w-4" /> Ref.: {novedad.referencia}
            </h4>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0f101d] p-8 rounded-3xl border border-white/5">
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Antecedentes</h5>
              <p className="text-sm text-white/80 leading-relaxed font-medium">{novedad.antecedentes}</p>
            </div>

            <div className="bg-[#0f101d] p-8 rounded-3xl border border-white/5">
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Descripción de los Hechos</h5>
              <p className="text-sm text-white/80 leading-relaxed font-medium whitespace-pre-wrap">{novedad.descripcionHechos}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Acciones Tomadas
              </h5>
              <ul className="space-y-2">
                {novedad.accionesTomadas.map((a, i) => (
                  <li key={i} className="flex gap-3 text-sm font-medium text-white/70">
                    <span className="font-black text-blue-500/50">{i + 1}.</span> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Recomendaciones
              </h5>
              <ul className="space-y-2">
                {novedad.recomendaciones.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm font-medium text-white/70">
                    <span className="font-black text-emerald-500/50">{i + 1}.</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
