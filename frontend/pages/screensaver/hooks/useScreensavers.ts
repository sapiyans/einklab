import { useCallback, useState } from "react";
import type { Screensaver, ScreensaverMeta } from "../types";
import { createScreensaver } from "@/api/screensaver/screensavers";
import { getErrorMessage } from "@/api/lib/errors";
import { toast } from "sonner";

export function useScreensavers() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = useCallback(
    async (
      cropBlob: Blob,        // PNG do recorte final
      originalBlob: Blob,     // Arquivo original
      meta: ScreensaverMeta,
      deviceMeta: { model: string; color: string; orientation: string }
    ): Promise<Screensaver | null> => {
      setIsPublishing(true);
      setError(null);

      try {
        const formData = new FormData();

        formData.append("crop", cropBlob, "screensaver.png");
        
        const originalName = originalBlob instanceof File ? originalBlob.name : "original.png";
        formData.append("original_file", originalBlob, originalName);

        formData.append("name", meta.name);
        formData.append("author", meta.author);
        formData.append("description", meta.description);
        formData.append("tags", meta.tags.join(","));
        formData.append("model_name", deviceMeta.model);
        formData.append("color", deviceMeta.color);
        formData.append("orientation", deviceMeta.orientation);

        const created = await createScreensaver(formData);
        return created;
      } catch (err) {
        const message = getErrorMessage(err);
        console.error("Erro ao publicar:", err);
        setError(message);
        try {
          toast.error(message);
        } catch {}
        return null;
      } finally {
        setIsPublishing(false);
      }
    },
    []
  );

  return { isPublishing, error, publish };
}