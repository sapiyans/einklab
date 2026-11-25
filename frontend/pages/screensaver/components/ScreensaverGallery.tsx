import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Upload,
  Search,
  ImageIcon,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { Screensaver } from "../types";
import { galleryStore } from "../galleryStore";
import { useScreensaverGallery } from "../hooks/useScreensaverGallery";
import type { ScreensaverQuery } from "@/api/screensaver/screensavers";
import { ImageUploadDialog } from "./ImageUploadDialog";
import { links } from "@/config/links";

type Props = {
  onOpenScreensaver: (s: Screensaver) => void;
  onUpload?: (file: File) => Promise<void> | void;
  initialFilters?: Omit<ScreensaverQuery, "page" | "search">;
  onClearFilters?: () => void;
  hideUpload?: boolean;
  persist?: boolean;
};

export const MODEL_OPTIONS = [
  { value: "all", label: "Modelo" },
  { value: "x3", label: "X3" },
  { value: "x4", label: "X4" },
  { value: "x4-pro", label: "X4 Pro" },
];

export const COLOR_OPTIONS = [
  { value: "all", label: "Cor" },
  { value: "black", label: "Preto" },
  { value: "white", label: "Branco" },
];

export const ORIENTATION_OPTIONS = [
  { value: "all", label: "Orientação" },
  { value: "portrait", label: "Retrato" },
  { value: "landscape", label: "Paisagem" },
];

export const getLabel = <T extends readonly { value: string; label: string }[]>(
  options: T,
  value: string | undefined,
) => options.find((o) => o.value === (value ?? "all"))?.label ?? "Todos";

