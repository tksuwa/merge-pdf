export type ImageFormat = "png" | "jpeg" | "webp";

export interface ConvertSettings {
  format: ImageFormat;
  quality: number; // 0.1 - 1.0
  scale: 1 | 2 | 3;
}

export interface ConvertJob {
  status: "idle" | "converting" | "done" | "error" | "cancelled";
  progress: number; // 0.0 - 1.0
  currentPage: number;
  totalPages: number;
  resultUrl: string | null;
  errorKey: string | null;
}

export interface PdfToImageState {
  file: import("@/types/pdf").PdfFile | null;
  settings: ConvertSettings;
  convertJob: ConvertJob;
  outputFileName: string;
}
