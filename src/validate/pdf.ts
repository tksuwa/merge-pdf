import { PDFDocument, ParseSpeeds } from "pdf-lib";

export const MIN_PDF_FILES = 1;
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
export const WARN_TOTAL_SIZE = 45 * 1024 * 1024; // 45MB
export const MAX_TOTAL_PAGES = 500;

const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface PdfFileValidationResult {
  status: "valid" | "encrypted" | "corrupted" | "loading";
  pageCount: number;
  errorKey?: string;
}

export interface ValidatePdfFilesOptions {
  skipMinFileCount?: boolean;
}

export function validatePdfFiles(
  files: File[],
  options: ValidatePdfFilesOptions = {}
): PdfValidationResult {
  if (!options.skipMinFileCount && files.length < MIN_PDF_FILES) {
    return { isValid: false, error: "errors.selectPdf" };
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (totalSize > MAX_TOTAL_SIZE) {
    return { isValid: false, error: "errors.totalSizeExceeded" };
  }

  if (totalSize > WARN_TOTAL_SIZE) {
    return { isValid: true, warning: "warnings.nearSizeLimit" };
  }

  return { isValid: true };
}

function hasPdfMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC_BYTES.length) return false;
  return PDF_MAGIC_BYTES.every((b, i) => bytes[i] === b);
}

export async function validatePdfFile(
  file: File
): Promise<PdfFileValidationResult> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check magic bytes
    if (!hasPdfMagicBytes(bytes)) {
      return { status: "corrupted", pageCount: 0, errorKey: "errors.notPdf" };
    }

    // Full parse to check validity and get page count
    const pdf = await PDFDocument.load(buffer, {
      parseSpeed: ParseSpeeds.Fastest,
    });
    const pageCount = pdf.getPageCount();

    if (pageCount < 1) {
      return {
        status: "corrupted",
        pageCount: 0,
        errorKey: "errors.emptyPdf",
      };
    }

    return { status: "valid", pageCount };
  } catch (error: unknown) {
    // Check for encrypted PDF via pdf-lib error
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name: string }).name === "EncryptedPDFError"
    ) {
      return {
        status: "encrypted",
        pageCount: 0,
        errorKey: "errors.encrypted",
      };
    }

    return { status: "corrupted", pageCount: 0, errorKey: "errors.corrupted" };
  }
}
