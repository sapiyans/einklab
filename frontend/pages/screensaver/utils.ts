import type { Adjustments } from "./types";

export const buildFilter = (a: Adjustments) =>
  `brightness(${a.brightness}%) contrast(${a.contrast}%) grayscale(${a.grayscale}%) sepia(${a.sepia}%)`;

export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const rotateImageSrc = async (
  src: string,
  degrees: number
): Promise<{ url: string; width: number; height: number }> => {
  const img = await loadImage(src);
  const rad = (degrees * Math.PI) / 180;
  const isSideways = Math.abs(degrees % 180) === 90;
  const w = isSideways ? img.height : img.width;
  const h = isSideways ? img.width : img.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sem contexto 2D");

  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return { url: canvas.toDataURL("image/png"), width: w, height: h };
};

export const drawImageToCanvas = (img: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sem contexto 2D");

  // fundo branco (e-ink não tem transparência)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  return canvas;
};

export const canvasToBmp24Bit = (canvas: HTMLCanvasElement): Blob => {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sem contexto 2D");

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;

  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true);

  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y;
    const rowStart = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const i = (srcY * width + x) * 4;
      const off = rowStart + x * 3;
      bytes[off] = src[i + 2];
      bytes[off + 1] = src[i + 1];
      bytes[off + 2] = src[i];
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
};

export const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar PNG"));
      },
      "image/png"
    );
  });

/** Converte um HTMLImageElement carregado para BMP 24-bit real. */
export const imageToBmpBlob = (img: HTMLImageElement): Blob =>
  canvasToBmp24Bit(drawImageToCanvas(img));

/** Converte um HTMLImageElement carregado para PNG. */
export const imageToPngBlob = (img: HTMLImageElement): Promise<Blob> =>
  canvasToPngBlob(drawImageToCanvas(img));

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};


export const buildPaddedImage = async (
  src: string,
  paddingPercent: number,
  zoom: number
): Promise<{ url: string; width: number; height: number }> => {
  const img = await loadImage(src);

  const padX = Math.round((img.width * paddingPercent) / 100);
  const padY = Math.round((img.height * paddingPercent) / 100);

  const scale = zoom / 100;

  const innerW = Math.round(img.width * scale);
  const innerH = Math.round(img.height * scale);

  const canvasW = innerW + padX * 2;
  const canvasH = innerH + padY * 2;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sem contexto 2D");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    Math.round((canvasW - innerW) / 2),
    Math.round((canvasH - innerH) / 2),
    innerW,
    innerH
  );

  return { url: canvas.toDataURL("image/png"), width: canvasW, height: canvasH };
};