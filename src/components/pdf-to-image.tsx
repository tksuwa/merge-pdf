"use client";

import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import {
  validatePdfFile,
  validatePdfFiles,
  MAX_TOTAL_PAGES,
} from "@/validate/pdf";
import { validateFilename, MAX_FILENAME_LENGTH } from "@/validate/filename";
import { usePdfToImageStore } from "@/hooks/usePdfToImageStore";
import { usePdfToImage } from "@/hooks/usePdfToImage";
import type { PdfFile, PdfPage } from "@/types/pdf";
import type { ImageFormat, ConvertSettings } from "@/types/convert";

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
];

const SCALE_OPTIONS = [1, 2, 3] as const;

export function PdfToImage() {
  const t = useTranslations();
  const tConvert = useTranslations("pdfToImage");
  const { state, dispatch } = usePdfToImageStore();
  const { convert, cancelConvert, invalidateConvert } = usePdfToImage(dispatch);
  const resultSectionRef = useRef<HTMLDivElement | null>(null);
  const fileSelectionRunRef = useRef(0);

  const fileNameValidation = validateFilename(state.outputFileName);
  const fileNameError =
    !fileNameValidation.isValid && fileNameValidation.error
      ? t(fileNameValidation.error, { max: MAX_FILENAME_LENGTH })
      : null;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const fileSelectionRunId = fileSelectionRunRef.current + 1;
      fileSelectionRunRef.current = fileSelectionRunId;
      const isStaleSelection = () =>
        fileSelectionRunRef.current !== fileSelectionRunId;

      const hadExistingFile = state.file !== null;
      const wasConverting = state.convertJob.status === "converting";

      if (wasConverting) {
        cancelConvert();
      }

      const sizeValidation = validatePdfFiles([file], {
        skipMinFileCount: true,
      });
      if (!sizeValidation.isValid) {
        if (!wasConverting) {
          invalidateConvert();
        }
        dispatch({ type: "CLEAR_FILE" });
        dispatch({
          type: "SET_CONVERT_JOB",
          job: {
            status: "error",
            errorKey: sizeValidation.error ?? "errors.totalSizeExceeded",
          },
        });
        return;
      }

      const result = await validatePdfFile(file);
      if (isStaleSelection()) return;

      if (result.status !== "valid") {
        if (!wasConverting) {
          invalidateConvert();
        }
        dispatch({ type: "CLEAR_FILE" });
        dispatch({
          type: "SET_CONVERT_JOB",
          job: {
            status: "error",
            errorKey: result.errorKey ?? "errors.corrupted",
          },
        });
        return;
      }

      if (result.pageCount > MAX_TOTAL_PAGES) {
        if (!wasConverting) {
          invalidateConvert();
        }
        dispatch({ type: "CLEAR_FILE" });
        dispatch({
          type: "SET_CONVERT_JOB",
          job: {
            status: "error",
            errorKey: "errors.totalPagesExceeded",
          },
        });
        return;
      }

      const fileId = crypto.randomUUID();
      const pages: PdfPage[] = Array.from(
        { length: result.pageCount },
        (_, i) => ({
          id: `${fileId}-page-${i}`,
          fileId,
          originalIndex: i,
          rotation: 0 as const,
          thumbnailUrl: null,
          included: true,
        })
      );

      const pdfFile: PdfFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        file,
        pageCount: result.pageCount,
        pages,
        status: result.status,
        errorKey: result.errorKey,
      };

      if (hadExistingFile && !wasConverting) {
        invalidateConvert();
      }

      if (isStaleSelection()) return;
      dispatch({ type: "SET_FILE", file: pdfFile });
    },
    [cancelConvert, dispatch, invalidateConvert, state.convertJob.status, state.file]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleSettingsChange = useCallback(
    (settings: Partial<ConvertSettings>) => {
      const nextSettings = { ...state.settings, ...settings };
      const settingsChanged =
        nextSettings.format !== state.settings.format ||
        nextSettings.quality !== state.settings.quality ||
        nextSettings.scale !== state.settings.scale;

      if (!settingsChanged) return;

      if (state.convertJob.status === "converting") {
        cancelConvert();
      } else {
        invalidateConvert();
      }

      dispatch({ type: "SET_SETTINGS", settings });
      dispatch({ type: "RESET_CONVERT" });
    },
    [
      cancelConvert,
      dispatch,
      invalidateConvert,
      state.convertJob.status,
      state.settings,
    ]
  );

  const handleConvert = useCallback(() => {
    if (!state.file) return;
    convert(state.file, state.settings);
  }, [state.file, state.settings, convert]);

  const handleDownload = useCallback(() => {
    if (!state.convertJob.resultUrl || fileNameError) return;
    const a = document.createElement("a");
    a.href = state.convertJob.resultUrl;
    a.download = `${state.outputFileName}.zip`;
    a.click();
  }, [state.convertJob.resultUrl, fileNameError, state.outputFileName]);

  const handleClear = useCallback(() => {
    fileSelectionRunRef.current += 1;
    if (state.convertJob.status === "converting") {
      cancelConvert();
    } else {
      invalidateConvert();
    }
    dispatch({ type: "CLEAR_FILE" });
  }, [state.convertJob.status, cancelConvert, dispatch, invalidateConvert]);

  const handleFileNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_OUTPUT_FILENAME", name: e.target.value });
    },
    [dispatch]
  );

  const isConverting = state.convertJob.status === "converting";
  const hasResult =
    state.convertJob.status === "done" && state.convertJob.resultUrl;
  const hasError =
    state.convertJob.status === "error" && state.convertJob.errorKey;
  const showQuality = state.settings.format !== "png";
  const errorMessage = hasError
    ? state.convertJob.errorKey === "errors.totalPagesExceeded"
      ? t(state.convertJob.errorKey, { max: MAX_TOTAL_PAGES })
      : t(state.convertJob.errorKey!)
    : null;

  useEffect(() => {
    if (!hasResult) return;
    resultSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [hasResult]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex flex-col items-center">
        <div className="text-center">
          <h1
            className={`text-3xl font-bold transition-all duration-300 ${
              state.file ? "mb-0" : "mb-4"
            }`}
          >
            {tConvert("title")}
          </h1>
          <div
            className={`transition-all duration-300 overflow-hidden ${
              state.file ? "h-0 opacity-0" : "h-auto opacity-100"
            }`}
          >
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {tConvert("description")}
            </p>
          </div>
        </div>

        <div
          className={`w-full transition-all duration-300 space-y-4 ${
            state.file ? "mt-4" : "mt-8"
          }`}
        >
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
                  <span className="text-sm font-medium">
                    {tConvert("dropzone.drop")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tConvert("dropzone.click")}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {tConvert("dropzone.hint")}
              </p>
            </CardContent>
          </Card>

          {hasError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          {state.file && (
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* File info */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {state.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {state.file.pageCount} pages &middot;{" "}
                      {(state.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    disabled={isConverting}
                  >
                    &times;
                  </Button>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">
                    {tConvert("settings.title")}
                  </h3>

                  {/* Format */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      {tConvert("settings.format")}
                    </label>
                    <div className="flex gap-2">
                      {FORMAT_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          variant={
                            state.settings.format === opt.value
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleSettingsChange({ format: opt.value })
                          }
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Quality */}
                  {showQuality && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        {tConvert("settings.quality")}:{" "}
                        {Math.round(state.settings.quality * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={state.settings.quality}
                        onChange={(e) =>
                          handleSettingsChange({
                            quality: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Scale */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      {tConvert("settings.scale")}
                    </label>
                    <div className="flex gap-2">
                      {SCALE_OPTIONS.map((s) => (
                        <Button
                          key={s}
                          variant={
                            state.settings.scale === s ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleSettingsChange({
                              scale: s as 1 | 2 | 3,
                            })
                          }
                        >
                          {s}x
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Convert button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="flex-1"
                  >
                    {isConverting
                      ? tConvert("buttons.converting")
                      : tConvert("buttons.convert")}
                  </Button>
                  {isConverting && (
                    <Button variant="outline" onClick={cancelConvert}>
                      {tConvert("buttons.cancel")}
                    </Button>
                  )}
                </div>

                {/* Progress */}
                {isConverting && state.convertJob.totalPages > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${state.convertJob.progress * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {tConvert("status.converting", {
                        current: state.convertJob.currentPage,
                        total: state.convertJob.totalPages,
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {hasResult && (
            <div ref={resultSectionRef} className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm font-medium text-center text-green-600 dark:text-green-400">
                    {tConvert("status.done")}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={state.outputFileName}
                        onChange={handleFileNameChange}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">.zip</span>
                    </div>
                    <Button
                      onClick={handleDownload}
                      variant="default"
                      className="whitespace-nowrap"
                      disabled={!!fileNameError}
                    >
                      {tConvert("buttons.download")}
                    </Button>
                  </div>
                  {fileNameError && (
                    <p className="text-sm text-destructive">{fileNameError}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
