import { useCallback, useEffect, useRef } from "react";
import type { PdfFile } from "@/types/pdf";
import type { PdfAction } from "@/hooks/usePdfStore";
import type { WorkerMessage } from "@/workers/merge.worker";

const MERGE_TIMEOUT = 60_000; // 60 seconds

export interface MergeWorkerMessage {
  type: "progress" | "done" | "error";
  progress?: number;
  currentFileName?: string;
}

export interface MergeFileBuffer {
  name: string;
  buffer: ArrayBuffer;
  pageIndices: number[];
  rotations: number[];
}

export interface MergeRequest {
  fileBuffers: MergeFileBuffer[];
  outputFileName: string;
  onProgress: (msg: MergeWorkerMessage) => void;
}

export function createMergeWorker(request: MergeRequest) {
  const worker = new Worker(
    new URL("../workers/merge.worker.ts", import.meta.url),
    { type: "module" }
  );

  let resolve: (value: ArrayBuffer) => void;
  let reject: (reason: Error) => void;

  const promise = new Promise<ArrayBuffer>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const timeout = setTimeout(() => {
    worker.terminate();
    reject(new Error("Merge timed out"));
  }, MERGE_TIMEOUT);

  worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const msg = e.data;

    switch (msg.type) {
      case "progress":
        request.onProgress({
          type: "progress",
          progress: msg.progress,
          currentFileName: msg.currentFileName,
        });
        break;

      case "done":
        clearTimeout(timeout);
        worker.terminate();
        resolve(msg.result);
        break;

      case "error":
        clearTimeout(timeout);
        worker.terminate();
        reject(new Error(msg.errorKey));
        break;
    }
  };

  worker.onerror = (e) => {
    clearTimeout(timeout);
    worker.terminate();
    reject(new Error(e.message || "Worker error"));
  };

  worker.postMessage({
    type: "merge",
    files: request.fileBuffers.map((f) => ({
      name: f.name,
      buffer: f.buffer,
      pageIndices: f.pageIndices,
      rotations: f.rotations,
    })),
    metadata: {
      title: request.outputFileName,
      creator: "PDF Merger",
    },
  });

  const cancel = () => {
    clearTimeout(timeout);
    worker.terminate();
    reject(new Error("cancelled"));
  };

  return { promise, cancel };
}

export function usePdfMerge(dispatch: React.Dispatch<PdfAction>) {
  const cancelRef = useRef<(() => void) | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const mergeRunRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mergeRunRef.current += 1;
      cancelRef.current?.();
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }
    };
  }, []);

  const merge = useCallback(
    async (files: PdfFile[], outputFileName: string) => {
      const runId = mergeRunRef.current + 1;
      mergeRunRef.current = runId;
      const isStale = () => mergeRunRef.current !== runId;

      // Revoke previous result URL
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
        resultUrlRef.current = null;
      }

      dispatch({
        type: "SET_MERGE_JOB",
        job: {
          status: "merging",
          progress: 0,
          currentFileName: null,
          resultUrl: null,
          errorKey: null,
        },
      });

      try {
        // Read file buffers on main thread
        let fileBuffers: MergeFileBuffer[];
        try {
          fileBuffers = await Promise.all(
            files.map(async (f) => {
              const buffer = await f.file.arrayBuffer();
              const includedPages = f.pages.filter((p) => p.included);
              return {
                name: f.name,
                buffer,
                pageIndices: includedPages.map((p) => p.originalIndex),
                rotations: includedPages.map((p) => p.rotation),
              };
            })
          );
        } catch {
          if (isStale()) {
            return;
          }
          dispatch({
            type: "SET_MERGE_JOB",
            job: {
              status: "error",
              errorKey: "errors.fileReadError",
            },
          });
          return;
        }

        if (isStale()) {
          return;
        }

        const { promise, cancel } = createMergeWorker({
          fileBuffers,
          outputFileName,
          onProgress: (msg) => {
            if (msg.type === "progress" && !isStale()) {
              dispatch({
                type: "SET_MERGE_JOB",
                job: {
                  progress: msg.progress ?? 0,
                  currentFileName: msg.currentFileName ?? null,
                },
              });
            }
          },
        });

        if (isStale()) {
          cancel();
          return;
        }

        cancelRef.current = cancel;

        const resultBuffer = await promise;
        cancelRef.current = null;

        if (isStale()) {
          return;
        }

        const blob = new Blob([resultBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;

        dispatch({
          type: "SET_MERGE_JOB",
          job: {
            status: "done",
            progress: 1,
            currentFileName: null,
            resultUrl: url,
            errorKey: null,
          },
        });
      } catch (error) {
        cancelRef.current = null;

        if (isStale()) {
          return;
        }

        if (
          error instanceof Error &&
          error.message === "cancelled"
        ) {
          dispatch({
            type: "SET_MERGE_JOB",
            job: { status: "cancelled" },
          });
          return;
        }

        dispatch({
          type: "SET_MERGE_JOB",
          job: {
            status: "error",
            errorKey:
              error instanceof Error
                ? error.message
                : "errors.mergeError",
          },
        });
      }
    },
    [dispatch]
  );

  const cancelMerge = useCallback(() => {
    mergeRunRef.current += 1;
    cancelRef.current?.();
    cancelRef.current = null;
    dispatch({
      type: "SET_MERGE_JOB",
      job: { status: "cancelled", currentFileName: null },
    });
  }, [dispatch]);

  return { merge, cancelMerge };
}
