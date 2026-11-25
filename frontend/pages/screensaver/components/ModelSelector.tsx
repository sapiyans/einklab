import { Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MODELS } from "../constants";
import type { DeviceColor, ModelOption, Orientation } from "../types";

type Props = {
  model: ModelOption;
  deviceColor: DeviceColor;
  orientation: Orientation;
  outW: number;
  outH: number;
  onModelChange: (m: ModelOption) => void;
  onColorChange: (c: DeviceColor) => void;
  onOrientationChange: (o: Orientation) => void;
};

export function ModelSelector({
  model,
  deviceColor,
  orientation,
  outW,
  outH,
  onModelChange,
  onColorChange,
  onOrientationChange,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Modelo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(MODELS) as ModelOption[]).map((key) => {
            const m = MODELS[key];
            const selected = model === key;
            const modelImg =
              deviceColor === "black" ? m.blackImg : m.whiteImg;
            const modelFallback =
              deviceColor === "black" ? m.blackFallback : m.whiteFallback;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onModelChange(key)}
                className={`
                  flex flex-col items-center gap-1 p-1 rounded-md
                  border-2 transition-all
                  ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:border-muted-foreground/30"
                  }
                `}
                title={m.name}
              >
                <picture>
                  <source srcSet={modelImg} type="image/webp" />
                  <img
                    src={modelFallback}
                    alt={m.name}
                    className="h-20 w-auto object-contain"
                    draggable={false}
                  />
                </picture>
                <span
                  className={`text-[10px] font-medium ${
                    selected ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <Label className="text-sm mb-2 block">Cor</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onColorChange("black")}
              title="Preto"
              aria-label="Preto"
              className={`
                w-9 h-9 rounded-full bg-black border-2 transition-all
                flex items-center justify-center
                ${
                  deviceColor === "black"
                    ? "border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                    : "border-muted-foreground/30 hover:border-muted-foreground"
                }
              `}
            >
              {deviceColor === "black" && (
                <span className="w-2 h-2 rounded-full bg-white" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onColorChange("white")}
              title="Branco"
              aria-label="Branco"
              className={`
                w-9 h-9 rounded-full bg-white border-2 transition-all
                flex items-center justify-center
                ${
                  deviceColor === "white"
                    ? "border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                    : "border-muted-foreground/30 hover:border-muted-foreground"
                }
              `}
            >
              {deviceColor === "white" && (
                <span className="w-2 h-2 rounded-full bg-black" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label className="text-sm mb-2 block">Orientação</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={orientation === "portrait" ? "default" : "outline"}
              size="sm"
              onClick={() => onOrientationChange("portrait")}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Retrato
            </Button>
            <Button
              variant={orientation === "landscape" ? "default" : "outline"}
              size="sm"
              onClick={() => onOrientationChange("landscape")}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Paisagem
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t">
          Saída: {outW}×{outH}px • BMP 24-bit ou PNG
        </p>
      </CardContent>
    </Card>
  );
}