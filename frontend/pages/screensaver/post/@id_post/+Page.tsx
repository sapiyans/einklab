import { useEffect, useState } from "react";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-react/usePageContext";
import {
  fetchScreensaver,
  countScreensaverView,
} from "@/api/screensaver/screensavers";
import { ScreensaverDetail } from "../../components";
import { editorStore } from "../../store";
import type { Screensaver } from "../../types";
import { links, useLinks } from "@/config/links";

function ScreensaverDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* header / botão voltar */}
      <div className="h-8 w-32 rounded-md bg-muted" />

      <div className="grid gap-6 md:grid-cols-2">
        {/* preview da imagem */}
        <div className="aspect-[4/3] w-full rounded-xl bg-muted" />

        {/* infos laterais */}
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded-md bg-muted" />
          <div className="h-4 w-1/2 rounded-md bg-muted" />

          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>

          <div className="space-y-2 pt-4">
            <div className="h-4 w-full rounded-md bg-muted" />
            <div className="h-4 w-5/6 rounded-md bg-muted" />
            <div className="h-4 w-2/3 rounded-md bg-muted" />
          </div>

          {/* botões */}
          <div className="flex gap-3 pt-6">
            <div className="h-10 w-32 rounded-md bg-muted" />
            <div className="h-10 w-32 rounded-md bg-muted" />
          </div>
        </div>
      </div>

      {/* lista de relacionados */}
      <div className="space-y-3 pt-8">
        <div className="h-6 w-40 rounded-md bg-muted" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square w-full rounded-lg bg-muted" />
              <div className="h-4 w-3/4 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const pageContext = usePageContext();
  const idPost =
    typeof window === "undefined"
      ? pageContext.routeParams.id_post
      : window.location.pathname.replace(/\/+$/, "").split("/").pop()!;

  const [item, setItem] = useState<Screensaver | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setItem(null);

    fetchScreensaver(idPost)
      .then((data) => {
        if (cancelled) return;
        setItem(data);

        setItem((prev) =>
          prev ? { ...prev, views: prev.views + 1 } : prev
        );

        countScreensaverView(data.id)
          .then((updated) => {
            if (cancelled || !updated) return;
            setItem((prev) =>
              prev ? { ...prev, views: updated.views } : updated
            );
          })
          .catch(() => {
            if (cancelled) return;
            setItem((prev) =>
              prev ? { ...prev, views: Math.max(0, prev.views - 1) } : prev
            );
          });
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idPost]);

  const nav = useLinks();

  const openEditorFromScreensaver = async (screensaver: Screensaver) => {
  // Usa o ORIGINAL se existir, senão o file final
  const caminho = screensaver.original_file || screensaver.file;
  if (!caminho) {
    console.error("Screensaver sem arquivo pra editar");
    return;
  }

  const url = `${links.base}${caminho.startsWith("/") ? "" : "/"}${caminho}`;
  const res = await fetch(url);
  const blob = await res.blob();
  const reader = new FileReader();
  reader.onload = () => {
    editorStore.loadImage(reader.result as string, {
      model: screensaver.model_name as any,
      deviceColor: screensaver.color as any,
      orientation: screensaver.orientation as any,
      source: { kind: "screensaver", item: screensaver },
    });
    navigate(nav.xteink_screensaver_editor);
  };
  reader.readAsDataURL(blob);
};

  // 1) Carregando → skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 overflow-anchor-none">
        <div className="max-w-6xl mx-auto space-y-6">
          <ScreensaverDetailSkeleton />
        </div>
      </div>
    );
  }

  // 2) Não encontrado → mensagem + link
  if (notFound || !item) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <p>Post não encontrado</p>
        <button
          type="button"
          onClick={() => navigate(nav.screensaver)}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Ver todos os screensavers
        </button>
      </div>
    );
  }

  // 3) Pronto
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 overflow-anchor-none">
      <div className="max-w-6xl mx-auto space-y-6">
        <ScreensaverDetail
          item={item}
          onBack={() => window.history.back()}
          onEdit={() => openEditorFromScreensaver(item)}
          onOpenScreensaver={(next) =>
            navigate(nav.xteink_screensaver_screensaver_post + next.id)
          }
        />
      </div>
    </div>
  );
}