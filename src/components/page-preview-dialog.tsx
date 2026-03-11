"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw } from "lucide-react";
import { renderThumbnail } from "@/hooks/usePdfThumbnail";
import type { PdfPage, PdfFile } from "@/types/pdf";
import type { PdfAction } from "@/hooks/usePdfStore";

interface PagePreviewDialogProps {
  page: PdfPage;
  file: PdfFile;
  dispatch: React.Dispatch<PdfAction>;
  onClose: () => void;
}

export function PagePreviewDialog({
  page,
  file,
  dispatch,
  onClose,
}: PagePreviewDialogProps) {
  const t = useTranslations();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();

    let cancelled = false;
    file.file
      .arrayBuffer()
      .then((buffer) => {
        if (cancelled) return;
        return renderThumbnail(buffer, page.originalIndex, 800).then((url) => {
          if (!cancelled) {
            setImageNaturalSize(null);
            setImageUrl(url);
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          setImageNaturalSize(null);
          setImageUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file.file, page.originalIndex]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const scaledWidth = imageNaturalSize
    ? Math.max(1, Math.round(imageNaturalSize.width * zoom))
    : undefined;
  const scaledHeight = imageNaturalSize
    ? Math.max(1, Math.round(imageNaturalSize.height * zoom))
    : undefined;
  const normalizedRotation = ((page.rotation % 360) + 360) % 360;
  const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270;
  const boundingWidth =
    scaledWidth && scaledHeight
      ? isQuarterTurn
        ? scaledHeight
        : scaledWidth
      : undefined;
  const boundingHeight =
    scaledWidth && scaledHeight
      ? isQuarterTurn
        ? scaledWidth
        : scaledHeight
      : undefined;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-transparent backdrop:bg-black/60"
    >
      <div className="bg-background rounded-lg shadow-xl w-[min(90vw,1200px)] h-[min(90vh,900px)] overflow-hidden p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <span className="text-sm font-medium">
            {file.name} - Page {page.originalIndex + 1}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-muted/70 text-foreground hover:bg-muted"
              onClick={() =>
                dispatch({
                  type: "ROTATE_PAGE",
                  pageId: page.id,
                  direction: "left",
                })
              }
              aria-label={t("aria.rotateLeft")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-muted/70 text-foreground hover:bg-muted"
              onClick={() =>
                dispatch({
                  type: "ROTATE_PAGE",
                  pageId: page.id,
                  direction: "right",
                })
              }
              aria-label={t("aria.rotateRight")}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-muted/70 text-foreground hover:bg-muted"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-muted/70 text-foreground hover:bg-muted"
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-muted/70 text-foreground hover:bg-muted"
              onClick={onClose}
              aria-label={t("aria.closePreview")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-muted/20">
          <div className="min-h-full min-w-max p-6 flex items-start justify-center">
            {imageUrl ? (
              <div
                className="flex items-center justify-center"
                style={{
                  width: boundingWidth ? `${boundingWidth}px` : undefined,
                  height: boundingHeight ? `${boundingHeight}px` : undefined,
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Page ${page.originalIndex + 1}`}
                  className="block max-w-none transition-[width,height,transform] duration-150 ease-out origin-center will-change-transform"
                  onLoad={(e) => {
                    setImageNaturalSize({
                      width: e.currentTarget.naturalWidth,
                      height: e.currentTarget.naturalHeight,
                    });
                  }}
                  style={{
                    width: scaledWidth ? `${scaledWidth}px` : undefined,
                    height: scaledHeight ? `${scaledHeight}px` : undefined,
                    transform: `rotate(${page.rotation}deg)`,
                  }}
                />
              </div>
            ) : (
              <div className="w-[400px] h-[560px] bg-muted animate-pulse rounded" />
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
