import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Adjustments } from "../types";
import { AdjustSlider } from "./AdjustSlider";

type Props = {
  adj: Adjustments;
  onChange: (key: keyof Adjustments, value: number) => void;
};

export function AdjustmentsPanel({ adj, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ajustes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AdjustSlider
          label="Brilho"
          value={adj.brightness}
          min={0}
          max={200}
          onChange={(v) => onChange("brightness", v)}
          suffix="%"
        />
        <AdjustSlider
          label="Contraste"
          value={adj.contrast}
          min={0}
          max={200}
          onChange={(v) => onChange("contrast", v)}
          suffix="%"
        />
        <Separator />
        <AdjustSlider
          label="Cinza"
          value={adj.grayscale}
          min={0}
          max={100}
          onChange={(v) => onChange("grayscale", v)}
          suffix="%"
        />
        <AdjustSlider
          label="Sépia"
          value={adj.sepia}
          min={0}
          max={100}
          onChange={(v) => onChange("sepia", v)}
          suffix="%"
        />
      </CardContent>
    </Card>
  );
}