import type { ScreensaverQuery } from "@/api/screensaver/screensavers";
import type { Screensaver } from "./types";

export type GallerySnapshot = {
  key: string;
  search: string;
  filters: ScreensaverQuery;
  items: Screensaver[];
  page: number;
  count: number;
  scrollY: number;
};

let snapshot: GallerySnapshot | null = null;

export const galleryStore = {
  save(key: string, patch: Partial<Omit<GallerySnapshot, "key">>) {
    const base: GallerySnapshot =
      snapshot?.key === key
        ? snapshot
        : {
            key,
            search: "",
            filters: {},
            items: [],
            page: 1,
            count: 0,
            scrollY: 0,
          };
    snapshot = { ...base, ...patch, key };
  },
  get(key: string): GallerySnapshot | null {
    return snapshot?.key === key ? snapshot : null;
  },
};
