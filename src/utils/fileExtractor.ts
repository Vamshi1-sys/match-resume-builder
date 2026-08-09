import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdf.js worker using jsdelivr CDN matching the exact pdfjsLib.version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ExtractionResult {
  success: boolean;
  text?: string;
  wordCount?: number;
  fileName?: string;
  errorMessage?: string;
}

/**
 * Validates whether extracted text is human readable and not raw PDF/DOCX binary noise.
 */
export function validateExtractedText(rawText: string, fileName: string): ExtractionResult {
  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      errorMessage: `We couldn't read "${fileName}" properly. Please try uploading a different PDF/DOCX, or paste your resume text directly into the box.`
    };
  }

  const text = rawText.trim();

  // Check 1: Detect raw PDF syntax / binary streams
  const pdfSyntaxRegex = /(%PDF-|\b\d+\s+\d+\s+obj\b|\bendobj\b|\bstream\b|\bendstream\b|\/XObject|\/Font|\/FlateDecode)/i;
  if (pdfSyntaxRegex.test(text)) {
    return {
      success: false,
      errorMessage: `We couldn't read "${fileName}" properly. The extracted text contains raw PDF internal syntax. Please paste your resume text directly into the box.`
    };
  }

  // Check 2: Check printable character ratio (at least 80% printable characters)
  let printableCount = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13 || code >= 160) {
      printableCount++;
    }
  }

  const printableRatio = printableCount / text.length;
  if (printableRatio < 0.80) {
    return {
      success: false,
      errorMessage: `We couldn't read "${fileName}" properly. The extracted output contained garbled symbols. Please paste your text directly into the box.`
    };
  }

  // Check 3: Check word count (must be meaningful text, at least 10 words)
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 10) {
    return {
      success: false,
      errorMessage: `Extracted only ${words.length} words from "${fileName}". This is too short. If this is a scanned document, please paste your text directly into the box.`
    };
  }

  return {
    success: true,
    text,
    wordCount: words.length,
    fileName
  };
}

/**
 * PDF Text Extraction using pdfjs-dist
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  const trimmed = fullText.trim();
  console.log("Extracted PDF Text:", trimmed);
  return trimmed;
}

/**
 * DOCX Text Extraction using mammoth.js
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = (result.value || '').trim();
  console.log("Extracted DOCX Text:", text);
  return text;
}

/**
 * Main file extraction entrypoint
 */
export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const fileName = file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

  try {
    let extractedText = '';
    if (fileExt === 'pdf') {
      extractedText = await extractTextFromPDF(file);
    } else if (fileExt === 'docx' || fileExt === 'doc') {
      extractedText = await extractTextFromDocx(file);
    } else {
      // Plain text files (.txt)
      extractedText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string || '').trim());
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
      });
    }

    return validateExtractedText(extractedText, fileName);
  } catch (err: any) {
    console.error(`Error extracting file ${fileName}:`, err);
    return {
      success: false,
      errorMessage: `We couldn't read "${fileName}" properly (${err?.message || 'Read error'}). Please try uploading a different PDF/DOCX, or paste your resume text directly into the box.`
    };
  }
}

