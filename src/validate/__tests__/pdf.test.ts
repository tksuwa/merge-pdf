import { describe, it, expect, vi, afterEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  validatePdfFiles,
  validatePdfFile,
  MAX_TOTAL_SIZE,
  WARN_TOTAL_SIZE,
  MAX_TOTAL_PAGES,
} from "@/validate/pdf";

function createFakeFile(name: string, size: number): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type: "application/pdf" });
}

function createPdfFile(name: string, size: number): File {
  // Create a minimal valid PDF with %PDF- magic bytes
  const header = new TextEncoder().encode("%PDF-1.4\n");
  const rest = new Uint8Array(Math.max(0, size - header.length));
  return new File([header, rest], name, { type: "application/pdf" });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("validatePdfFiles", () => {
  it("ファイル数が1未満なら拒否する", () => {
    const result = validatePdfFiles([]);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("errors.selectPdf");
  });

  it("合計50MB超なら拒否する", () => {
    const bigFile = createPdfFile("big.pdf", MAX_TOTAL_SIZE + 1);
    const result = validatePdfFiles([
      bigFile,
      createPdfFile("small.pdf", 1024),
    ]);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("errors.totalSizeExceeded");
  });

  it("合計45MB超50MB以下ならwarning付きで有効", () => {
    const size = WARN_TOTAL_SIZE + 1;
    const result = validatePdfFiles([
      createPdfFile("a.pdf", size),
      createPdfFile("b.pdf", 1024),
    ]);
    expect(result.isValid).toBe(true);
    expect(result.warning).toBe("warnings.nearSizeLimit");
  });

  it("50MB以下なら有効", () => {
    const result = validatePdfFiles([
      createPdfFile("a.pdf", 1024),
      createPdfFile("b.pdf", 1024),
    ]);
    expect(result.isValid).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it("追加時は最小ファイル数チェックをスキップできる", () => {
    const result = validatePdfFiles([createPdfFile("a.pdf", 1024)], {
      skipMinFileCount: true,
    });
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe("validatePdfFile", () => {
  it("非PDFファイル(マジックバイトなし)を検出する", async () => {
    const file = createFakeFile("not-a-pdf.pdf", 1024);
    const result = await validatePdfFile(file);
    expect(result.status).toBe("corrupted");
    expect(result.errorKey).toBe("errors.notPdf");
  });

  it("有効なPDFマジックバイトを持つファイルを受け入れる", async () => {
    // Minimal valid PDF
    const pdfBytes = new TextEncoder().encode(
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
    );
    const file = new File([pdfBytes], "valid.pdf", {
      type: "application/pdf",
    });
    const result = await validatePdfFile(file);
    expect(result.status).toBe("valid");
    expect(result.pageCount).toBeGreaterThan(0);
  });

  it("pdf-lib の EncryptedPDFError を暗号化PDFとして検出する", async () => {
    vi.spyOn(PDFDocument, "load").mockRejectedValue({ name: "EncryptedPDFError" });
    const file = createPdfFile("enc.pdf", 1024);
    const result = await validatePdfFile(file);
    expect(result.status).toBe("encrypted");
    expect(result.errorKey).toBe("errors.encrypted");
  });

  it("/Encrypt を含んでいても正常に解析できるPDFは有効と判定する", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    const validPdf = await pdf.save();
    const encryptMarker = new TextEncoder().encode("\n% /Encrypt marker\n");

    const bytes = new Uint8Array(validPdf.length + encryptMarker.length);
    bytes.set(validPdf, 0);
    bytes.set(encryptMarker, validPdf.length);

    const file = new File([bytes], "contains-encrypt-token.pdf", {
      type: "application/pdf",
    });
    const result = await validatePdfFile(file);
    expect(result.status).toBe("valid");
    expect(result.errorKey).toBeUndefined();
  });

  it("ページを持たないPDFを拒否する", async () => {
    vi.spyOn(PDFDocument, "load").mockResolvedValue({
      getPageCount: () => 0,
    } as unknown as PDFDocument);

    const file = createPdfFile("empty.pdf", 1024);

    const result = await validatePdfFile(file);
    expect(result.status).toBe("corrupted");
    expect(result.pageCount).toBe(0);
    expect(result.errorKey).toBe("errors.emptyPdf");
  });

  it("破損PDFを検出する", async () => {
    // Starts with %PDF- but is otherwise garbage
    const pdfContent = "%PDF-1.4\ngarbage content that is not a valid pdf";
    const file = new File(
      [new TextEncoder().encode(pdfContent)],
      "broken.pdf",
      { type: "application/pdf" }
    );
    const result = await validatePdfFile(file);
    expect(result.status).toBe("corrupted");
    expect(result.errorKey).toBe("errors.corrupted");
  });
});

describe("MAX_TOTAL_PAGES", () => {
  it("ページ数上限が500に設定されている", () => {
    expect(MAX_TOTAL_PAGES).toBe(500);
  });
});
