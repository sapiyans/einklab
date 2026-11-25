import { ArrowLeft, Download, Eye, Pencil, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  ExportFormat,
  ModelConfig,
  Orientation,
  Screensaver,
  ScreenBox,
} from "../types";
import { MODELS } from "../constants";
import { downloadBlob, imageToBmpBlob, imageToPngBlob, loadImage } from "../utils";
import {
  COLOR_OPTIONS,
  MODEL_OPTIONS,
  ORIENTATION_OPTIONS,
  getLabel,
  ScreensaverGallery,
} from "./ScreensaverGallery";
import { PreviewCard } from "./PreviewCard";
import { navigate } from "vike/client/router";
import { links, useLinks } from "@/config/links";
import { countScreensaverDownload } from "@/api/screensaver/screensavers";

type Props = {
  item: Screensaver;
  onBack: () => void;
  onEdit: () => void;
  onOpenScreensaver: (s: Screensaver) => void;
};

export function ScreensaverDetail({
  item,
  onBack,
  onEdit,
  onOpenScreensaver,
}: Props) {
  const nav = useLinks();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloads, setDownloads] = useState(item.downloads);
  const [views, setViews] = useState(item.views);

  useEffect(() => {
    setDownloads(item.downloads);
    setViews(item.views);
  }, [item.id, item.downloads, item.views]);

  const handleDownload = async (format: ExportFormat) => {
    if (isDownloading) return;
    setIsDownloading(true);

    setDownloads((v) => v + 1);
    countScreensaverDownload(item.id).catch(() => {
      setDownloads((v) => Math.max(0, v - 1));
    });

    // mesma URL que o PreviewCard usa e que já carrega na tela
    const srcUrl = `${links.base}${item.file}`;

    try {
      const img = await loadImage(srcUrl);
      const blob =
        format === "png" ? await imageToPngBlob(img) : imageToBmpBlob(img);

      downloadBlob(blob, `${item.name || "screensaver"}.${format}`);
    } catch (err) {
      console.error("Erro ao converter/baixar:", err);
      window.open(srcUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const cfg: ModelConfig =
    MODELS[item.model_name as keyof typeof MODELS] ?? MODELS.x4;
  const orientation = item.orientation as Orientation;
  const isLandscape = orientation === "landscape";

  const outW = orientation === "portrait" ? cfg.w : cfg.h;
  const outH = orientation === "portrait" ? cfg.h : cfg.w;

  const deviceImage = item.color === "black" ? cfg.blackImg : cfg.whiteImg;
  const deviceFallback =
    item.color === "black" ? cfg.blackFallback : cfg.whiteFallback;

  const screen: ScreenBox = cfg.screen;
  const screenLandscape: ScreenBox = cfg.screenLandscape;

  const dpr =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const activeMockupScale =
    orientation === "landscape" ? cfg.mockupScaleLandscape : cfg.mockupScale;
  const physicalScale = activeMockupScale / dpr;

  const firstTag = item.tags[0];
  const relatedFilters = useMemo(
    () => (firstTag ? { tags: firstTag } : {}),
    [item.id, firstTag],
  );

  const hasAuthor = !!item.author && item.author.trim().length > 0;
  const hasTags = item.tags.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(nav.xteink_screensavers)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Galeria
        </Button>

        <Button size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <div
        className={
          isLandscape
            ? "grid grid-cols-1 md:grid-cols-3 gap-6"
            : "grid grid-cols-1 md:grid-cols-2 gap-6"
        }
      >
        <div className={isLandscape ? "md:col-span-2" : ""}>
          <PreviewCard
            previewUrl={links.base + item.file}
            cfg={cfg}
            outW={outW}
            outH={outH}
            orientation={orientation}
            deviceImage={deviceImage}
            deviceFallback={deviceFallback}
            screen={screen}
            screenLandscape={screenLandscape}
            physicalScale={physicalScale}
            onDownload={() => handleDownload("bmp")}
            downloadOptions={[
              {
                value: "bmp",
                label: "BMP 24-bit",
                hint: "Firmware original Xteink",
                onSelect: () => handleDownload("bmp"),
              },
              {
                value: "png",
                label: "PNG",
                hint: "Overlay e forks (CrossInk)",
                onSelect: () => handleDownload("png"),
              },
            ]}
          />
        </div>

        <div className="space-y-5">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight leading-tight">
              {item.name}
            </h1>
            {hasAuthor && (
              <p className="text-sm text-muted-foreground">por {item.author}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                {downloads.toLocaleString("pt-BR")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {views.toLocaleString("pt-BR")}
              </span>
            </div>
          </header>

          <Separator />

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Info
              label="Modelo"
              value={getLabel(MODEL_OPTIONS, item.model_name)}
            />
            <Info label="Cor" value={getLabel(COLOR_OPTIONS, item.color)} />
            <Info
              label="Orientação"
              value={getLabel(ORIENTATION_OPTIONS, item.orientation)}
            />
            <Info
              label="Publicado"
              value={new Date(item.created_at).toLocaleDateString("pt-BR")}
            />
          </dl>

          {item.description && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Descrição
              </p>
              <ExpandableText text={item.description} maxLines={3} />
            </div>
          )}

          {hasTags && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="gap-1 font-normal"
                  >
                    <Tag className="w-3 h-3" />
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />
      <ScreensaverGallery
        key={`related-${item.id}`}
        onPickImage={() => {}}
        onOpenScreensaver={onOpenScreensaver}
        initialFilters={relatedFilters}
        hideUpload
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize truncate">{value}</dd>
    </div>
  );
}

function ExpandableText({
  text,
  maxLines = 3,
}: {
  text: string;
  maxLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shouldClamp = text.length > 120;

  return (
    <div className="space-y-1.5">
      <p
        className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed"
        style={
          expanded || !shouldClamp
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </p>
      {shouldClamp && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
}