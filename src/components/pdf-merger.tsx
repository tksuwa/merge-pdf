"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PDFDocument } from "pdf-lib";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileList } from "@/components/file-list";

export function PdfMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();
  const [isMerging, setIsMerging] = useState(false);

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
    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setMergedUrl(url);
    } catch (error) {
      console.error(error);
      alert(t("errors.mergeError"));
    } finally {
      setIsMerging(false);
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
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-6">
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
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t("fileList.title")}</h2>
                <Button
                  onClick={handleMerge}
                  disabled={files.length < 2 || isMerging}
                >
                  {isMerging ? t("buttons.merging") : t("buttons.merge")}
                </Button>
              </div>
              <ScrollArea className="h-[200px]">
                <FileList
                  files={files.map((file, index) => ({
                    name: file.name,
                    size: file.size,
                    index: index + 1,
                  }))}
                  onRemove={handleRemoveFile}
                />
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {mergedUrl && (
        <Button
          onClick={handleDownload}
          variant="default"
          className="w-full cursor-pointer"
        >
          {t("buttons.download")}
        </Button>
      )}
    </div>
  );
}
