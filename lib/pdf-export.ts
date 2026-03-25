import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportInvoiceToPDF(elementRef: HTMLDivElement | null, invoiceNumber: string) {
  if (!elementRef) {
    console.error('No element reference provided');
    return;
  }

  try {
    // Create canvas from the element
    const canvas = await html2canvas(elementRef, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Calculate PDF dimensions (A4 portrait)
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Add additional pages if content is longer than one page
    let heightLeft = imgHeight - 297; // A4 height in mm
    let position = 0;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    // Download PDF
    pdf.save(`${invoiceNumber || 'Invoice'}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error exporting PDF. Please try again.');
  }
}
