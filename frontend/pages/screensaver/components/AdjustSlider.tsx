import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
};

export function AdjustSlider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-blue-600"
        style={{ WebkitAppearance: "none", appearance: "none" }}
      />
    </div>
  );
}