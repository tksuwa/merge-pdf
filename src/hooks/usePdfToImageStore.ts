import { useReducer } from "react";
import type { PdfFile } from "@/types/pdf";
import type { ConvertSettings, ConvertJob, PdfToImageState } from "@/types/convert";

export const initialState: PdfToImageState = {
  file: null,
  settings: {
    format: "png",
    quality: 0.92,
    scale: 2,
  },
  convertJob: {
    status: "idle",
    progress: 0,
    currentPage: 0,
    totalPages: 0,
    resultUrl: null,
    errorKey: null,
  },
  outputFileName: "pages",
};

export type PdfToImageAction =
  | { type: "SET_FILE"; file: PdfFile }
  | { type: "CLEAR_FILE" }
  | { type: "SET_SETTINGS"; settings: Partial<ConvertSettings> }
  | { type: "SET_CONVERT_JOB"; job: Partial<ConvertJob> }
  | { type: "RESET_CONVERT" }
  | { type: "SET_OUTPUT_FILENAME"; name: string };

export function pdfToImageReducer(
  state: PdfToImageState,
  action: PdfToImageAction
): PdfToImageState {
  switch (action.type) {
    case "SET_FILE":
      return {
        ...state,
        file: action.file,
        convertJob: { ...initialState.convertJob },
      };

    case "CLEAR_FILE":
      return {
        ...state,
        file: null,
        convertJob: { ...initialState.convertJob },
      };

    case "SET_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
      };

    case "SET_CONVERT_JOB":
      return {
        ...state,
        convertJob: { ...state.convertJob, ...action.job },
      };

    case "RESET_CONVERT":
      return {
        ...state,
        convertJob: { ...initialState.convertJob },
      };

    case "SET_OUTPUT_FILENAME":
      return { ...state, outputFileName: action.name };

    default:
      return state;
  }
}

export function usePdfToImageStore() {
  const [state, dispatch] = useReducer(pdfToImageReducer, initialState);
  return { state, dispatch };
}
