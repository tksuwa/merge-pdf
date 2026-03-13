import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePdfToImage } from "@/hooks/usePdfToImage";
import type { PdfToImageAction } from "@/hooks/usePdfToImageStore";
import type { PdfFile } from "@/types/pdf";
import type { ConvertWorkerMessage } from "@/workers/convert.worker";

const { MockZip, zipInstances } = vi.hoisted(() => {
  const zipInstances: {
    file: ReturnType<typeof vi.fn>;
    generateAsync: ReturnType<typeof vi.fn>;
  }[] = [];

  class MockZip {
    file = vi.fn(() => this);
    generateAsync = vi.fn(async () => new Blob(["zip"]));

    constructor() {
      zipInstances.push(this);
    }
  }

  return { MockZip, zipInstances };
});

vi.mock("jszip", () => ({
  default: MockZip,
}));

const workerInstances: MockWorker[] = [];

class MockWorker {
  onmessage: ((e: MessageEvent<ConvertWorkerMessage>) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  terminated = false;
  postedMessage: unknown = null;

  constructor() {
    workerInstances.push(this);
  }

  postMessage(data: unknown) {
    this.postedMessage = data;
  }

  terminate() {
    this.terminated = true;
  }

  emit(message: ConvertWorkerMessage) {
    this.onmessage?.(new MessageEvent("message", { data: message }));
  }
}

function createPdfFile(name: string, pageCount = 2): PdfFile {
  return {
    id: `${name}-id`,
    name,
    size: 100,
    file: {
      arrayBuffer: vi.fn(async () => new ArrayBuffer(16)),
    } as unknown as File,
    pageCount,
    pages: [],
    status: "valid",
  };
}

describe("usePdfToImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workerInstances.length = 0;
    zipInstances.length = 0;

    vi.stubGlobal("Worker", MockWorker);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:zip-result");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("streams worker page output into the zip before completion", async () => {
    const dispatch = vi.fn<(action: PdfToImageAction) => void>();
    const { result } = renderHook(() => usePdfToImage(dispatch));

    const convertPromise = result.current.convert(createPdfFile("sample.pdf"), {
      format: "png",
      quality: 0.92,
      scale: 1,
    });

    await waitFor(() => expect(workerInstances).toHaveLength(1));
    await waitFor(() => expect(zipInstances).toHaveLength(1));

    expect(workerInstances[0].postedMessage).toEqual(
      expect.objectContaining({
        type: "convert",
        format: "image/png",
        quality: 0.92,
        scale: 1,
      })
    );

    await act(async () => {
      workerInstances[0].emit({
        type: "progress",
        currentPage: 1,
        totalPages: 2,
      });
      workerInstances[0].emit({
        type: "page-done",
        pageIndex: 0,
        data: new ArrayBuffer(8),
        mimeType: "image/png",
      });
    });

    expect(zipInstances[0].file).toHaveBeenCalledTimes(1);
    expect(zipInstances[0].file).toHaveBeenNthCalledWith(
      1,
      "page-1.png",
      expect.any(ArrayBuffer)
    );
    expect(zipInstances[0].generateAsync).not.toHaveBeenCalled();

    await act(async () => {
      workerInstances[0].emit({
        type: "progress",
        currentPage: 2,
        totalPages: 2,
      });
      workerInstances[0].emit({
        type: "page-done",
        pageIndex: 1,
        data: new ArrayBuffer(12),
        mimeType: "image/png",
      });
      workerInstances[0].emit({
        type: "done",
        totalPages: 2,
      });
      await convertPromise;
    });

    expect(zipInstances[0].file).toHaveBeenCalledTimes(2);
    expect(zipInstances[0].generateAsync).toHaveBeenCalledTimes(1);
    expect(workerInstances[0].terminated).toBe(true);
    expect(dispatch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: "SET_CONVERT_JOB",
        job: expect.objectContaining({
          status: "done",
          progress: 1,
          resultUrl: "blob:zip-result",
        }),
      })
    );
  });

  it("rejects empty PDFs before starting a worker", async () => {
    const dispatch = vi.fn<(action: PdfToImageAction) => void>();
    const { result } = renderHook(() => usePdfToImage(dispatch));

    await act(async () => {
      await result.current.convert(createPdfFile("empty.pdf", 0), {
        format: "png",
        quality: 0.92,
        scale: 1,
      });
    });

    expect(workerInstances).toHaveLength(0);
    expect(dispatch).toHaveBeenLastCalledWith({
      type: "SET_CONVERT_JOB",
      job: { status: "error", errorKey: "errors.emptyPdf" },
    });
  });
});
