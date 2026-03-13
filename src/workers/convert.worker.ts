import * as pdfjsLib from "pdfjs-dist";
// @ts-expect-error pdfjs-dist does not ship types for the worker module
import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs";

// Run pdfjs in fake-worker mode (avoid nested workers).
// In v5, workerSrc="" no longer works; instead we provide the
// WorkerMessageHandler directly so pdfjs uses in-thread parsing.
(globalThis as Record<string, unknown>).pdfjsWorker = pdfjsWorker;

/**
 * CanvasFactory for Web Worker context.
 * DOMCanvasFactory uses document.createElement("canvas") which is unavailable
 * in workers, so we use OffscreenCanvas instead.
 */
class OffscreenCanvasFactory {
  create(width: number, height: number) {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  }
  reset(
    canvasAndContext: { canvas: OffscreenCanvas },
    width: number,
    height: number
  ) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext: {
    canvas: OffscreenCanvas | null;
    context: OffscreenCanvasRenderingContext2D | null;
  }) {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    }
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

/**
 * No-op FilterFactory for Web Worker context.
 * DOMFilterFactory uses document.createElement which is unavailable in workers.
 * Filters (SVG-based color transforms) are not needed for image export.
 */
class WorkerFilterFactory {
  addFilter() {
    return "none";
  }
  addHCMFilter() {
    return "none";
  }
  addAlphaFilter() {
    return "none";
  }
  addLuminosityFilter() {
    return "none";
  }
  addHighlightHCMFilter() {
    return "none";
  }
  destroy() {}
}

export interface ConvertRequest {
  type: "convert";
  buffer: ArrayBuffer;
  format: string; // "image/png" | "image/jpeg" | "image/webp"
  quality: number;
  scale: number;
}

export type ConvertWorkerMessage =
  | { type: "progress"; currentPage: number; totalPages: number }
  | { type: "page-done"; pageIndex: number; data: ArrayBuffer; mimeType: string }
  | { type: "done"; totalPages: number }
  | { type: "error"; errorKey: string; message: string };

self.onmessage = async (e: MessageEvent<ConvertRequest>) => {
  const { buffer, format, quality, scale } = e.data;

  try {
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
      CanvasFactory: OffscreenCanvasFactory,
      FilterFactory: WorkerFilterFactory,
    }).promise;

    try {
      const totalPages = pdf.numPages;

      if (totalPages < 1) {
        self.postMessage({
          type: "error",
          errorKey: "errors.emptyPdf",
          message: "PDF has no pages",
        } satisfies ConvertWorkerMessage);
        return;
      }

      for (let i = 1; i <= totalPages; i++) {
        self.postMessage({
          type: "progress",
          currentPage: i,
          totalPages,
        } satisfies ConvertWorkerMessage);

        const page = await pdf.getPage(i);

        try {
          const viewport = page.getViewport({ scale });

          const canvas = new OffscreenCanvas(
            Math.floor(viewport.width),
            Math.floor(viewport.height)
          );
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Canvas context unavailable");
          }

          await page.render({
            canvasContext: ctx as unknown as CanvasRenderingContext2D,
            canvas: canvas as unknown as HTMLCanvasElement,
            viewport,
          }).promise;

          const blob = await canvas.convertToBlob({
            type: format,
            quality: format === "image/png" ? undefined : quality,
          });
          const arrayBuffer = await blob.arrayBuffer();

          self.postMessage(
            {
              type: "page-done",
              pageIndex: i - 1,
              data: arrayBuffer,
              mimeType: format,
            } satisfies ConvertWorkerMessage,
            // @ts-expect-error Transferable array
            [arrayBuffer]
          );
        } finally {
          page.cleanup();
        }
      }

      self.postMessage({
        type: "done",
        totalPages,
      } satisfies ConvertWorkerMessage);
    } finally {
      pdf.destroy();
    }
  } catch (error) {
    console.error("[convert.worker] error:", error);
    self.postMessage({
      type: "error",
      errorKey:
        error instanceof Error && error.message.includes("OffscreenCanvas")
          ? "pdfToImage.errors.unsupportedBrowser"
          : "pdfToImage.errors.convertError",
      message: error instanceof Error ? error.message : "Unknown error",
    } satisfies ConvertWorkerMessage);
  }
};
