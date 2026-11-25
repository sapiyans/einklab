import { useCallback, useEffect, useRef, useState } from "react";
import type { Screensaver } from "../types";
import {
  fetchScreensavers,
  type ScreensaverQuery,
} from "@/api/screensaver/screensavers";

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 400;

type UseGalleryOptions = {
  initialFilters?: Omit<ScreensaverQuery, "page" | "search">;
  pageSize?: number;
};

export function useScreensaverGallery(options: UseGalleryOptions = {}) {
  const { initialFilters, pageSize = PAGE_SIZE } = options;

  const [items, setItems] = useState<Screensaver[]>([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState<ScreensaverQuery>(initialFilters ?? {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

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

  const filtersString = JSON.stringify(filters);

  useEffect(() => {
    load(1, debounced, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, filtersString, load]);

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
  };
}