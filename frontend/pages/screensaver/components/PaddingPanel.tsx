import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CanvasSettings } from "../types";
import { AdjustSlider } from "./AdjustSlider";

type Props = {
  value: CanvasSettings;
  onToggle: () => void;
  onChange: (patch: Partial<CanvasSettings>) => void;
};

export function PaddingPanel({ value, onToggle, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Moldura branca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant={value.enabled ? "default" : "outline"}
          className="w-full"
          onClick={onToggle}
        >
          <Square className="w-4 h-4 mr-2" />
          {value.enabled ? "Desativar moldura" : "Preencher com branco"}
        </Button>

        {value.enabled && (
          <>
            <AdjustSlider
              label="Moldura (branco)"
              value={value.paddingPercent}
              min={0}
              max={200}
              onChange={(v) => onChange({ paddingPercent: v })}
              suffix="%"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}