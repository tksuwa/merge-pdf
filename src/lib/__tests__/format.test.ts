import { describe, it, expect } from "vitest";
import { formatFileSize } from "@/lib/format";

describe("formatFileSize", () => {
  it("0 bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("KB", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });

  it("KB with decimals", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("MB", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
  });

  it("large MB", () => {
    expect(formatFileSize(50 * 1024 * 1024)).toBe("50.0 MB");
  });
});
