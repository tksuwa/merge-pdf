"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useCallback } from "react";

interface File {
  name: string;
  size: number;
  index: number;
}

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
}

export function FileList({ files, onRemove }: FileListProps) {
  const formatFileName = useCallback((name: string) => {
    const maxLength = 50;
    if (name.length <= maxLength) return name;

    const extension = name.split(".").pop();
    const nameWithoutExtension = name.slice(0, name.lastIndexOf("."));
    const truncatedName = nameWithoutExtension.slice(0, maxLength - 3) + "...";
    return `${truncatedName}.${extension}`;
  }, []);

  return (
    <ul className="space-y-2">
      {files.map((file, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium shrink-0">{file.index}.</span>
            <span className="text-sm truncate" title={file.name}>
              {formatFileName(file.name)}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(i)}
            className="h-6 px-2 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
