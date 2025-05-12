"use client";
import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PDFDocument } from "pdf-lib";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function PdfMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const pdfFiles = Array.from(selectedFiles).filter(
      (file) => file.type === "application/pdf"
    );

    if (pdfFiles.length === 0) {
      alert(t("errors.selectPdf"));
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...pdfFiles]);
    setMergedUrl(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setMergedUrl(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      setMergedUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error(t("errors.mergeError"), error);
      alert(t("errors.mergeError"));
    }
  };

  const handleDownload = () => {
    if (!mergedUrl) return;
    const a = document.createElement("a");
    a.href = mergedUrl;
    a.download = "merged.pdf";
    a.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-8">
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
      <div className="w-full max-w-xs">
        <div className="relative">
          <div
            className="flex items-center justify-center w-full h-32 px-4 border-2 border-dashed rounded-lg bg-background hover:bg-accent/50 hover:text-accent-foreground transition-colors cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <Input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm font-medium">{t("dropzone.drop")}</span>
              <span className="text-xs text-muted-foreground">
                {t("dropzone.click")}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {t("dropzone.hint")}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {files.length > 0 && (
          <ul className="text-sm list-disc pl-5">
            {files.map((file, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(i)}
                  className="h-6 px-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        onClick={handleMerge}
        disabled={files.length < 2}
        className="w-full max-w-xs"
      >
        {t("buttons.merge")}
      </Button>
      {mergedUrl && (
        <Button
          onClick={handleDownload}
          variant="secondary"
          className="w-full max-w-xs"
        >
          {t("buttons.download")}
        </Button>
      )}
    </div>
  );
}
