export type FileId = string; // crypto.randomUUID()
export type Rotation = 0 | 90 | 180 | 270;

export interface PdfFile {
  id: FileId;
  name: string;
  size: number;
  file: File;
  pageCount: number;
  pages: PdfPage[];
  status: "valid" | "encrypted" | "corrupted" | "loading";
  errorKey?: string;
}

export interface PdfPage {
  id: string; // `${fileId}-page-${index}`
  fileId: FileId;
  originalIndex: number;
  rotation: Rotation;
  thumbnailUrl: string | null;
  included: boolean;
}

export interface MergeJob {
  status: "idle" | "merging" | "done" | "error" | "cancelled";
  progress: number; // 0.0 - 1.0
  currentFileName: string | null;
  resultUrl: string | null;
  errorKey: string | null;
}

export interface PdfMergerState {
  files: PdfFile[];
  pageOrder: string[]; // PageId[]
  viewMode: "file" | "page";
  mergeJob: MergeJob;
  outputFileName: string;
  warningKey: string | null;
}
