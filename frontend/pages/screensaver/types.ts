export type ModelOption = "x3" | "x4" | "x4pro";
export type Orientation = "portrait" | "landscape";
export type DeviceColor = "black" | "white";
export type ExportFormat = "bmp" | "png";

export type ScreenBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type ModelConfig = {
  label: string;
  name: string;
  w: number;
  h: number;
  blackImg: string;
  blackFallback: string;
  whiteImg: string;
  whiteFallback: string;
  screen: ScreenBox;
  screenLandscape: ScreenBox;
  mockupScale: number;
  mockupScaleLandscape: number;
};

export type Adjustments = {
  brightness: number;
  contrast: number;
  grayscale: number;
  sepia: number;
};

export type CanvasSettings = {
  paddingPercent: number;
  zoom: number;
  enabled: boolean;
};

export const DEFAULT_CANVAS: CanvasSettings = {
  paddingPercent: 0,
  zoom: 100,
  enabled: false,
};

export type ScreensaverMeta = {
  name: string;
  author: string;
  description: string;
  tags: string[];
};
export type Screensaver = {
  id: string;
  file: string;
  original_file: string | null;
  thumbnail: string | null;
  name: string;
  author: string;
  description: string | null;
  tags: string[];
  model_name: string;
  color: string;
  orientation: string;
  devices: string;
  is_active: boolean;
  downloads: number;
  views: number;
  created_at: string;
  updated_at: string;
};

export type EditSource =
  | { kind: "new" }
  | { kind: "screensaver"; item: Screensaver };