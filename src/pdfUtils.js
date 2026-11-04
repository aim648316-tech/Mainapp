import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateBillPDF(element, fileName) {
  // સ્ક્રીન પરના વધારાના બટનો છુપાવો જેથી PDF માં ન છપાય
  const buttons = element.querySelectorAll('button, .no-print');
  buttons.forEach(btn => btn.style.display = 'none');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 800
  });

  // બટનો પાછા લાવો
  buttons.forEach(btn => btn.style.display = '');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;

  const maxWidth = pageWidth - (margin * 2);
  const maxHeight = pageHeight - (margin * 2);

  // ૧ સિંગલ A4 પેજમાં ઓટો-ફિટિંગ
  const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;

  const xOffset = margin + (maxWidth - imgWidth) / 2;
  const yOffset = margin;

  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

  pdf.save(fileName);
  return pdf;
}

export async function generateBillPDFBlob(element) {
  const buttons = element.querySelectorAll('button, .no-print');
  buttons.forEach(btn => btn.style.display = 'none');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 800
  });

  buttons.forEach(btn => btn.style.display = '');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;

  const maxWidth = pageWidth - (margin * 2);
  const maxHeight = pageHeight - (margin * 2);

  const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;

  const xOffset = margin + (maxWidth - imgWidth) / 2;
  const yOffset = margin;

  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

  return pdf.output('blob');
}

export async function sharePDFFile(element, fileName, fallbackMessage) {
  const blob = await generateBillPDFBlob(element);
  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Bill',
        text: fallbackMessage || '',
      });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return true;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return false;
}
