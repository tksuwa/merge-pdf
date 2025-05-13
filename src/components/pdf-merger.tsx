"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileList } from "@/components/file-list";
import { validateFilename, MAX_FILENAME_LENGTH } from "@/validate/filename";
import { validatePdfFiles } from "@/validate/pdf";

export function PdfMerger() {
  const t = useTranslations();
  const [files, setFiles] = useState<File[]>([]);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState("merged");
  const [fileNameError, setFileNameError] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setMergedUrl(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setMergedUrl(null);
  }, []);

  const handleFileNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDownloadFileName(value);

      const validation = validateFilename(value);
      if (!validation.isValid && validation.error) {
        setFileNameError(t(validation.error, { max: MAX_FILENAME_LENGTH }));
      } else {
        setFileNameError(null);
      }
    },
    [t]
  );

  const handleMerge = useCallback(async () => {
    const validation = validatePdfFiles(files);
    if (!validation.isValid) {
      alert(t(validation.error!));
      return;
    }

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
  }, [files, t]);

  const handleDownload = useCallback(() => {
    if (!mergedUrl || fileNameError) return;
    const a = document.createElement("a");
    a.href = mergedUrl;
    a.download = `${downloadFileName}.pdf`;
    a.click();
  }, [mergedUrl, fileNameError, downloadFileName]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t("description")}
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`flex items-center justify-center w-full h-32 px-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-muted hover:bg-accent/50 hover:text-accent-foreground"
            }`}
          >
            <input {...getInputProps()} />
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
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={downloadFileName}
                onChange={handleFileNameChange}
                placeholder="merged"
                className="flex-1"
              />
              <span className="text-muted-foreground">.pdf</span>
            </div>
            <Button
              onClick={handleDownload}
              variant="default"
              className="whitespace-nowrap"
              disabled={!!fileNameError}
            >
              {t("buttons.download")}
            </Button>
          </div>
          {fileNameError && (
            <p className="text-sm text-destructive">{fileNameError}</p>
          )}
        </div>
      )}
    </div>
  );
}
