export const MIN_PDF_FILES = 2;

export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePdfFiles(files: File[]): PdfValidationResult {
  if (files.length < MIN_PDF_FILES) {
    return {
      isValid: false,
      error: "errors.selectPdf",
    };
  }

  return { isValid: true };
}