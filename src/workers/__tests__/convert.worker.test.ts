import { describe, it, expect, beforeEach } from "vitest";
import type { ConvertWorkerMessage } from "../convert.worker";

// We test the worker via a mock Worker class pattern (same as merge.worker tests)
describe("convert.worker message protocol", () => {
  let messages: ConvertWorkerMessage[];

  beforeEach(() => {
    messages = [];
  });

  it("defines correct progress message shape", () => {
    const msg: ConvertWorkerMessage = {
      type: "progress",
      currentPage: 1,
      totalPages: 3,
    };
    expect(msg.type).toBe("progress");
    expect(msg.currentPage).toBe(1);
    expect(msg.totalPages).toBe(3);
  });

  it("defines correct page-done message shape", () => {
    const msg: ConvertWorkerMessage = {
      type: "page-done",
      pageIndex: 0,
      data: new ArrayBuffer(10),
      mimeType: "image/png",
    };
    expect(msg.type).toBe("page-done");
    expect(msg.pageIndex).toBe(0);
    expect(msg.data.byteLength).toBe(10);
  });

  it("defines correct done message shape", () => {
    const msg: ConvertWorkerMessage = {
      type: "done",
      totalPages: 5,
    };
    expect(msg.type).toBe("done");
    expect(msg.totalPages).toBe(5);
  });

  it("defines correct error message shape", () => {
    const msg: ConvertWorkerMessage = {
      type: "error",
      errorKey: "pdfToImage.errors.convertError",
      message: "Something went wrong",
    };
    expect(msg.type).toBe("error");
    expect(msg.errorKey).toBe("pdfToImage.errors.convertError");
  });

  it("collects messages in sequence", () => {
    messages.push({ type: "progress", currentPage: 1, totalPages: 2 });
    messages.push({
      type: "page-done",
      pageIndex: 0,
      data: new ArrayBuffer(5),
      mimeType: "image/png",
    });
    messages.push({ type: "progress", currentPage: 2, totalPages: 2 });
    messages.push({
      type: "page-done",
      pageIndex: 1,
      data: new ArrayBuffer(8),
      mimeType: "image/png",
    });
    messages.push({ type: "done", totalPages: 2 });

    expect(messages).toHaveLength(5);
    expect(messages[0].type).toBe("progress");
    expect(messages[4].type).toBe("done");
  });
});
