import type { PageContext } from "vike/types";
import { isSection } from "../src/config/sections";

export default function onBeforeRoute(pageContext: PageContext) {
  const isServer = typeof window === "undefined";
  const headers = (pageContext as { headers?: Record<string, string> }).headers;

  const host = (isServer ? headers?.host ?? "" : window.location.hostname).split(":")[0];
  const pathname = isServer ? pageContext.urlPathname : window.location.pathname;
  const search = isServer ? pageContext.urlParsed.searchOriginal : window.location.search;

  const section = host.split(".")[0];
  if (!isSection(section)) return;

  const inner =
    pathname === `/${section}`
      ? "/"
      : pathname.startsWith(`/${section}/`)
        ? pathname.slice(section.length + 1)
        : pathname;

  const urlLogical = `/${section}${inner === "/" ? "" : inner}${search ?? ""}`;
  if (urlLogical === `${pathname}${search ?? ""}`) return;

  return { pageContext: { urlLogical } };
}
