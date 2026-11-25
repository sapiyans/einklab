import { useState, useRef, useCallback, useEffect } from "react";
import type { Crop, PixelCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { navigate } from "vike/client/router";

import { DEFAULT_ADJ, MODELS } from "../constants";
import {
  Adjustments,
  DeviceColor,
  ModelOption,
  Orientation,
  ScreenBox,
  CanvasSettings,
  DEFAULT_CANVAS,
  ScreensaverMeta,
  Screensaver,
} from "../types";
import {
  buildFilter,
  canvasToBmp24Bit,
  rotateImageSrc,
  buildPaddedImage,
  downloadBlob,
} from "../utils";
import { useScreensavers } from "../hooks/useScreensavers";
import {
  AdjustmentsPanel,
  CropEditor,
  ModelSelector,
  PreviewCard,
  RotationPanel,
  PaddingPanel,
  PublishModal,
} from "../components";
import { editorStore } from "../store";
import { useLinks } from "@/config/links";

export default function Page() {
  const links = useLinks();
  const seed = editorStore.getState();

  const [imageSrc, setImageSrc] = useState<string | null>(seed.imageSrc);
  const [rotation, setRotation] = useState(seed.rotation);
  const [liveRotation, setLiveRotation] = useState(seed.rotation);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [adj, setAdj] = useState<Adjustments>(seed.adj);
  const [model, setModel] = useState<ModelOption>(seed.model);
  const [deviceColor, setDeviceColor] = useState<DeviceColor>(seed.deviceColor);
  const [orientation, setOrientation] = useState<Orientation>(seed.orientation);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(seed.canvasSettings);
  const [paddedSrc, setPaddedSrc] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const { publish, isPublishing, error: publishError } = useScreensavers();

  const [screen, setScreen] = useState<ScreenBox>(MODELS[seed.model].screen);
  const [screenLandscape, setScreenLandscape] = useState<ScreenBox>(MODELS[seed.model].screenLandscape);
  const [mockupScale, setMockupScale] = useState<number>(MODELS[seed.model].mockupScale);
  const [mockupScaleLandscape, setMockupScaleLandscape] = useState<number>(MODELS[seed.model].mockupScaleLandscape);
  const [dpr, setDpr] = useState(1);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalSrcRef = useRef<string | null>(seed.originalSrc);
  const originalFileRef = useRef<File | null>(null); // Referência para guardar o arquivo original que subiu
  const lastCanvasParamsRef = useRef<string>("");

  useEffect(() => {
    if (!seed.imageSrc) navigate(links.xteink_screensavers);
  }, []);

  const cfg = MODELS[model];
  const outW = orientation === "portrait" ? cfg.w : cfg.h;
  const outH = orientation === "portrait" ? cfg.h : cfg.w;
  const aspect = outW / outH;
  const filterCss = buildFilter(adj);

  const deviceImage = deviceColor === "black" ? cfg.blackImg : cfg.whiteImg;
  const deviceFallback = deviceColor === "black" ? cfg.blackFallback : cfg.whiteFallback;
  const activeMockupScale = orientation === "landscape" ? mockupScaleLandscape : mockupScale;
  const physicalScale = activeMockupScale / dpr;

  const displaySrc = canvasSettings.enabled && paddedSrc ? paddedSrc : imageSrc;

  useEffect(() => {
    const updateDPR = () => {
      const next = window.devicePixelRatio || 1;
      setDpr((prev) => (prev === next ? prev : next));
    };
    updateDPR();
    window.addEventListener("resize", updateDPR);
    return () => window.removeEventListener("resize", updateDPR);
  }, []);

  useEffect(() => {
    setScreen(MODELS[model].screen);
    setScreenLandscape(MODELS[model].screenLandscape);
    setMockupScale(MODELS[model].mockupScale);
    setMockupScaleLandscape(MODELS[model].mockupScaleLandscape);
  }, [model]);

  useEffect(() => {
    if (!canvasSettings.enabled || !imageSrc) {
      setPaddedSrc(null);
      lastCanvasParamsRef.current = "";
      return;
    }
    const params = `${imageSrc.length}-${canvasSettings.paddingPercent}-${canvasSettings.zoom}`;
    if (lastCanvasParamsRef.current === params) return;
    lastCanvasParamsRef.current = params;

    let cancelled = false;
    const run = async () => {
      try {
        const { url } = await buildPaddedImage(imageSrc, canvasSettings.paddingPercent, canvasSettings.zoom);
        if (!cancelled) setPaddedSrc(url);
      } catch (err) {
        console.error("Erro ao gerar moldura:", err);
      }
    };
    const t = setTimeout(run, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [canvasSettings.enabled, canvasSettings.paddingPercent, canvasSettings.zoom, imageSrc]);

  const computeInitialCrop = useCallback(
    (imgW: number, imgH: number): Crop => {
      const cropH = imgW / aspect;
      const finalH = Math.min(cropH, imgH);
      const finalW = finalH * aspect;
      return { unit: "px", x: (imgW - finalW) / 2, y: (imgH - finalH) / 2, width: finalW, height: finalH };
    },
    [aspect]
  );

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(computeInitialCrop(width, height));
  };

  useEffect(() => {
    if (!displaySrc) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        const { width, height } = img;
        if (width && height) {
          const cropH = width / aspect;
          const finalH = Math.min(cropH, height);
          const finalW = finalH * aspect;
          const newCrop: Crop = {
            unit: "px",
            x: (width - finalW) / 2,
            y: (height - finalH) / 2,
            width: finalW,
            height: finalH,
          };
          setCrop(newCrop);
          setCompletedCrop({
            unit: "px",
            x: newCrop.x ?? 0,
            y: newCrop.y ?? 0,
            width: newCrop.width ?? 0,
            height: newCrop.height ?? 0,
          });
        }
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [aspect, displaySrc]);

  const handleRotate = async (deltaDeg: number) => {
    if (!imageSrc || isRotating) return;
    setIsRotating(true);
    try {
      const newRotation = (((rotation + deltaDeg) % 360) + 360) % 360;
      const base = originalSrcRef.current ?? imageSrc;
      const { url } = await rotateImageSrc(base, newRotation);
      setImageSrc(url);
      setRotation(newRotation);
      setLiveRotation(newRotation);
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (err) {
      console.error("Erro ao rotacionar:", err);
    } finally {
      setIsRotating(false);
    }
  };

  const handleSetLiveRotation = (v: number) => setLiveRotation(v);

  const handleCommitRotation = async (target: number) => {
    if (!imageSrc || isRotating) return;
    const normalizedTarget = ((target % 360) + 360) % 360;
    if (normalizedTarget === rotation) {
      setLiveRotation(rotation);
      return;
    }
    setIsRotating(true);
    try {
      const base = originalSrcRef.current ?? imageSrc;
      const { url } = await rotateImageSrc(base, normalizedTarget);
      setImageSrc(url);
      setRotation(normalizedTarget);
      setLiveRotation(normalizedTarget);
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (err) {
      console.error("Erro ao rotacionar:", err);
      setLiveRotation(rotation);
    } finally {
      setIsRotating(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Salva a referência real do arquivo upado
    originalFileRef.current = file;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      originalSrcRef.current = src;
      setImageSrc(src);
      setRotation(0);
      setLiveRotation(0);
      setPreviewUrl(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setAdj(DEFAULT_ADJ);
      setCanvasSettings(DEFAULT_CANVAS);
      setPaddedSrc(null);
      lastCanvasParamsRef.current = "";
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Mantido para o usuário baixar em formato BMP
  const buildBmpBlob = (): Blob | null => {
    const img = imgRef.current;
    if (!img || !completedCrop?.width || !completedCrop?.height) return null;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.filter = buildFilter(adj);
    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, outW, outH
    );
    return canvasToBmp24Bit(canvas);
  };

  // Função para pegar o blob original (do upload ou cache da imagem store)
  const getOriginalBlob = async (): Promise<Blob | null> => {
    if (originalFileRef.current) return originalFileRef.current;
    
    // Fallback caso a imagem venha pré-carregada do store em base64
    if (originalSrcRef.current) {
      try {
        const res = await fetch(originalSrcRef.current);
        return await res.blob();
      } catch (e) {
        console.error("Erro ao recuperar blob original do src:", e);
      }
    }
    return null;
  };

  const generatePreview = useCallback(() => {
    const img = imgRef.current;
    if (!img || !completedCrop?.width || !completedCrop?.height) return;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.filter = buildFilter(adj);
    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, outW, outH
    );
    setPreviewUrl(canvas.toDataURL("image/png"));
  }, [completedCrop, adj, outW, outH]);

  useEffect(() => {
    const t = setTimeout(generatePreview, 200);
    return () => clearTimeout(t);
  }, [generatePreview]);

  const handleActualDownload = () => {
    const blob = buildBmpBlob();
    if (!blob) return;
    downloadBlob(blob, `xteink-${model}-${deviceColor}-${orientation}-${outW}x${outH}.bmp`);
  };

  const handleDownloadClick = () => setPublishOpen(true);

  // Publish: envia o BMP final e o arquivo original
  const handlePublish = async (meta: ScreensaverMeta): Promise<Screensaver | null> => {
    const finalBlob = buildBmpBlob();
    const originalBlob = await getOriginalBlob();

    if (!finalBlob || !originalBlob) {
      console.error("Imagens não estão prontas para publicação.");
      return null;
    }

    return publish(finalBlob, originalBlob, meta, { model, color: deviceColor, orientation });
  };

  const handleReset = () => {
    setAdj(DEFAULT_ADJ);
    setRotation(0);
    setLiveRotation(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setPreviewUrl(null);
    setCanvasSettings(DEFAULT_CANVAS);
    setPaddedSrc(null);
    lastCanvasParamsRef.current = "";
    if (originalSrcRef.current) {
      setImageSrc(originalSrcRef.current);
    } else if (imgRef.current) {
      onImageLoad({ currentTarget: imgRef.current } as any);
    }
  };

  const setAdjust = (key: keyof Adjustments, v: number) => setAdj((p) => ({ ...p, [key]: v }));

  const backToGallery = () => {
    editorStore.reset();
    navigate(links.xteink_screensavers);
  };

  const handleBack = () => {
    const source = editorStore.getState().editSource;
    editorStore.reset();
    if (source.kind === "screensaver") {
      navigate(links.xteink_screensaver_screensaver_post + source.item.id);
      return;
    }
    navigate(links.xteink_screensavers);
  };

  if (!imageSrc) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando imagem...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Editor XTEINK</h1>
        </header>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
          <div className="contents lg:col-span-2 lg:block lg:space-y-4">
            <div className="order-1 lg:order-0">
              <CropEditor
                imageSrc={displaySrc ?? imageSrc}
                crop={crop}
                aspect={aspect}
                filterCss={filterCss}
                cfgName={cfg.name}
                outW={outW}
                outH={outH}
                model={model}
                orientation={orientation}
                imgRef={imgRef}
                onImageLoad={onImageLoad}
                onCropChange={setCrop}
                onCropComplete={setCompletedCrop}
                liveRotation={liveRotation}
              />
            </div>
            <div className="order-6 lg:order-0">
              <PreviewCard
                previewUrl={previewUrl}
                cfg={cfg}
                outW={outW}
                outH={outH}
                orientation={orientation}
                deviceImage={deviceImage}
                deviceFallback={deviceFallback}
                screen={screen}
                screenLandscape={screenLandscape}
                physicalScale={physicalScale}
                onDownload={handleDownloadClick}
              />
            </div>
          </div>

          <div className="contents lg:block lg:space-y-4">
            <div className="order-2 lg:order-0">
              <ModelSelector
                model={model}
                deviceColor={deviceColor}
                orientation={orientation}
                outW={outW}
                outH={outH}
                onModelChange={setModel}
                onColorChange={setDeviceColor}
                onOrientationChange={setOrientation}
              />
            </div>
            <div className="order-3 lg:order-0">
              <PaddingPanel
                value={canvasSettings}
                onToggle={() => setCanvasSettings((p) => ({ ...p, enabled: !p.enabled }))}
                onChange={(patch) => setCanvasSettings((p) => ({ ...p, ...patch }))}
              />
            </div>
            <div className="order-4 lg:order-0">
              <AdjustmentsPanel adj={adj} onChange={setAdjust} />
            </div>
            <div className="order-5 lg:order-0">
              <RotationPanel
                rotation={liveRotation}
                isRotating={isRotating}
                onRotate={handleRotate}
                onSetRotation={handleSetLiveRotation}
                onCommitRotation={handleCommitRotation}
              />
            </div>
            <div className="order-7 lg:order-0 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
              <Button variant="ghost" onClick={backToGallery}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Trocar imagem
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        previewUrl={previewUrl}
        isPublishing={isPublishing}
        error={publishError}
        onPublish={handlePublish}
        onDownload={handleActualDownload}
      />
    </div>
  );
}