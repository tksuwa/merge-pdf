import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PdfToImage } from "@/components/pdf-to-image";
import type { PdfToImageState } from "@/types/convert";
import type { PdfToImageAction } from "@/hooks/usePdfToImageStore";

const {
  cancelConvert,
  convert,
  dispatch,
  invalidateConvert,
  mockStore,
  validatePdfFile,
  validatePdfFiles,
} = vi.hoisted(() => ({
  cancelConvert: vi.fn(),
  convert: vi.fn(),
  dispatch: vi.fn<(action: PdfToImageAction) => void>(),
  invalidateConvert: vi.fn(),
  mockStore: {
    state: null as PdfToImageState | null,
  },
  validatePdfFile: vi.fn(),
  validatePdfFiles: vi.fn(),
}));

let capturedOnDrop: ((acceptedFiles: File[]) => Promise<void>) | undefined;

vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, values?: Record<string, string | number>) =>
      values && "max" in values ? `${key}:${values.max}` : key,
}));

vi.mock("react-dropzone", () => ({
  useDropzone: ({ onDrop }: { onDrop: (files: File[]) => Promise<void> }) => {
    capturedOnDrop = onDrop;
    return {
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
    };
  },
}));

vi.mock("@/validate/pdf", () => ({
  validatePdfFile,
  validatePdfFiles,
  MAX_TOTAL_PAGES: 500,
}));

vi.mock("@/hooks/usePdfToImageStore", () => ({
  usePdfToImageStore: () => ({
    state: mockStore.state,
    dispatch,
  }),
}));

vi.mock("@/hooks/usePdfToImage", () => ({
  usePdfToImage: () => ({
    convert,
    cancelConvert,
    invalidateConvert,
  }),
}));

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;

  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

function createState(
  overrides: Partial<PdfToImageState> = {}
): PdfToImageState {
  return {
    file: {
      id: "existing-file",
      name: "existing.pdf",
      size: 100,
      file: new File(["existing"], "existing.pdf", {
        type: "application/pdf",
      }),
      pageCount: 1,
      pages: [],
      status: "valid",
    },
    settings: {
      format: "png",
      quality: 0.92,
      scale: 2,
    },
    convertJob: {
      status: "converting",
      progress: 0.5,
      currentPage: 1,
      totalPages: 2,
      resultUrl: null,
      errorKey: null,
    },
    outputFileName: "pages",
    ...overrides,
  };
}

