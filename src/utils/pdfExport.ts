import html2pdf from 'html2pdf.js';

export async function exportResumeToPdf(
  element: HTMLElement,
  filename: string = 'Tailored_Resume.pdf'
): Promise<boolean> {
  if (!element) return false;

  const originalBoxShadow = element.style.boxShadow;
  const originalBorderRadius = element.style.borderRadius;

  try {
    // Temporarily remove decorative framing so the PDF mirrors the ATS layout.
    element.style.boxShadow = 'none';
    element.style.borderRadius = '0';

    const opt = {
      margin: [0.4, 0.45, 0.4, 0.45] as [number, number, number, number], // top, left, bottom, right (inches)
      filename,
      image: { type: 'jpeg' as const, quality: 0.99 },
      html2canvas: {
        scale: 2.5,           // Higher scale = crisper text
        useCORS: true,
        logging: false,
        letterRendering: true,
        windowWidth: 794,     // Matches the resume container max-width exactly
        backgroundColor: '#ffffff',
        imageTimeout: 0,
      },
      jsPDF: {
        unit: 'in' as const,
        format: 'letter' as const,
        orientation: 'portrait' as const,
        compress: true,
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'] as string[],
        before: '.page-break-before',
        after: '.page-break-after',
      },
    };

    await html2pdf().set(opt).from(element).save();

    return true;
  } catch (error) {
    console.error('Error rendering PDF with html2pdf:', error);
    // Fallback: browser print dialog (also picks up @media print styles)
    window.print();
    return false;
  } finally {
    element.style.boxShadow = originalBoxShadow;
    element.style.borderRadius = originalBorderRadius;
  }
}
