import { useCallback, useEffect, useRef, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import type { Screensaver } from "../types";
import { galleryStore } from "../galleryStore";
import {
  fetchScreensavers,
  type ScreensaverQuery,
} from "@/api/screensaver/screensavers";

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 400;

type UseGalleryOptions = {
  initialFilters?: Omit<ScreensaverQuery, "page" | "search">;
  pageSize?: number;
  persist?: boolean;
};

export function useScreensaverGallery(options: UseGalleryOptions = {}) {
  const { initialFilters, pageSize = PAGE_SIZE, persist = false } = options;

  const pageContext = usePageContext();
  const persistKey =
    pageContext.urlPathname + (pageContext.urlParsed.searchOriginal ?? "");

  const [items, setItems] = useState<Screensaver[]>([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState<ScreensaverQuery>(initialFilters ?? {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoredScrollY, setRestoredScrollY] = useState<number | null>(null);

  const reqIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const skipMountLoadRef = useRef(false);
  const restoredParamsRef = useRef<string | null>(null);
  const skipFirstSaveRef = useRef(true);

  const filtersString = JSON.stringify(filters);
  const paramsKey = JSON.stringify([debounced, filtersString]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!persist) return;
    const snap = galleryStore.get(persistKey);
    if (!snap || snap.items.length === 0) return;

    skipMountLoadRef.current = true;
    restoredParamsRef.current = JSON.stringify([
      snap.search,
      JSON.stringify(snap.filters),
    ]);

    setItems(snap.items);
    setPage(snap.page);
    setCount(snap.count);
    setSearch(snap.search);
    setDebounced(snap.search);
    setFilters(snap.filters);
    if (snap.scrollY > 0) setRestoredScrollY(snap.scrollY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(
    async (p: number, q: string, f: ScreensaverQuery) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const reqId = ++reqIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchScreensavers(
          { page: p, page_size: pageSize, search: q, ...f },
          controller.signal,
        );
        if (reqId !== reqIdRef.current) return;

        setItems((prev) =>
          p === 1 ? data.items : [...prev, ...data.items],
        );
        setCount(data.count ?? data.items.length);
        setPage(p);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (reqId !== reqIdRef.current) return;
        console.error(err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        if (reqId === reqIdRef.current) setIsLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    if (skipMountLoadRef.current) {
      skipMountLoadRef.current = false;
      restoredParamsRef.current = null;
      return;
    }
    if (restoredParamsRef.current === paramsKey) {
      restoredParamsRef.current = null;
      return;
    }
    load(1, debounced, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, filtersString, load]);

  useEffect(() => {
    if (!persist) return;
    if (skipFirstSaveRef.current) {
      skipFirstSaveRef.current = false;
      return;
    }
    galleryStore.save(persistKey, { search, filters, items, page, count });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist, persistKey, search, filtersString, items, page, count]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const goToPage = useCallback(
    (p: number) => load(p, debounced, filters),
    [load, debounced, filters],
  );

  const refresh = useCallback(
    () => load(1, debounced, filters),
    [load, debounced, filters],
  );

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return {
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
  };
}
