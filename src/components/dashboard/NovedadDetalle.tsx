
"use client"

import React from 'react';
import { Novedad } from './NovedadesView';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Printer, 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  Clock,
  Activity
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Badge } from '@/components/ui/badge';

interface NovedadDetalleProps {
  novedad: Novedad;
  onBack: () => void;
}

export function NovedadDetalle({ novedad, onBack }: NovedadDetalleProps) {

  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return `${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const margin = 25;
    let y = 25;

    // 1. Logotipo y Encabezado Corporativo
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('GRUPO PACSA S.A.', margin, y);
    y += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('DIVISIÓN DE SEGURIDAD INTEGRAL Y OPERACIONES TÁCTICAS', margin, y);
    doc.setTextColor(0, 0, 0);
    y += 15;

    // 2. Título del Reporte
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const mainTitle = `REPORTE DE INCIDENTE – ${novedad.referencia}`;
    const titleWidth = doc.getTextWidth(mainTitle);
    doc.text(mainTitle, (210 - titleWidth) / 2, y);
    y += 20;

    // 3. Bloque de Datos (Formato Oficio)
    doc.setFontSize(11);
    
    const printLine = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 45, y);
      y += 8;
    };

    printLine('Proyecto:', `${novedad.proyectoNombre} ${novedad.contactoProyecto ? '(' + novedad.contactoProyecto + ')' : ''}`);
    printLine('Fecha:', formatDateLong(novedad.fecha));
    printLine('Lugar:', novedad.lugar);
    printLine('Unidad de Turno:', novedad.unidadTurnoNombre);
    printLine('Horario de servicio:', novedad.horarioServicio);
    printLine('Ref.:', novedad.referencia);
    
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 185, y);
    y += 15;

    // 4. Secciones Narrativas
    const renderSection = (title: string, content: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content || 'No se registraron datos.', 160);
      doc.text(lines, margin, y, { align: 'justify' });
      y += (lines.length * 6) + 12;
      
      // Control de salto de página simple
      if (y > 250) {
        doc.addPage();
        y = 25;
      }
    };

    renderSection('ANTECEDENTES', novedad.antecedentes);
    renderSection('DESCRIPCIÓN DE LOS HECHOS', novedad.descripcionHechos);

    // 5. Listas (Acciones y Recomendaciones)
    const renderList = (title: string, items: string[]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      
      if (items && items.length > 0 && items[0] !== '') {
        items.forEach((item, idx) => {
          const bullet = `${idx + 1}. `;
          const lines = doc.splitTextToSize(item, 150);
          doc.text(bullet, margin, y);
          doc.text(lines, margin + 10, y);
          y += (lines.length * 6) + 2;
          
          if (y > 260) {
            doc.addPage();
            y = 25;
          }
        });
      } else {
        doc.text('No se aplicaron acciones específicas.', margin, y);
        y += 10;
      }
      y += 5;
    };

    renderList('ACCIONES TOMADAS', novedad.accionesTomadas);
    renderList('RECOMENDACIONES', novedad.recomendaciones);

    // 6. Anexos
    doc.setFont('helvetica', 'bold');
    doc.text('ANEXOS', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text('No aplica.', margin, y);
    y += 35;

    // 7. Firmas (Pie de página formal)
    const footerY = y > 240 ? 25 : y;
    if (y > 240) doc.addPage();
    
    const sigLineY = 260;
    doc.setDrawColor(0);
    doc.line(margin, sigLineY, margin + 65, sigLineY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FIRMA RESPONSABLE', margin, sigLineY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(novedad.unidadTurnoNombre, margin, sigLineY + 10);

    doc.line(120, sigLineY, 185, sigLineY);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBE CONFORME (CLIENTE)', 120, sigLineY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Nombre y Cédula:', 120, sigLineY + 10);

    doc.save(`PACSA_NOVEDAD_${novedad.numeroNovedad}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 print:p-0 print:bg-white print:text-black">
      {/* Botonera - Oculta en impresión */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6 print:hidden">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-white font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Listado
        </Button>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => window.print()}
            className="border-white/10 text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl"
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl shadow-lg"
          >
            <FileText className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Documento Visual - Estilo Oficio */}
      <div className="bg-white text-black p-12 md:p-16 shadow-2xl rounded-sm print:shadow-none print:p-0 font-serif">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter mb-1">GRUPO PACSA S.A.</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Seguridad Integral y Operaciones Tácticas</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="border-black text-black font-bold px-3">
              N° {novedad.numeroNovedad}
            </Badge>
          </div>
        </div>

        <h1 className="text-center text-xl font-bold uppercase mb-12 underline underline-offset-8">
          REPORTE DE INCIDENTE – {novedad.referencia}
        </h1>

        <div className="space-y-4 mb-12 text-sm">
          <div className="flex gap-4">
            <span className="font-bold min-w-[140px]">Proyecto:</span>
            <span>{novedad.proyectoNombre} {novedad.contactoProyecto && `(${novedad.contactoProyecto})`}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-bold min-w-[140px]">Fecha:</span>
            <span>{formatDateLong(novedad.fecha)}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-bold min-w-[140px]">Lugar:</span>
            <span>{novedad.lugar}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-bold min-w-[140px]">Unidad de Turno:</span>
            <span>{novedad.unidadTurnoNombre}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-bold min-w-[140px]">Horario de servicio:</span>
            <span>{novedad.horarioServicio}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-bold min-w-[140px]">Ref.:</span>
            <span>{novedad.referencia}</span>
          </div>
        </div>

        <hr className="border-gray-200 mb-10" />

        <div className="space-y-10 text-sm leading-relaxed">
          <section>
            <h3 className="font-bold uppercase mb-4">ANTECEDENTES</h3>
            <p className="text-justify">{novedad.antecedentes || 'Sin información.'}</p>
          </section>

          <section>
            <h3 className="font-bold uppercase mb-4">DESCRIPCIÓN DE LOS HECHOS</h3>
            <p className="text-justify whitespace-pre-wrap">{novedad.descripcionHechos || 'Sin información.'}</p>
          </section>

          <section>
            <h3 className="font-bold uppercase mb-4">ACCIONES TOMADAS</h3>
            <ol className="list-decimal list-inside space-y-2">
              {novedad.accionesTomadas.filter(a => a !== '').length > 0 ? (
                novedad.accionesTomadas.filter(a => a !== '').map((item, i) => (
                  <li key={i}>{item}</li>
                ))
              ) : (
                <li className="list-none text-gray-400 italic">No se registraron acciones.</li>
              )}
            </ol>
          </section>

          <section>
            <h3 className="font-bold uppercase mb-4">RECOMENDACIONES</h3>
            <ol className="list-decimal list-inside space-y-2">
              {novedad.recomendaciones.filter(r => r !== '').length > 0 ? (
                novedad.recomendaciones.filter(r => r !== '').map((item, i) => (
                  <li key={i}>{item}</li>
                ))
              ) : (
                <li className="list-none text-gray-400 italic">No aplica.</li>
              )}
            </ol>
          </section>

          <section>
            <h3 className="font-bold uppercase mb-4">ANEXOS</h3>
            <p className="text-gray-400 italic">No aplica.</p>
          </section>
        </div>

        <div className="mt-32 flex justify-between gap-12 text-xs">
          <div className="text-center flex-1">
            <div className="border-t border-black pt-4">
              <p className="font-bold">FIRMA RESPONSABLE</p>
              <p>{novedad.unidadTurnoNombre}</p>
            </div>
          </div>
          <div className="text-center flex-1">
            <div className="border-t border-black pt-4">
              <p className="font-bold">RECIBE CONFORME</p>
              <p>CLIENTE / ENCARGADO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