describe("PdfToImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnDrop = undefined;
    mockStore.state = createState();
    validatePdfFiles.mockReturnValue({ isValid: true });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("cancels an active conversion before accepting a replacement file", async () => {
    validatePdfFile.mockResolvedValue({
      status: "valid",
      pageCount: 3,
    });

    vi.spyOn(crypto, "randomUUID").mockReturnValue("replacement-file");

    render(<PdfToImage />);

    expect(capturedOnDrop).toBeTypeOf("function");

    await act(async () => {
      await capturedOnDrop?.([
        new File(["replacement"], "replacement.pdf", {
          type: "application/pdf",
        }),
      ]);
    });

    const setFileCall = dispatch.mock.calls.find(
      ([action]) => action.type === "SET_FILE"
    )?.[0];

    expect(cancelConvert).toHaveBeenCalledTimes(1);
    expect(invalidateConvert).not.toHaveBeenCalled();
    expect(setFileCall).toEqual(
      expect.objectContaining({
        type: "SET_FILE",
        file: expect.objectContaining({
          id: "replacement-file",
          name: "replacement.pdf",
          pageCount: 3,
        }),
      })
    );
    expect(cancelConvert.mock.invocationCallOrder[0]).toBeLessThan(
      dispatch.mock.invocationCallOrder[0]
    );
  });

  it("ignores an older validation result when a newer file is dropped", async () => {
    const firstValidation = createDeferred<{ status: "valid"; pageCount: number }>();
    const secondValidation =
      createDeferred<{ status: "valid"; pageCount: number }>();

    mockStore.state = createState({
      file: null,
      convertJob: {
        status: "idle",
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        resultUrl: null,
        errorKey: null,
      },
    });

    validatePdfFile
      .mockReturnValueOnce(firstValidation.promise)
      .mockReturnValueOnce(secondValidation.promise);

    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("first-file")
      .mockReturnValueOnce("second-file");

    render(<PdfToImage />);

    const firstDropPromise = capturedOnDrop?.([
      new File(["first"], "first.pdf", {
        type: "application/pdf",
      }),
    ]);
    const secondDropPromise = capturedOnDrop?.([
      new File(["second"], "second.pdf", {
        type: "application/pdf",
      }),
    ]);

    await act(async () => {
      secondValidation.resolve({ status: "valid", pageCount: 2 });
      await secondDropPromise;
    });

    await act(async () => {
      firstValidation.resolve({ status: "valid", pageCount: 1 });
      await firstDropPromise;
    });

    const setFileCalls = dispatch.mock.calls
      .map(([action]) => action)
      .filter((action) => action.type === "SET_FILE");

    expect(setFileCalls).toHaveLength(1);
    expect(setFileCalls[0]).toEqual(
      expect.objectContaining({
        type: "SET_FILE",
        file: expect.objectContaining({
          name: "second.pdf",
          pageCount: 2,
        }),
      })
    );
  });

  it("clears the previous selection before showing a replacement-file error", async () => {
    mockStore.state = createState({
      convertJob: {
        status: "done",
        progress: 1,
        currentPage: 1,
        totalPages: 1,
        resultUrl: "blob:previous-result",
        errorKey: null,
      },
    });

    validatePdfFile.mockResolvedValue({
      status: "corrupted",
      pageCount: 0,
      errorKey: "errors.notPdf",
    });

    render(<PdfToImage />);

    await act(async () => {
      await capturedOnDrop?.([
        new File(["broken"], "broken.pdf", {
          type: "application/pdf",
        }),
      ]);
    });

    expect(cancelConvert).not.toHaveBeenCalled();
    expect(invalidateConvert).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenNthCalledWith(1, { type: "CLEAR_FILE" });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: "SET_CONVERT_JOB",
      job: {
        status: "error",
        errorKey: "errors.notPdf",
      },
    });
  });

  it("rejects files that exceed the repository size limit before validation", async () => {
    validatePdfFiles.mockReturnValue({
      isValid: false,
      error: "errors.totalSizeExceeded",
    });

    render(<PdfToImage />);

    await act(async () => {
      await capturedOnDrop?.([
        new File(["too-big"], "too-big.pdf", {
          type: "application/pdf",
        }),
      ]);
    });

    expect(validatePdfFile).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenNthCalledWith(1, { type: "CLEAR_FILE" });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: "SET_CONVERT_JOB",
      job: {
        status: "error",
        errorKey: "errors.totalSizeExceeded",
      },
    });
  });

  it("rejects files whose page count exceeds the repository limit", async () => {
    const randomUuidSpy = vi.spyOn(crypto, "randomUUID");

    validatePdfFile.mockResolvedValue({
      status: "valid",
      pageCount: 501,
    });

    render(<PdfToImage />);

    await act(async () => {
      await capturedOnDrop?.([
        new File(["many-pages"], "many-pages.pdf", {
          type: "application/pdf",
        }),
      ]);
    });

    const setFileCall = dispatch.mock.calls.find(
      ([action]) => action.type === "SET_FILE"
    );

    expect(randomUuidSpy).not.toHaveBeenCalled();
    expect(setFileCall).toBeUndefined();
    expect(dispatch).toHaveBeenNthCalledWith(1, { type: "CLEAR_FILE" });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: "SET_CONVERT_JOB",
      job: {
        status: "error",
        errorKey: "errors.totalPagesExceeded",
      },
    });
  });

  it("invalidates stale conversion output when settings change", () => {
    mockStore.state = createState({
      settings: {
        format: "png",
        quality: 0.92,
        scale: 2,
      },
      convertJob: {
        status: "done",
        progress: 1,
        currentPage: 1,
        totalPages: 1,
        resultUrl: "blob:previous-result",
        errorKey: null,
      },
    });

    const view = render(<PdfToImage />);

    fireEvent.click(
      within(view.container).getAllByRole("button", { name: "JPEG" })[0]
    );

    expect(cancelConvert).not.toHaveBeenCalled();
    expect(invalidateConvert).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: "SET_SETTINGS",
      settings: { format: "jpeg" },
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: "RESET_CONVERT" });
  });

  it("renders the page limit value in the oversized PDF error message", () => {
    mockStore.state = createState({
      convertJob: {
        status: "error",
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        resultUrl: null,
        errorKey: "errors.totalPagesExceeded",
      },
    });

    render(<PdfToImage />);

    expect(screen.getByText("errors.totalPagesExceeded:500")).toBeInTheDocument();
  });
});
