import { describe, it, expect } from "vitest";
import { pdfToImageReducer, initialState } from "../usePdfToImageStore";
import type { PdfFile } from "@/types/pdf";

const mockFile: PdfFile = {
  id: "test-id",
  name: "test.pdf",
  size: 1024,
  file: new File(["test"], "test.pdf", { type: "application/pdf" }),
  pageCount: 3,
  pages: [],
  status: "valid",
};

describe("pdfToImageReducer", () => {
  it("returns initial state", () => {
    expect(initialState.file).toBeNull();
    expect(initialState.settings.format).toBe("png");
    expect(initialState.settings.quality).toBe(0.92);
    expect(initialState.settings.scale).toBe(2);
    expect(initialState.convertJob.status).toBe("idle");
    expect(initialState.outputFileName).toBe("pages");
  });

  it("SET_FILE sets the file", () => {
    const state = pdfToImageReducer(initialState, {
      type: "SET_FILE",
      file: mockFile,
    });
    expect(state.file).toEqual(mockFile);
  });

  it("CLEAR_FILE resets file and convert job", () => {
    const withFile = pdfToImageReducer(initialState, {
      type: "SET_FILE",
      file: mockFile,
    });
    const state = pdfToImageReducer(withFile, { type: "CLEAR_FILE" });
    expect(state.file).toBeNull();
    expect(state.convertJob.status).toBe("idle");
  });

  it("SET_SETTINGS updates settings", () => {
    const state = pdfToImageReducer(initialState, {
      type: "SET_SETTINGS",
      settings: { format: "jpeg" },
    });
    expect(state.settings.format).toBe("jpeg");
    expect(state.settings.quality).toBe(0.92); // unchanged
  });

  it("SET_CONVERT_JOB updates convert job partially", () => {
    const state = pdfToImageReducer(initialState, {
      type: "SET_CONVERT_JOB",
      job: { status: "converting", progress: 0.5, currentPage: 2 },
    });
    expect(state.convertJob.status).toBe("converting");
    expect(state.convertJob.progress).toBe(0.5);
    expect(state.convertJob.currentPage).toBe(2);
  });

  it("RESET_CONVERT resets convert job to idle", () => {
    const converting = pdfToImageReducer(initialState, {
      type: "SET_CONVERT_JOB",
      job: { status: "converting", progress: 0.5 },
    });
    const state = pdfToImageReducer(converting, { type: "RESET_CONVERT" });
    expect(state.convertJob.status).toBe("idle");
    expect(state.convertJob.progress).toBe(0);
  });

  it("SET_OUTPUT_FILENAME updates output file name", () => {
    const state = pdfToImageReducer(initialState, {
      type: "SET_OUTPUT_FILENAME",
      name: "my-images",
    });
    expect(state.outputFileName).toBe("my-images");
  });
});
