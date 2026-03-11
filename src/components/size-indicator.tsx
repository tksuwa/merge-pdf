"use client";

import { formatFileSize } from "@/lib/format";
import { MAX_TOTAL_SIZE, WARN_TOTAL_SIZE } from "@/validate/pdf";

interface SizeIndicatorProps {
  totalSize: number;
}

export function SizeIndicator({ totalSize }: SizeIndicatorProps) {
  const isOver = totalSize > MAX_TOTAL_SIZE;
  const isWarning = totalSize > WARN_TOTAL_SIZE && !isOver;

  const colorClass = isOver
    ? "text-destructive"
    : isWarning
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-muted-foreground";

  return (
    <span className={`text-xs ${colorClass}`}>
      {formatFileSize(totalSize)} / {formatFileSize(MAX_TOTAL_SIZE)}
    </span>
  );
}
