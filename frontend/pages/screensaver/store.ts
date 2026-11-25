import { useSyncExternalStore } from "react";
import { Adjustments, DeviceColor, ModelOption, Orientation, CanvasSettings, DEFAULT_CANVAS, EditSource } from "./types";
import { DEFAULT_ADJ } from "./constants";

interface EditorSeed {
  imageSrc: string | null;
  originalSrc: string | null;
  rotation: number;
  adj: Adjustments;
  model: ModelOption;
  deviceColor: DeviceColor;
  orientation: Orientation;
  canvasSettings: CanvasSettings;
  editSource: EditSource;
}

const initialState: EditorSeed = {
  imageSrc: null,
  originalSrc: null,
  rotation: 0,
  adj: DEFAULT_ADJ,
  model: "x4",
  deviceColor: "black",
  orientation: "portrait",
  canvasSettings: DEFAULT_CANVAS,
  editSource: { kind: "new" },
};

let state: EditorSeed = { ...initialState };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const editorStore = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  loadImage: (
    src: string,
    meta?: {
      model?: ModelOption;
      deviceColor?: DeviceColor;
      orientation?: Orientation;
      source?: EditSource;
    }
  ) => {
    state = {
      ...initialState,
      imageSrc: src,
      originalSrc: src,
      model: meta?.model ?? initialState.model,
      deviceColor: meta?.deviceColor ?? initialState.deviceColor,
      orientation: meta?.orientation ?? initialState.orientation,
      editSource: meta?.source ?? { kind: "new" },
    };
    emit();
  },
  reset: () => {
    state = { ...initialState };
    emit();
  },
};

export function useEditorSeed(): EditorSeed {
  return useSyncExternalStore(editorStore.subscribe, editorStore.getState, editorStore.getState);
}