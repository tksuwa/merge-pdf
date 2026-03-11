import { useReducer } from "react";
import type { PdfFile, PdfMergerState, MergeJob, Rotation } from "@/types/pdf";

export const initialState: PdfMergerState = {
  files: [],
  pageOrder: [],
  viewMode: "file",
  mergeJob: {
    status: "idle",
    progress: 0,
    currentFileName: null,
    resultUrl: null,
    errorKey: null,
  },
  outputFileName: "merged",
  warningKey: null,
};

export type PdfAction =
  | { type: "ADD_FILES"; files: PdfFile[] }
  | { type: "REMOVE_FILE"; fileId: string }
  | { type: "REORDER_FILES"; fileIds: string[] }
  | { type: "SET_OUTPUT_FILENAME"; name: string }
  | { type: "SET_MERGE_JOB"; job: Partial<MergeJob> }
  | { type: "RESET_MERGE" }
  | { type: "TOGGLE_PAGE"; pageId: string }
  | { type: "ROTATE_PAGE"; pageId: string; direction: "left" | "right" }
  | { type: "REORDER_PAGES"; pageIds: string[] }
  | { type: "SET_VIEW_MODE"; mode: "file" | "page" }
  | { type: "SET_WARNING"; warningKey: string | null };

function buildPageOrder(files: PdfFile[]): string[] {
  return files.flatMap((f) => f.pages.map((p) => p.id));
}

export function pdfReducer(
  state: PdfMergerState,
  action: PdfAction
): PdfMergerState {
  switch (action.type) {
    case "ADD_FILES": {
      const newFiles = [...state.files, ...action.files];
      return {
        ...state,
        files: newFiles,
        pageOrder: buildPageOrder(newFiles),
      };
    }

    case "REMOVE_FILE": {
      const newFiles = state.files.filter((f) => f.id !== action.fileId);
      return {
        ...state,
        files: newFiles,
        pageOrder: buildPageOrder(newFiles),
      };
    }

    case "REORDER_FILES": {
      const fileMap = new Map(state.files.map((f) => [f.id, f]));
      const reordered = action.fileIds
        .map((id) => fileMap.get(id))
        .filter((f): f is PdfFile => f !== undefined);
      return {
        ...state,
        files: reordered,
        pageOrder: buildPageOrder(reordered),
      };
    }

    case "SET_OUTPUT_FILENAME":
      return { ...state, outputFileName: action.name };

    case "SET_MERGE_JOB":
      return {
        ...state,
        mergeJob: { ...state.mergeJob, ...action.job },
      };

    case "RESET_MERGE":
      return {
        ...state,
        mergeJob: { ...initialState.mergeJob },
        warningKey: null,
      };

    case "TOGGLE_PAGE": {
      const files = state.files.map((f) => ({
        ...f,
        pages: f.pages.map((p) =>
          p.id === action.pageId ? { ...p, included: !p.included } : p
        ),
      }));
      return { ...state, files };
    }

    case "ROTATE_PAGE": {
      const delta = action.direction === "right" ? 90 : 270;
      const files = state.files.map((f) => ({
        ...f,
        pages: f.pages.map((p) =>
          p.id === action.pageId
            ? { ...p, rotation: ((p.rotation + delta) % 360) as Rotation }
            : p
        ),
      }));
      return { ...state, files };
    }

    case "REORDER_PAGES":
      return { ...state, pageOrder: action.pageIds };

    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode };

    case "SET_WARNING":
      return { ...state, warningKey: action.warningKey };

    default:
      return state;
  }
}

export function usePdfStore() {
  const [state, dispatch] = useReducer(pdfReducer, initialState);
  return { state, dispatch };
}
