import { RotateCw, RotateCcw, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  rotation: number;
  isRotating: boolean;
  onRotate: (delta: number) => void;
  onSetRotation?: (value: number) => void;
  onCommitRotation?: (value: number) => void;
};

const STEP = 90;
const HALF_STEP = 45;
const FINE_STEP = 0.5;

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

export function RotationPanel({
  rotation,
  isRotating,
  onRotate,
  onSetRotation,
  onCommitRotation,
}: Props) {
  const normalized = ((rotation % 360) + 360) % 360;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    onSetRotation?.(next);
  };

  const handleCommit = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const next = Number((e.target as HTMLInputElement).value);
    onCommitRotation?.(next);
  };

  const nudge = (delta: number) => {
    onRotate(delta);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rotação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
            0°
          </span>
          <input
            type="range"
            min={0}
            max={359.5}
            step={0.5}
            value={normalized}
            onChange={handleChange}
            onPointerUp={handleCommit}
            onTouchEnd={handleCommit}
            onKeyUp={handleCommit}
            disabled={isRotating}
            className="flex-1 accent-primary cursor-pointer"
          />
          <span className="text-sm tabular-nums w-14 text-right">
            {fmt(normalized)}°
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => nudge(-FINE_STEP)}
            disabled={isRotating}
            className="flex-1"
            title="-0,5°"
          >
            <Minus className="w-4 h-4" />
            <span className="ml-1 text-[11px]">0,5°</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nudge(FINE_STEP)}
            disabled={isRotating}
            className="flex-1"
            title="+0,5°"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-1 text-[11px]">0,5°</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRotate(-STEP)}
            disabled={isRotating}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            -90°
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRotate(STEP)}
            disabled={isRotating}
          >
            <RotateCw className="w-4 h-4 mr-1" />
            +90°
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRotate(-HALF_STEP)}
            disabled={isRotating}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            -45°
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRotate(HALF_STEP)}
            disabled={isRotating}
          >
            <RotateCw className="w-4 h-4 mr-1" />
            +45°
          </Button>
        </div>

        {isRotating && (
          <p className="text-xs text-muted-foreground text-center">
            Rotacionando…
          </p>
        )}
      </CardContent>
    </Card>
  );
}