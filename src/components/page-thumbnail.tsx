"use client";

import { useLazyThumbnail } from "@/hooks/usePdfThumbnail";
import type { PdfPage } from "@/types/pdf";

interface PageThumbnailProps {
  page: PdfPage;
  file: File;
  rootSelector?: string;
}

export function PageThumbnail({ page, file, rootSelector }: PageThumbnailProps) {
  const { thumbnailUrl, loading, elementRef } = useLazyThumbnail(
    file,
    page.originalIndex,
    rootSelector
  );

  const rotationStyle = page.rotation !== 0 ? `rotate(${page.rotation}deg)` : undefined;

  return (
    <div
      ref={elementRef}
      className={`relative w-[150px] h-[200px] rounded border overflow-hidden ${
        page.included ? "border-border" : "border-muted opacity-40"
      }`}
    >
      {loading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`Page ${page.originalIndex + 1}`}
          className="w-full h-full object-contain transition-transform duration-150 ease-out motion-reduce:transition-none"
          style={{ transform: rotationStyle }}
        />
      ) : (
        !loading && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">
              {page.originalIndex + 1}
            </span>
          </div>
        )
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
        {page.originalIndex + 1}
      </div>
    </div>
  );
}
