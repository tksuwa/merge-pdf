"use client";

import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileList } from "@/components/file-list";
import { PageList } from "@/components/page-list";
import { MergeProgress } from "@/components/merge-progress";
import { SizeIndicator } from "@/components/size-indicator";
import { List, LayoutGrid } from "lucide-react";
import { validateFilename, MAX_FILENAME_LENGTH } from "@/validate/filename";
import {
  validatePdfFiles,
  validatePdfFile,
  MAX_TOTAL_PAGES,
  MIN_PDF_FILES,
} from "@/validate/pdf";
import { usePdfStore } from "@/hooks/usePdfStore";
import { usePdfMerge } from "@/hooks/usePdfMerge";
import type { PdfFile, PdfPage } from "@/types/pdf";

export function PdfMerger() {
  const t = useTranslations();
  const { state, dispatch } = usePdfStore();
  const { merge, cancelMerge } = usePdfMerge(dispatch);
  const resultSectionRef = useRef<HTMLDivElement | null>(null);

  const fileNameValidation = validateFilename(state.outputFileName);
  const fileNameError =
    !fileNameValidation.isValid && fileNameValidation.error
      ? t(fileNameValidation.error, { max: MAX_FILENAME_LENGTH })
      : null;

  const totalSize = state.files.reduce((sum, f) => sum + f.size, 0);

  const resetMergeState = useCallback(() => {
    if (state.mergeJob.status === "merging") {
      cancelMerge();
    }
    dispatch({ type: "RESET_MERGE" });
  }, [state.mergeJob.status, cancelMerge, dispatch]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Pre-check total size with existing files.
      // Minimum file count is validated when merge is executed.
      const allFiles = [
        ...state.files.map((f) => f.file),
        ...acceptedFiles,
      ];
      const sizeValidation = validatePdfFiles(allFiles, {
        skipMinFileCount: true,
      });

      if (!sizeValidation.isValid) {
        dispatch({
          type: "SET_MERGE_JOB",
          job: { status: "error", errorKey: sizeValidation.error ?? null },
        });
        return;
      }

      // Validate each file asynchronously
      const validatedFiles: PdfFile[] = [];
      let existingPageCount = state.files.reduce(
        (sum, f) => sum + f.pageCount,
        0
      );

      for (const file of acceptedFiles) {
        const result = await validatePdfFile(file);
        const fileId = crypto.randomUUID();

        const pages: PdfPage[] =
          result.status === "valid"
            ? Array.from({ length: result.pageCount }, (_, i) => ({
                id: `${fileId}-page-${i}`,
                fileId,
                originalIndex: i,
                rotation: 0 as const,
                thumbnailUrl: null,
                included: true,
              }))
            : [];

        // Check total page count
        if (result.status === "valid") {
          existingPageCount += result.pageCount;
          if (existingPageCount > MAX_TOTAL_PAGES) {
            dispatch({
              type: "SET_MERGE_JOB",
              job: {
                status: "error",
                errorKey: "errors.totalPagesExceeded",
              },
            });
            return;
          }
        }

        validatedFiles.push({
          id: fileId,
          name: file.name,
          size: file.size,
          file,
          pageCount: result.pageCount,
          pages,
          status: result.status,
          errorKey: result.errorKey,
        });
      }

      // Filter out invalid files but show errors
      const invalidFiles = validatedFiles.filter(
        (f) => f.status !== "valid"
      );
      const validFiles = validatedFiles.filter(
        (f) => f.status === "valid"
      );

      if (invalidFiles.length > 0) {
        const firstError = invalidFiles[0];
        dispatch({
          type: "SET_MERGE_JOB",
          job: {
            status: "error",
            progress: 0,
            currentFileName: null,
            resultUrl: null,
            errorKey: firstError.errorKey ?? "errors.corrupted",
          },
        });
      }

      if (validFiles.length > 0) {
        dispatch({ type: "ADD_FILES", files: validFiles });
        if (invalidFiles.length === 0) {
          resetMergeState();
        }
      }

      // Show warning if near size limit
      if (sizeValidation.warning && invalidFiles.length === 0) {
        dispatch({
          type: "SET_WARNING",
          warningKey: sizeValidation.warning,
        });
      }
    },
    [state.files, dispatch, resetMergeState]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      dispatch({ type: "REMOVE_FILE", fileId });
      resetMergeState();
    },
    [dispatch, resetMergeState]
  );

  const handleReorderFiles = useCallback(
    (fileIds: string[]) => {
      dispatch({ type: "REORDER_FILES", fileIds });
      resetMergeState();
    },
    [dispatch, resetMergeState]
  );

  const handleFileNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_OUTPUT_FILENAME", name: e.target.value });
    },
    [dispatch]
  );

  const handleMerge = useCallback(async () => {
    const validFiles = state.files.filter((f) => f.status === "valid");
    if (validFiles.length < MIN_PDF_FILES) {
      dispatch({
        type: "SET_MERGE_JOB",
        job: { status: "error", errorKey: "errors.selectPdf" },
      });
      return;
    }
    merge(validFiles, state.outputFileName);
  }, [state.files, state.outputFileName, merge, dispatch]);

  const handleDownload = useCallback(() => {
    if (!state.mergeJob.resultUrl || fileNameError) return;
    const a = document.createElement("a");
    a.href = state.mergeJob.resultUrl;
    a.download = `${state.outputFileName}.pdf`;
    a.click();
  }, [state.mergeJob.resultUrl, fileNameError, state.outputFileName]);

  const isMerging = state.mergeJob.status === "merging";
  const hasResult = state.mergeJob.status === "done" && state.mergeJob.resultUrl;
  const hasError = state.mergeJob.status === "error" && state.mergeJob.errorKey;
  const validFileCount = state.files.filter(
    (f) => f.status === "valid"
  ).length;
  const mergeButtonLabel =
    validFileCount === 1 ? t("buttons.save") : t("buttons.merge");

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
              state.files.length > 0 ? "mb-0" : "mb-4"
            }`}
          >
            {t("title")}
          </h1>
          <div
            className={`transition-all duration-300 overflow-hidden ${
              state.files.length > 0 ? "h-0 opacity-0" : "h-auto opacity-100"
            }`}
          >
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t("description")}
            </p>
          </div>
        </div>
        <div
          className={`w-full transition-all duration-300 space-y-4 ${
            state.files.length > 0 ? "mt-4" : "mt-8"
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
                    {t("dropzone.drop")}
                  </span>
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

          {hasError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                {t(state.mergeJob.errorKey!, {
                  max: MAX_TOTAL_PAGES,
                })}
              </p>
            </div>
          )}

          {state.warningKey && !hasError && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {t(state.warningKey)}
              </p>
            </div>
          )}

          {state.files.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">
                        {t("fileList.title")}
                      </h2>
                      <SizeIndicator totalSize={totalSize} />
                      <div className="inline-flex items-center border rounded-md overflow-hidden">
                        <Button
                          variant={state.viewMode === "file" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 rounded-none gap-1 px-2"
                          onClick={() =>
                            dispatch({ type: "SET_VIEW_MODE", mode: "file" })
                          }
                          aria-label={t("viewMode.list")}
                        >
                          <List className="h-3.5 w-3.5" />
                          <span className="text-xs">{t("viewMode.list")}</span>
                        </Button>
                        <Button
                          variant={state.viewMode === "page" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 rounded-none gap-1 px-2"
                          onClick={() =>
                            dispatch({ type: "SET_VIEW_MODE", mode: "page" })
                          }
                          aria-label={t("viewMode.detail")}
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                          <span className="text-xs">{t("viewMode.detail")}</span>
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={handleMerge}
                      disabled={validFileCount < MIN_PDF_FILES || isMerging}
                    >
                      {mergeButtonLabel}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("fileList.editHint")}
                  </p>
                  {state.viewMode === "file" ? (
                    <ScrollArea className="h-[200px]">
                      <FileList
                        files={state.files}
                        onRemove={handleRemoveFile}
                        onReorder={handleReorderFiles}
                      />
                    </ScrollArea>
                  ) : (
                    <div>
                      <PageList
                        files={state.files}
                        pageOrder={state.pageOrder}
                        dispatch={dispatch}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isMerging && (
            <MergeProgress
              progress={state.mergeJob.progress}
              currentFileName={state.mergeJob.currentFileName}
              onCancel={cancelMerge}
            />
          )}

          {hasResult && (
            <div ref={resultSectionRef} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={state.outputFileName}
                    onChange={handleFileNameChange}
                    placeholder=""
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
      </div>
    </div>
  );
}
