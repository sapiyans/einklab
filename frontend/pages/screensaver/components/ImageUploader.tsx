import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

export function ImageUploader({ onFileChange, fileInputRef }: Props) {
  return (
    <Card>
      <CardContent className="p-8 flex flex-col items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <Upload className="w-12 h-12 text-muted-foreground" />
        <Button onClick={() => fileInputRef.current?.click()}>
          Selecionar imagem
        </Button>
      </CardContent>
    </Card>
  );
}