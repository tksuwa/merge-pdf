import { useEffect, useRef, useState, useCallback } from "react";

const THUMBNAIL_WIDTH = 150;

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pdfjsPromise;
}

export async function renderThumbnail(
  pdfBuffer: ArrayBuffer,
  pageIndex: number,
  width: number = THUMBNAIL_WIDTH
): Promise<string> {
  const pdfjsLib = await getPdfjs();
  const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
  try {
    const page = await pdf.getPage(pageIndex + 1); // pdfjs is 1-indexed
    const viewport = page.getViewport({ scale: 1 });
    const scale = width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({
      canvasContext: ctx,
      canvas,
      viewport: scaledViewport,
    }).promise;

    const dataUrl = canvas.toDataURL("image/png");

    // Release canvas backing store
    canvas.width = 0;
    canvas.height = 0;

    return dataUrl;
  } finally {
    pdf.destroy();
  }
}

export function usePdfThumbnail(
  file: File | null,
  pageIndex: number,
  autoGenerate: boolean = true
) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bufferRef = useRef<ArrayBuffer | null>(null);

  const generate = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    try {
      if (!bufferRef.current) {
        bufferRef.current = await file.arrayBuffer();
      }
      const url = await renderThumbnail(bufferRef.current, pageIndex);
      setThumbnailUrl(url);
    } catch {
      setThumbnailUrl(null);
    } finally {
      setLoading(false);
    }
  }, [file, pageIndex]);

  useEffect(() => {
    if (autoGenerate && file) {
      generate();
    }
  }, [autoGenerate, file, generate]);

  return { thumbnailUrl, loading, generate };
}

export function useLazyThumbnail(
  file: File | null,
  pageIndex: number,
  rootSelector?: string
) {
  const { thumbnailUrl, loading, generate } = usePdfThumbnail(
    file,
    pageIndex,
    false
  );
  const elementRef = useRef<HTMLDivElement>(null);
  const generatedRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || !file || generatedRef.current) return;

    const root = rootSelector
      ? document.querySelector(rootSelector)
      : undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !generatedRef.current) {
          generatedRef.current = true;
          observer.disconnect();

          if ("requestIdleCallback" in window) {
            (window as Window).requestIdleCallback(() => generate());
          } else {
            generate();
          }
        }
      },
      { root: root ?? undefined, rootMargin: "200px" }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [file, generate, rootSelector]);

  return { thumbnailUrl, loading, elementRef };
}
