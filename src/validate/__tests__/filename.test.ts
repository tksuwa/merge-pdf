import { describe, it, expect } from "vitest";
import {
  validateFilename,
  MAX_FILENAME_LENGTH,
} from "@/validate/filename";

describe("validateFilename", () => {
  it("有効なファイル名を受け入れる", () => {
    expect(validateFilename("merged")).toEqual({ isValid: true });
  });

  it("長すぎるファイル名を拒否する", () => {
    const longName = "a".repeat(MAX_FILENAME_LENGTH + 1);
    const result = validateFilename(longName);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("errors.fileNameTooLong");
  });

  it("空文字を拒否する", () => {
    const result = validateFilename("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("errors.fileNameEmpty");
  });

  it("OS禁止文字を拒否する", () => {
    const forbidden = ["/", "\\", ":", "*", "?", '"', "<", ">", "|"];
    for (const char of forbidden) {
      const result = validateFilename(`file${char}name`);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("errors.fileNameForbiddenChars");
    }
  });
});