function GalleryImage({
  src,
  fallbackSrc,
  alt,
}: {
  src: string;
  fallbackSrc?: string;
  alt: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const finalSrc = errored && fallbackSrc ? fallbackSrc : src;

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    let cancelled = false;

    const markLoaded = () => {
      if (cancelled) return;
      // decode() garante que a imagem tá pintável ANTES de mostrar
      if (typeof img.decode === "function") {
        img.decode().then(
          () => {
            if (!cancelled) setLoaded(true);
          },
          () => {
            if (!cancelled) setLoaded(true);
          },
        );
      } else {
        setLoaded(true);
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener("load", markLoaded, { once: true });
      return () => {
        cancelled = true;
        img.removeEventListener("load", markLoaded);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [finalSrc]);

  return (
    <>
      <div
        className="absolute inset-0 bg-muted-foreground/10 animate-pulse transition-opacity duration-500"
        style={{ opacity: loaded ? 0 : 1 }}
        aria-hidden
      />

      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!errored && fallbackSrc) setErrored(true);
          else setLoaded(true);
        }}
        className={`relative w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.06] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}

export function ScreensaverGallery({
  onOpenScreensaver,
  onUpload,
  initialFilters,
  onClearFilters,
  hideUpload,
  persist = false,
}: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const urlAtMountRef = useRef(
    typeof window === "undefined"
      ? ""
      : window.location.pathname + window.location.search,
  );

  const stableFilters = useMemo(
    () => initialFilters,
    [JSON.stringify(initialFilters)],
  );

  const {
    items,
    page,
    count,
    totalPages,
    search,
    setSearch,
    filters,
    setFilters,
    isLoading,
    error,
    goToPage,
    refresh,
    persistKey,
    restoredScrollY,
  } = useScreensaverGallery({ initialFilters: stableFilters, persist });

  const hasMore = page < totalPages;

  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, [persist]);

  useEffect(() => {
    if (!persist) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const current = window.location.pathname + window.location.search;
        if (current !== urlAtMountRef.current) return;
        galleryStore.save(persistKey, { scrollY: window.scrollY });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [persist, persistKey]);

  useEffect(() => {
    if (restoredScrollY == null || restoredScrollY <= 0) return;
    let raf = 0;
    const startedAt = performance.now();
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max >= restoredScrollY - 1 || performance.now() - startedAt > 1500) {
        window.scrollTo(0, Math.min(restoredScrollY, Math.max(0, max)));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [restoredScrollY]);

  useEffect(() => {
    if (!isLoading) setHasLoadedOnce(true);
  }, [isLoading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading) {
          goToPage(page + 1);
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, page, goToPage]);

  const activeTags = Array.isArray(filters.tags)
    ? filters.tags
    : filters.tags
      ? [filters.tags]
      : [];

  const hasFilters =
    activeTags.length > 0 ||
    !!filters.model_name ||
    !!filters.color ||
    !!filters.orientation;

  const removeTag = (t: string) => {
    const next = activeTags.filter((x) => x !== t);
    setFilters((f) => ({ ...f, tags: next.length ? next : undefined }));
  };

  const clearAll = () => {
    setFilters({});
    onClearFilters?.();
  };

  const openUpload = () => setUploadOpen(true);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">Galeria</h2>
            {count > 0 && (
              <span className="text-sm text-muted-foreground">
                · {count} {count === 1 ? "item" : "itens"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Explore screensavers da comunidade ou envie o seu.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={isLoading}
            title="Atualizar"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          {!hideUpload && (
            <Button size="sm" onClick={openUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, autor, tag..."
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={filters.model_name ?? "all"}
            onValueChange={(v) =>
              setFilters((f) => ({
                ...f,
                model_name: v === "all" ? undefined : v,
              }))
            }
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue>
                {getLabel(MODEL_OPTIONS, filters.model_name)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.color ?? "all"}
            onValueChange={(v) =>
              setFilters((f) => ({
                ...f,
                color: v === "all" ? undefined : v,
              }))
            }
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue>
                {getLabel(COLOR_OPTIONS, filters.color)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.orientation ?? "all"}
            onValueChange={(v) =>
              setFilters((f) => ({
                ...f,
                orientation: v === "all" ? undefined : v,
              }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue>
                {getLabel(ORIENTATION_OPTIONS, filters.orientation)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ORIENTATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeTags.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer font-normal"
              onClick={() => removeTag(t)}
            >
              #{t}
              <X className="w-3 h-3 opacity-60" />
            </Badge>
          ))}

          {filters.model_name && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer font-normal"
              onClick={() =>
                setFilters((f) => ({ ...f, model_name: undefined }))
              }
            >
              {getLabel(MODEL_OPTIONS, filters.model_name)}
              <X className="w-3 h-3 opacity-60" />
            </Badge>
          )}

          {filters.color && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer font-normal"
              onClick={() => setFilters((f) => ({ ...f, color: undefined }))}
            >
              {getLabel(COLOR_OPTIONS, filters.color)}
              <X className="w-3 h-3 opacity-60" />
            </Badge>
          )}

          {filters.orientation && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer font-normal"
              onClick={() =>
                setFilters((f) => ({ ...f, orientation: undefined }))
              }
            >
              {getLabel(ORIENTATION_OPTIONS, filters.orientation)}
              <X className="w-3 h-3 opacity-60" />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            Limpar
          </Button>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!hasLoadedOnce && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <div className="aspect-3/4 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasLoadedOnce && !isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="rounded-2xl bg-muted p-5">
            <ImageIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1 max-w-sm">
            <p className="font-medium">Nenhum resultado</p>
            <p className="text-sm text-muted-foreground">
              {search
                ? `Nada encontrado para "${search}".`
                : hasFilters
                  ? "Tente ajustar os filtros."
                  : "Nenhum screensaver publicado ainda."}
            </p>
          </div>
          {hasFilters ? (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Limpar filtros
            </Button>
          ) : (
            !hideUpload && (
              <Button size="sm" onClick={openUpload}>
                <Sparkles className="w-4 h-4 mr-2" />
                Seja o primeiro a enviar
              </Button>
            )
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in-50 duration-300">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (persist) {
                  galleryStore.save(persistKey, { scrollY: window.scrollY });
                }
                onOpenScreensaver(item);
              }}
              className="group text-left focus:outline-none focus-visible:outline-none"
            >
              <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted ring-1 ring-border/60 transition-all duration-300 group-hover:ring-2 group-hover:ring-primary/70 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 cursor-pointer">
                <GalleryImage
                  src={links.base + (item.thumbnail ?? item.file)}
                  fallbackSrc={links.base + item.file}
                  alt=""
                />

                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />

                <div className="absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-xs font-semibold text-white line-clamp-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                    {item.name}
                  </p>
                  {item.author && (
                    <p className="text-[10px] text-white/90 line-clamp-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                      por {item.author}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-2.5 space-y-1">
                <p className="text-sm font-medium line-clamp-1 leading-tight">
                  {item.name}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="uppercase tracking-wide font-medium">
                    {item.model_name}
                  </span>
                  <span className="opacity-40">·</span>
                  <span>
                    {item.orientation === "portrait" ? "Retrato" : "Paisagem"}
                  </span>
                  {item.author && (
                    <>
                      <span className="opacity-40">·</span>
                      <span className="truncate">{item.author}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-10" aria-hidden />}

      {isLoading && items.length > 0 && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <ImageUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onConfirm={async (file) => {
          await onUpload?.(file);
          refresh();
        }}
      />
    </div>
  );
}