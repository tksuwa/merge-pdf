import { PDFDocument, ParseSpeeds, degrees } from "pdf-lib";

export interface WorkerMergeRequest {
  type: "merge";
  files: {
    name: string;
    buffer: ArrayBuffer;
    pageIndices: number[];
    rotations: number[];
  }[];
  metadata: {
    title: string;
    creator: string;
  };
}

export type WorkerMessage =
  | { type: "progress"; progress: number; currentFileName: string }
  | { type: "done"; result: ArrayBuffer }
  | { type: "error"; errorKey: string; message: string };

self.onmessage = async (e: MessageEvent<WorkerMergeRequest>) => {
  const { files, metadata } = e.data;

  try {
    const mergedPdf = await PDFDocument.create();
    mergedPdf.setTitle(metadata.title);
    mergedPdf.setCreator(metadata.creator);
    mergedPdf.setCreationDate(new Date());
    mergedPdf.setModificationDate(new Date());

    const totalPages = files.reduce(
      (sum, f) => sum + f.pageIndices.length,
      0
    );
    let processedPages = 0;

    for (const fileData of files) {
      self.postMessage({
        type: "progress",
        progress: processedPages / totalPages,
        currentFileName: fileData.name,
      } satisfies WorkerMessage);

      let sourcePdf: PDFDocument;
      try {
        sourcePdf = await PDFDocument.load(fileData.buffer, {
          parseSpeed: ParseSpeeds.Fastest,
        });
      } catch {
        self.postMessage({
          type: "error",
          errorKey: "errors.corrupted",
          message: `Failed to load: ${fileData.name}`,
        } satisfies WorkerMessage);
        return;
      }

      const copiedPages = await mergedPdf.copyPages(
        sourcePdf,
        fileData.pageIndices
      );

      for (let i = 0; i < copiedPages.length; i++) {
        const page = copiedPages[i];
        const rotation = fileData.rotations[i] ?? 0;
        if (rotation !== 0) {
          page.setRotation(degrees(rotation));
        }
        mergedPdf.addPage(page);
        processedPages++;
      }

      // Release reference to source PDF for GC
      // (sourcePdf goes out of scope here)
    }

    self.postMessage({
      type: "progress",
      progress: 1,
      currentFileName: "",
    } satisfies WorkerMessage);

    const resultBytes = await mergedPdf.save();
    const buffer = resultBytes.buffer as ArrayBuffer;

    self.postMessage(
      { type: "done", result: buffer } satisfies WorkerMessage,
      // @ts-expect-error Transferable array
      [buffer]
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      errorKey: "errors.mergeError",
      message: error instanceof Error ? error.message : "Unknown error",
    } satisfies WorkerMessage);
  }
};
