import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock pdfjs-dist
const mockRender = vi.fn(() => ({ promise: Promise.resolve() }));
const mockGetPage = vi.fn(() =>
  Promise.resolve({
    getViewport: vi.fn(({ scale }: { scale: number }) => ({
      width: 595 * scale,
      height: 842 * scale,
    })),
    render: mockRender,
  })
);
const mockDestroy = vi.fn();

vi.mock("pdfjs-dist", () => ({
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      getPage: mockGetPage,
      numPages: 3,
      destroy: mockDestroy,
    }),
  })),
  GlobalWorkerOptions: { workerSrc: "" },
}));

// Mock canvas toDataURL since jsdom doesn't support it
const mockToDataURL = vi.fn(() => "data:image/png;base64,mock");
const mockGetContext = vi.fn(() => ({}));

vi.stubGlobal("document", {
  ...document,
  createElement: vi.fn((tag: string) => {
    if (tag === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext: mockGetContext,
        toDataURL: mockToDataURL,
      };
    }
    return document.createElement(tag);
  }),
});

import { renderThumbnail } from "@/hooks/usePdfThumbnail";

describe("renderThumbnail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pdfjs でページを取得し canvas に描画して data URL を返す", async () => {
    const buffer = new ArrayBuffer(10);
    const result = await renderThumbnail(buffer, 0, 150);

    expect(result).toBe("data:image/png;base64,mock");
    // getPage is called with 1-indexed page number
    expect(mockGetPage).toHaveBeenCalledWith(1);
    expect(mockRender).toHaveBeenCalled();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("指定ページのサムネイルを生成する", async () => {
    const buffer = new ArrayBuffer(10);
    await renderThumbnail(buffer, 2, 150);

    expect(mockGetPage).toHaveBeenCalledWith(3); // 0-indexed -> 1-indexed
  });
});
