"use client";

import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, AlertCircle } from "lucide-react";
import { formatFileSize } from "@/lib/format";
import { useTranslations } from "next-intl";
import type { PdfFile } from "@/types/pdf";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FileListProps {
  files: PdfFile[];
  onRemove: (fileId: string) => void;
  onReorder: (fileIds: string[]) => void;
}

function SortableFileItem({
  file,
  index,
  onRemove,
}: {
  file: PdfFile;
  index: number;
  onRemove: (fileId: string) => void;
}) {
  const t = useTranslations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isInvalid = file.status !== "valid";

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[1.5rem_2rem_1fr_2rem] items-center gap-2 p-2 rounded-lg ${
        isDragging ? "bg-accent shadow-md z-10" : "bg-muted/50"
      } ${isInvalid ? "border border-destructive/30" : ""}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium">{index + 1}.</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {isInvalid && (
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <span className="text-sm truncate" title={file.name}>
            {file.name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            ({formatFileSize(file.size)})
          </span>
          {file.pageCount > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              {file.pageCount}p
            </span>
          )}
        </div>
        {isInvalid && file.errorKey && (
          <p className="text-xs text-destructive mt-0.5">{t(file.errorKey)}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(file.id)}
        className="h-6 w-8 p-0"
        aria-label={t("fileList.remove")}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

export function FileList({ files, onRemove, onReorder }: FileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = files.findIndex((f) => f.id === active.id);
    const newIndex = files.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...files];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    onReorder(newOrder.map((f) => f.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={files.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {files.map((file, index) => (
            <SortableFileItem
              key={file.id}
              file={file}
              index={index}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
