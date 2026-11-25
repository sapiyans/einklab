import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, ImageIcon, X, Clipboard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File) => Promise<void> | void;
  accept?: string;
  maxSizeMB?: number;
};

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/webp";

export function ImageUploadDialog({
  open,
  onOpenChange,
  onConfirm,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 10,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const acceptedTypes = accept.split(",").map((t) => t.trim());

  const validateFile = useCallback(
    (f: File): string | null => {
      if (!acceptedTypes.includes(f.type)) {
        return `Formato não suportado. Use: ${acceptedTypes
          .map((t) => t.replace("image/", "").toUpperCase())
          .join(", ")}`;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        return `Arquivo muito grande (máx. ${maxSizeMB}MB)`;
      }
      return null;
    },
    [acceptedTypes, maxSizeMB]
  );

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setFile(f);

      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    },
    [validateFile]
  );

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    setIsDragging(false);
    dragCounter.current = 0;
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  // Reset quando fechar
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // 🔑 Ctrl+V global enquanto o dialog está aberto
  useEffect(() => {
    if (!open) return;

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) {
            e.preventDefault();
            handleFile(f);
            return;
          }
        }
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, handleFile]);

  // Drag & drop — usa counter pra evitar flicker nos filhos
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items?.length) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleConfirm = async () => {
    if (!file) return;
    try {
      setIsSubmitting(true);
      await onConfirm(file);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar screensaver</DialogTitle>
          <DialogDescription>
            Arraste uma imagem, clique para procurar ou cole com{" "}
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border bg-muted">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border bg-muted">
              V
            </kbd>
          </DialogDescription>
        </DialogHeader>

        {/* Dropzone */}
        <div
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => !preview && inputRef.current?.click()}
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all cursor-pointer",
            "min-h-[240px] flex items-center justify-center overflow-hidden",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-muted/40",
            preview && "cursor-default border-solid"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview"
                className="max-h-[300px] w-auto object-contain"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 transition"
                aria-label="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 right-2 text-[11px] text-white/90 bg-black/50 rounded px-2 py-1 truncate">
                {file?.name} · {(file!.size / 1024).toFixed(0)} KB
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <div
                className={cn(
                  "rounded-2xl p-4 transition-colors",
                  isDragging ? "bg-primary/10" : "bg-muted"
                )}
              >
                {isDragging ? (
                  <Upload className="w-7 h-7 text-primary" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDragging
                    ? "Solte para enviar"
                    : "Arraste uma imagem aqui"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ou{" "}
                  <span className="text-primary underline underline-offset-2">
                    clique para procurar
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clipboard className="w-3 h-3" />
                <span>Ctrl+V também funciona</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!file || isSubmitting}>
            {isSubmitting && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}