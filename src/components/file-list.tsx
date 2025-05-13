"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
  return (
    <ul className="space-y-2">
      {files.map((file, i) => (
        <li
          key={i}
          className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2 p-2 rounded-lg bg-muted/50"
        >
          <span className="text-sm font-medium">{file.index}.</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm truncate" title={file.name}>
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(i)}
            className="h-6 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
