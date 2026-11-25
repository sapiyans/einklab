import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  imageSrc: string;
  crop: Crop | undefined;
  aspect: number;
  filterCss: string;
  cfgName: string;
  outW: number;
  outH: number;
  model: string;
  orientation: string;
  imgRef: React.RefObject<HTMLImageElement | null>;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onCropChange: (c: PixelCrop) => void;
  onCropComplete: (c: PixelCrop) => void;
};

export function CropEditor({
  imageSrc,
  crop,
  aspect,
  filterCss,
  cfgName,
  outW,
  outH,
  model,
  orientation,
  imgRef,
  onImageLoad,
  onCropChange,
  onCropComplete,
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Corte</CardTitle>
        <span className="text-xs text-muted-foreground">
          {cfgName} • {outW}×{outH}
        </span>
      </CardHeader>
      <CardContent>
        <div
          className="relative w-full bg-muted rounded-md flex items-center justify-center min-h-100 max-h-180"
        >
          <ReactCrop
            key={`${model}-${orientation}`}
            crop={crop}
            onChange={(_, pc) => {
              onCropChange(pc);
              onCropComplete(pc);
            }}
            onComplete={onCropComplete}
            aspect={aspect}
            ruleOfThird
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="edição"
              onLoad={onImageLoad}
              style={{
                filter: filterCss,
                WebkitFilter: filterCss,
                maxHeight: 520,
                maxWidth: "100%",
                display: "block",
              }}
            />
          </ReactCrop>
        </div>
      </CardContent>
    </Card>
  );
}