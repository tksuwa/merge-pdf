import { useCallback, useEffect, useRef } from "react";
import JSZip from "jszip";
import type { ConvertSettings } from "@/types/convert";
import type { PdfFile } from "@/types/pdf";
import type { PdfToImageAction } from "@/hooks/usePdfToImageStore";
import type { ConvertWorkerMessage } from "@/workers/convert.worker";

type ConvertWorkerProgressMessage = Extract<
  ConvertWorkerMessage,
  { type: "progress" }
>;
type ConvertWorkerPageDoneMessage = Extract<
  ConvertWorkerMessage,
  { type: "page-done" }
>;

export interface ConvertWorkerRequest {
  buffer: ArrayBuffer;
  settings: ConvertSettings;
  onProgress: (msg: ConvertWorkerProgressMessage) => void;
  onPageDone: (msg: ConvertWorkerPageDoneMessage) => void;
}

export function createConvertWorker(request: ConvertWorkerRequest) {
  if (typeof Worker === "undefined") {
    throw new Error("pdfToImage.errors.unsupportedBrowser");
  }

  const worker = new Worker(
    new URL("../workers/convert.worker.ts", import.meta.url),
    { type: "module" }
  );

  let resolve: (value: number) => void;
  let reject: (reason: Error) => void;

  const promise = new Promise<number>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  worker.onmessage = (e: MessageEvent<ConvertWorkerMessage>) => {
    const msg = e.data;

    switch (msg.type) {
      case "progress":
        request.onProgress(msg);
        break;

      case "page-done":
        request.onPageDone(msg);
        break;

      case "done":
        worker.terminate();
        resolve(msg.totalPages);
        break;

      case "error":
        worker.terminate();
        reject(new Error(msg.errorKey));
        break;
    }
  };

  worker.onerror = (e) => {
    console.error("[usePdfToImage] worker.onerror:", e.message, e);
    worker.terminate();
    const errorKey =
      e.message?.includes("OffscreenCanvas")
        ? "pdfToImage.errors.unsupportedBrowser"
        : "pdfToImage.errors.convertError";
    reject(new Error(errorKey));
  };

  worker.postMessage(
    {
      type: "convert",
      buffer: request.buffer,
      format: `image/${request.settings.format}`,
      quality: request.settings.quality,
      scale: request.settings.scale,
    },
    [request.buffer]
  );

  const cancel = () => {
    worker.terminate();
    reject(new Error("cancelled"));
  };

  return { promise, cancel };
}

function getConvertErrorKey(error: unknown): string {
  if (!(error instanceof Error)) {
    return "pdfToImage.errors.convertError";
  }

  if (
    error.message === "errors.emptyPdf" ||
    error.message === "pdfToImage.errors.unsupportedBrowser" ||
    error.message === "errors.fileReadError"
  ) {
    return error.message;
  }

  return "pdfToImage.errors.convertError";
}

export function usePdfToImage(dispatch: React.Dispatch<PdfToImageAction>) {
  const cancelRef = useRef<(() => void) | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const convertRunRef = useRef(0);

  const revokeResultUrl = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  }, []);

  const invalidateConvert = useCallback(() => {
    convertRunRef.current += 1;
    cancelRef.current?.();
    cancelRef.current = null;
    revokeResultUrl();
  }, [revokeResultUrl]);

  useEffect(() => {
    return () => {
      invalidateConvert();
    };
  }, [invalidateConvert]);

  const convert = useCallback(
    async (file: PdfFile, settings: ConvertSettings) => {
      const runId = convertRunRef.current + 1;
      convertRunRef.current = runId;
      const isStale = () => convertRunRef.current !== runId;

      revokeResultUrl();

      dispatch({
        type: "SET_CONVERT_JOB",
        job: {
          status: "converting",
          progress: 0,
          currentPage: 0,
          totalPages: 0,
          resultUrl: null,
          errorKey: null,
        },
      });

      try {
        if (file.pageCount < 1) {
          dispatch({
            type: "SET_CONVERT_JOB",
            job: { status: "error", errorKey: "errors.emptyPdf" },
          });
          return;
        }

        let buffer: ArrayBuffer;
        try {
          buffer = await file.file.arrayBuffer();
        } catch {
          if (isStale()) return;
          dispatch({
            type: "SET_CONVERT_JOB",
            job: { status: "error", errorKey: "errors.fileReadError" },
          });
          return;
        }

        if (isStale()) return;

        const zip = new JSZip();
        const padLength = String(file.pageCount).length;

        const { promise, cancel } = createConvertWorker({
          buffer,
          settings,
          onProgress: (msg) => {
            if (isStale()) return;

            dispatch({
              type: "SET_CONVERT_JOB",
              job: {
                progress: (msg.currentPage - 1) / msg.totalPages,
                currentPage: msg.currentPage,
                totalPages: msg.totalPages,
              },
            });
          },
          onPageDone: (msg) => {
            if (isStale()) return;

            const pageNum = String(msg.pageIndex + 1).padStart(padLength, "0");
            zip.file(`page-${pageNum}.${settings.format}`, msg.data);
          },
        });

        if (isStale()) {
          cancel();
          return;
        }

        cancelRef.current = cancel;

        const totalPages = await promise;
        cancelRef.current = null;

        if (isStale()) return;

        if (totalPages < 1) {
          dispatch({
            type: "SET_CONVERT_JOB",
            job: { status: "error", errorKey: "errors.emptyPdf" },
          });
          return;
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);

        if (isStale()) {
          URL.revokeObjectURL(url);
          return;
        }

        resultUrlRef.current = url;

        dispatch({
          type: "SET_CONVERT_JOB",
          job: {
            status: "done",
            progress: 1,
            currentPage: totalPages,
            totalPages,
            resultUrl: url,
            errorKey: null,
          },
        });
      } catch (error) {
        cancelRef.current = null;

        if (isStale()) return;

        if (error instanceof Error && error.message === "cancelled") {
          dispatch({
            type: "SET_CONVERT_JOB",
            job: {
              status: "cancelled",
              progress: 0,
              currentPage: 0,
              totalPages: 0,
              resultUrl: null,
              errorKey: null,
            },
          });
          return;
        }

        dispatch({
          type: "SET_CONVERT_JOB",
          job: {
            status: "error",
            errorKey: getConvertErrorKey(error),
          },
        });
      }
    },
    [dispatch, revokeResultUrl]
  );

  const cancelConvert = useCallback(() => {
    invalidateConvert();
    dispatch({
      type: "SET_CONVERT_JOB",
      job: {
        status: "cancelled",
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        resultUrl: null,
        errorKey: null,
      },
    });
  }, [dispatch, invalidateConvert]);

  return { convert, cancelConvert, invalidateConvert };
}
