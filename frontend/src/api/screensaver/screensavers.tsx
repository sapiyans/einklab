import { Screensaver } from "@/../pages/screensaver/types";
import api from "../apiConfig";
import endpoints from "../endpoints";

export type ScreensaverQuery = {
  page?: number;
  page_size?: number;
  search?: string;
  model_name?: string;
  color?: string;
  orientation?: string;
  tags?: string | string[];
  ordering?: string;
};

export type Paginated<T> = {
  items: T[];
  count: number;
};

export const fetchScreensavers = async (
  params: ScreensaverQuery = {},
  signal?: AbortSignal
): Promise<Paginated<Screensaver>> => {
  const query: Record<string, unknown> = {};

  if (params.page != null) query.page = params.page;
  if (params.page_size != null) query.page_size = params.page_size;
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.model_name) query.model_name = params.model_name;
  if (params.color) query.color = params.color;
  if (params.orientation) query.orientation = params.orientation;
  if (params.ordering) query.ordering = params.ordering;

  if (params.tags) {
    const tags = Array.isArray(params.tags) ? params.tags : [params.tags];
    const cleaned = tags.filter(Boolean);
    if (cleaned.length === 1) query.tags = cleaned[0];
    else if (cleaned.length > 1) query.tags = cleaned.join(",");
  }

  const response = await api.get(endpoints.xteinkScreensavers, {
    params: query,
    signal,
  });

  return response.data;
};

export const fetchScreensaver = async (
  id: string,
  signal?: AbortSignal
): Promise<Screensaver> => {
  const response = await api.get(endpoints.xteinkScreensaver(), {
    signal,
    params: {id:id}
  });
  return response.data;
};

export const createScreensaver = async (formData: FormData) => {
  const response = await api.post(endpoints.xteinkScreensaver(), formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const countScreensaverView = async (id: string): Promise<void> => {
  await api.post(endpoints.xteinkScreensaverView(id));
};

export const countScreensaverDownload = async (id: string): Promise<void> => {
  await api.post(endpoints.xteinkScreensaverDownload(id));
};