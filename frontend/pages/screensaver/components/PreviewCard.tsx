import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ModelConfig, Orientation, ScreenBox } from "../types";

export type DownloadOption = {
  value: string;
  label: string;
  hint?: string;
  onSelect: () => void;
};

type Props = {
  previewUrl: string | null;
  cfg: ModelConfig;
  outW: number;
  outH: number;
  orientation: Orientation;
  deviceImage: string;
  deviceFallback: string;
  screen: ScreenBox;
  screenLandscape: ScreenBox;
  physicalScale: number;
  onDownload: () => void;
  downloadOptions?: DownloadOption[];
};

export function PreviewCard({
  previewUrl,
  cfg,
  outW,
  outH,
  orientation,
  deviceImage,
  deviceFallback,
  screen,
  screenLandscape,
  physicalScale,
  onDownload,
  downloadOptions,
}: Props) {
  const isLandscape = orientation === "landscape";
  const hasFormatMenu = !!downloadOptions?.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">
          Prévia — {cfg.name} • {outW}×{outH}px
        </CardTitle>
        {hasFormatMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="sm" disabled={!previewUrl} />}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Formato do arquivo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {downloadOptions!.map((o) => (
                <DropdownMenuItem key={o.value} onClick={o.onSelect}>
                  <div className="flex flex-col">
                    <span>{o.label}</span>
                    {o.hint && (
                      <span className="text-xs text-muted-foreground">
                        {o.hint}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" onClick={onDownload} disabled={!previewUrl}>
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 px-0 sm:px-6">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            minHeight: 0,
            minWidth: 0,
            fontSize: 0,
            lineHeight: 0,
          }}
        >
          {isLandscape ? (
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 0,
                lineHeight: 0,
                width: `${physicalScale}px`,
                height: `${physicalScale}px`,
                flexShrink: 0,
                flexGrow: 0,
                isolation: "isolate",
                maxWidth: "100%",
              }}
            >
              <picture>
                <source srcSet={deviceImage} type="image/webp" />
                <img
                  src={deviceFallback}
                  alt={cfg.name}
                  className="select-none pointer-events-none"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    height: `${physicalScale}px`,
                    width: "auto",
                    objectFit: "contain",
                    transform: `translate(-50%, -50%) rotate(90deg)`,
                    transformOrigin: "center",
                    transition: "height 0.2s ease",
                    maxWidth: "none",
                    maxHeight: "none",
                    fontSize: 0,
                  }}
                  draggable={false}
                />
              </picture>

              {previewUrl && (
                <img
                  key="preview-landscape"
                  src={previewUrl}
                  alt="Prévia"
                  className="select-none pointer-events-none"
                  style={{
                    position: "absolute",
                    top: `${screenLandscape.top}%`,
                    left: `${screenLandscape.left}%`,
                    width: `${screenLandscape.width}%`,
                    height: `${screenLandscape.height}%`,
                    objectFit: "cover",
                    borderRadius: 8,
                    overflow: "hidden",
                    transition: "none",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                  }}
                  draggable={false}
                />
              )}
            </div>
          ) : (
            <div className="w-full">
              <div
                className="relative mx-auto block w-full leading-none isolate lg:w-auto lg:max-w-[var(--preview-max)]"
                style={{
                  ["--preview-max" as never]: `${physicalScale}px`,
                }}
              >
                <picture>
                  <source srcSet={deviceImage} type="image/webp" />
                  <img
                    src={deviceFallback}
                    alt={cfg.name}
                    className="pointer-events-none block h-auto w-full select-none"
                    draggable={false}
                  />
                </picture>

                {previewUrl && (
                  <img
                    key="preview-portrait"
                    src={previewUrl}
                    alt="Prévia"
                    className="pointer-events-none absolute select-none overflow-hidden rounded-lg"
                    style={{
                      top: `${screen.top}%`,
                      left: `${screen.left}%`,
                      width: `${screen.width}%`,
                      height: `${screen.height}%`,
                      objectFit: "cover",
                      transform: "translateZ(0)",
                      backfaceVisibility: "hidden",
                    }}
                    draggable={false}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}