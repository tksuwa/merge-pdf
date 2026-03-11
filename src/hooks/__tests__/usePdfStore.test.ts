import { describe, it, expect } from "vitest";
import {
  pdfReducer,
  initialState,
  type PdfAction,
} from "@/hooks/usePdfStore";
import type { PdfFile, PdfMergerState } from "@/types/pdf";

function createTestPdfFile(
  overrides: Partial<PdfFile> & { id: string }
): PdfFile {
  return {
    name: "test.pdf",
    size: 1024,
    file: new File([], "test.pdf"),
    pageCount: 1,
    pages: [
      {
        id: `${overrides.id}-page-0`,
        fileId: overrides.id,
        originalIndex: 0,
        rotation: 0,
        thumbnailUrl: null,
        included: true,
      },
    ],
    status: "valid",
    ...overrides,
  };
}

describe("pdfReducer", () => {
  describe("ADD_FILES", () => {
    it("ファイルを追加する", () => {
      const file = createTestPdfFile({ id: "f1" });
      const action: PdfAction = { type: "ADD_FILES", files: [file] };
      const state = pdfReducer(initialState, action);

      expect(state.files).toHaveLength(1);
      expect(state.files[0].id).toBe("f1");
      expect(state.pageOrder).toEqual(["f1-page-0"]);
    });

    it("既存ファイルに追加する", () => {
      const f1 = createTestPdfFile({ id: "f1", name: "a.pdf" });
      const f2 = createTestPdfFile({ id: "f2", name: "b.pdf" });

      let state = pdfReducer(initialState, {
        type: "ADD_FILES",
        files: [f1],
      });
      state = pdfReducer(state, { type: "ADD_FILES", files: [f2] });

      expect(state.files).toHaveLength(2);
      expect(state.pageOrder).toEqual(["f1-page-0", "f2-page-0"]);
    });
  });

  describe("REMOVE_FILE", () => {
    it("ファイルを削除する", () => {
      const f1 = createTestPdfFile({ id: "f1" });
      const f2 = createTestPdfFile({ id: "f2" });

      let state = pdfReducer(initialState, {
        type: "ADD_FILES",
        files: [f1, f2],
      });
      state = pdfReducer(state, { type: "REMOVE_FILE", fileId: "f1" });

      expect(state.files).toHaveLength(1);
      expect(state.files[0].id).toBe("f2");
      expect(state.pageOrder).toEqual(["f2-page-0"]);
    });
  });

  describe("REORDER_FILES", () => {
    it("ファイルを並び替える", () => {
      const f1 = createTestPdfFile({ id: "f1", name: "a.pdf" });
      const f2 = createTestPdfFile({ id: "f2", name: "b.pdf" });
      const f3 = createTestPdfFile({ id: "f3", name: "c.pdf" });

      let state = pdfReducer(initialState, {
        type: "ADD_FILES",
        files: [f1, f2, f3],
      });

      // Move f3 to first position
      state = pdfReducer(state, {
        type: "REORDER_FILES",
        fileIds: ["f3", "f1", "f2"],
      });

      expect(state.files.map((f) => f.id)).toEqual(["f3", "f1", "f2"]);
      expect(state.pageOrder).toEqual([
        "f3-page-0",
        "f1-page-0",
        "f2-page-0",
      ]);
    });
  });

  describe("SET_OUTPUT_FILENAME", () => {
    it("出力ファイル名を変更する", () => {
      const state = pdfReducer(initialState, {
        type: "SET_OUTPUT_FILENAME",
        name: "my-document",
      });
      expect(state.outputFileName).toBe("my-document");
    });
  });

  describe("SET_MERGE_JOB", () => {
    it("結合ジョブの状態を更新する", () => {
      const state = pdfReducer(initialState, {
        type: "SET_MERGE_JOB",
        job: { status: "merging", progress: 0.5, currentFileName: "a.pdf" },
      });
      expect(state.mergeJob.status).toBe("merging");
      expect(state.mergeJob.progress).toBe(0.5);
      expect(state.mergeJob.currentFileName).toBe("a.pdf");
    });
  });

  describe("RESET_MERGE", () => {
    it("結合結果をリセットする", () => {
      let state: PdfMergerState = {
        ...initialState,
        mergeJob: {
          status: "done",
          progress: 1,
          currentFileName: null,
          resultUrl: "blob:test",
          errorKey: null,
        },
      };
      state = pdfReducer(state, { type: "RESET_MERGE" });
      expect(state.mergeJob.status).toBe("idle");
      expect(state.mergeJob.resultUrl).toBeNull();
    });
  });

  describe("TOGGLE_PAGE", () => {
    it("ページの included を切り替える", () => {
      const f1 = createTestPdfFile({ id: "f1" });
      let state = pdfReducer(initialState, {
        type: "ADD_FILES",
        files: [f1],
      });

      expect(state.files[0].pages[0].included).toBe(true);

      state = pdfReducer(state, {
        type: "TOGGLE_PAGE",
        pageId: "f1-page-0",
      });

      expect(state.files[0].pages[0].included).toBe(false);

      state = pdfReducer(state, {
        type: "TOGGLE_PAGE",
        pageId: "f1-page-0",
      });

      expect(state.files[0].pages[0].included).toBe(true);
    });
  });

  describe("ROTATE_PAGE", () => {
    it("右回転: 0 -> 90 -> 180 -> 270 -> 0", () => {
      const f1 = createTestPdfFile({ id: "f1" });
      let state = pdfReducer(initialState, {
        type: "ADD_FILES",
        files: [f1],
      });

      state = pdfReducer(state, {
        type: "ROTATE_PAGE",
        pageId: "f1-page-0",
        direction: "right",
      });
      expect(state.files[0].pages[0].rotation).toBe(90);

      state = pdfReducer(state, {
        type: "ROTATE_PAGE",
        pageId: "f1-page-0",
        direction: "right",
      });
      expect(state.files[0].pages[0].rotation).toBe(180);

      state = pdfReducer(state, {
        type: "ROTATE_PAGE",
        pageId: "f1-page-0",
        direction: "right",
      });
      expect(state.files[0].pages[0].rotation).toBe(270);

      state = pdfReducer(state, {
        type: "ROTATE_PAGE",
        pageId: "f1-page-0",
        direction: "right",
      });
      expect(state.files[0].pages[0].rotation).toBe(0);
    });

    it("左回転: 0 -> 270 -> 180 -> 90 -> 0", () => {
      const f1 = createTestPdfFile({ id: "f1" });
      let state = pdfReducer(initialState, {
        type: "ADD_FILES",
        files: [f1],
      });

      state = pdfReducer(state, {
        type: "ROTATE_PAGE",
        pageId: "f1-page-0",
        direction: "left",
      });
      expect(state.files[0].pages[0].rotation).toBe(270);

      state = pdfReducer(state, {
        type: "ROTATE_PAGE",
        pageId: "f1-page-0",
        direction: "left",
      });
      expect(state.files[0].pages[0].rotation).toBe(180);
    });
  });

  describe("REORDER_PAGES", () => {
    it("pageOrder を更新する", () => {
      const f1 = createTestPdfFile({
        id: "f1",
        pageCount: 2,
        pages: [
          {
            id: "f1-page-0",
            fileId: "f1",
            originalIndex: 0,
            rotation: 0,
            thumbnailUrl: null,
            included: true,
          },
          {
            id: "f1-page-1",
            fileId: "f1",
            originalIndex: 1,
            rotation: 0,
            thumbnailUrl: null,
            included: true,
          },
        ],
      });

      let state = pdfReducer(initialState, {
        type: "ADD_FILES",
        files: [f1],
      });

      expect(state.pageOrder).toEqual(["f1-page-0", "f1-page-1"]);

      state = pdfReducer(state, {
        type: "REORDER_PAGES",
        pageIds: ["f1-page-1", "f1-page-0"],
      });

      expect(state.pageOrder).toEqual(["f1-page-1", "f1-page-0"]);
    });
  });

  describe("SET_VIEW_MODE", () => {
    it("viewMode を切り替える", () => {
      let state = pdfReducer(initialState, {
        type: "SET_VIEW_MODE",
        mode: "page",
      });
      expect(state.viewMode).toBe("page");

      state = pdfReducer(state, {
        type: "SET_VIEW_MODE",
        mode: "file",
      });
      expect(state.viewMode).toBe("file");
    });
  });
});
