"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface MergeProgressProps {
  progress: number;
  currentFileName: string | null;
  onCancel: () => void;
}

export function MergeProgress({
  progress,
  currentFileName,
  onCancel,
}: MergeProgressProps) {
  const t = useTranslations();
  const percent = Math.round(progress * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>
          {t("buttons.merging")} {percent}%
        </span>
        <Button variant="outline" size="sm" onClick={onCancel}>
          {t("buttons.cancel")}
        </Button>
      </div>
      <div
        className="h-2 w-full bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
      {currentFileName && (
        <p className="text-xs text-muted-foreground truncate">
          {currentFileName}
        </p>
      )}
    </div>
  );
}
