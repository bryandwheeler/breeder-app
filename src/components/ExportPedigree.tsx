// src/components/ExportPedigree.tsx
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PedigreeTree } from './PedigreeTree';

export function ExportPedigree({ dogId }: { dogId: string }) {
  const exportPDF = async () => {
    const element = document.getElementById(`pedigree-${dogId}`);
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 10, 10, width - 20, height - 20);
    pdf.setFontSize(20);
    pdf.text('5-Generation Pedigree', width / 2, 15, { align: 'center' });
    pdf.save('pedigree.pdf');
  };

  return (
    <Button onClick={exportPDF} variant='outline' size='sm'>
      <Download className='mr-2 h-4 w-4' /> Export PDF
    </Button>
  );
}
