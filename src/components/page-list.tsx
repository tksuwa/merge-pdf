"use client";

import { useCallback, useState } from "react";
import { RotateCw, RotateCcw, Eye, EyeOff } from "lucide-react";
import { PageThumbnail } from "@/components/page-thumbnail";
import { PagePreviewDialog } from "@/components/page-preview-dialog";
import type { PdfFile, PdfPage } from "@/types/pdf";
import type { PdfAction } from "@/hooks/usePdfStore";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PageListProps {
  files: PdfFile[];
  pageOrder: string[];
  dispatch: React.Dispatch<PdfAction>;
}

function SortablePageCard({
  page,
  file,
  dispatch,
  onPreview,
}: {
  page: PdfPage;
  file: PdfFile;
  dispatch: React.Dispatch<PdfAction>;
  onPreview: (pageId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? "z-10 shadow-lg" : ""}`}
    >
      <div
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <PageThumbnail page={page} file={file.file} />
      </div>
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="h-6 w-6 inline-flex items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
          onClick={() => onPreview(page.id)}
          aria-label="Preview"
        >
          <Eye className="h-3 w-3" />
        </button>
        <button
          className="h-6 w-6 inline-flex items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
          onClick={() =>
            dispatch({
              type: "TOGGLE_PAGE",
              pageId: page.id,
            })
          }
          aria-label={page.included ? "Exclude" : "Include"}
        >
          {page.included ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </button>
        <button
          className="h-6 w-6 inline-flex items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
          onClick={() =>
            dispatch({
              type: "ROTATE_PAGE",
              pageId: page.id,
              direction: "left",
            })
          }
          aria-label="Rotate left"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
        <button
          className="h-6 w-6 inline-flex items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
          onClick={() =>
            dispatch({
              type: "ROTATE_PAGE",
              pageId: page.id,
              direction: "right",
            })
          }
          aria-label="Rotate right"
        >
          <RotateCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function PageList({ files, pageOrder, dispatch }: PageListProps) {
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Build page map: pageId -> { page, file }
  const pageMap = new Map<string, { page: PdfPage; file: PdfFile }>();
  for (const file of files) {
    for (const page of file.pages) {
      pageMap.set(page.id, { page, file });
    }
  }

  const orderedPages = pageOrder
    .map((id) => pageMap.get(id))
    .filter(
      (entry): entry is { page: PdfPage; file: PdfFile } =>
        entry !== undefined
    );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = pageOrder.indexOf(active.id as string);
      const newIndex = pageOrder.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = [...pageOrder];
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);
      dispatch({ type: "REORDER_PAGES", pageIds: newOrder });
    },
    [pageOrder, dispatch]
  );

  const handlePreview = useCallback((pageId: string) => {
    setPreviewPageId(pageId);
  }, []);

  const previewEntry = previewPageId ? pageMap.get(previewPageId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pageOrder}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {orderedPages.map(({ page, file }) => (
              <SortablePageCard
                key={page.id}
                page={page}
                file={file}
                dispatch={dispatch}
                onPreview={handlePreview}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {previewEntry && (
        <PagePreviewDialog
          page={previewEntry.page}
          file={previewEntry.file}
          dispatch={dispatch}
          onClose={() => setPreviewPageId(null)}
        />
      )}
    </>
  );
}
