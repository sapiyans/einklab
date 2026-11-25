import type { Adjustments, ModelConfig, ModelOption } from "./types";

// X3
import x3Black from "@/images/xteink/x3_black.webp";
import x3BlackFallback from "@/images/xteink/x3_black.png";
import x3White from "@/images/xteink/x3_white.webp";
import x3WhiteFallback from "@/images/xteink/x3_white.png";

// X4
import x4Black from "@/images/xteink/x4_black.webp";
import x4BlackFallback from "@/images/xteink/x4_black.png";
import x4White from "@/images/xteink/x4_white.webp";
import x4WhiteFallback from "@/images/xteink/x4_white.png";

// X4 Pro
import x4proBlack from "@/images/xteink/x4_pro_black.webp";
import x4proBlackFallback from "@/images/xteink/x4_pro_black.png";
import x4proWhite from "@/images/xteink/x4_pro_white.webp";
import x4proWhiteFallback from "@/images/xteink/x4_pro_white.png";

export const MODELS: Record<ModelOption, ModelConfig> = {
  x3: {
    label: "X3",
    name: "XTEINK X3",
    w: 528,
    h: 792,
    blackImg: x3Black,
    blackFallback: x3BlackFallback,
    whiteImg: x3White,
    whiteFallback: x3WhiteFallback,
    screen: { top: 10, left: 10, width: 80, height: 74 },
    screenLandscape: { top: 25, left: 17, width: 73, height: 50 },
    mockupScale: 370,
    mockupScaleLandscape: 597,
  },
  x4: {
    label: "X4|classic",
    name: "XTEINK X4",
    w: 480,
    h: 800,
    blackImg: x4Black,
    blackFallback: x4BlackFallback,
    whiteImg: x4White,
    whiteFallback: x4WhiteFallback,
    screen: { top: 5.8, left: 11.5, width: 78, height: 80 },
    screenLandscape: { top: 26.2, left: 14.2, width: 80, height: 48.5 },
    mockupScale: 400,
    mockupScaleLandscape: 650,
  },
  x4pro: {
    label: "X4 Pro",
    name: "XTEINK X4 Pro",
    w: 480,
    h: 800,
    blackImg: x4proBlack,
    blackFallback: x4proBlackFallback,
    whiteImg: x4proWhite,
    whiteFallback: x4proWhiteFallback,
    screen: { top: 6.8, left: 10.2, width: 79, height: 82 },
    screenLandscape: { top: 25.2, left: 11.8, width: 81.5, height: 49 },
    mockupScale: 394,
    mockupScaleLandscape: 638,
  },
};

export const DEFAULT_ADJ: Adjustments = {
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  sepia: 0,
};