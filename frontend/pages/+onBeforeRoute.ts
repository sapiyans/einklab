import type { PageContext } from "vike/types";
import { isSection } from "../src/config/sections";

export default function onBeforeRoute(pageContext: PageContext) {
  const host = (
    pageContext.isClientSide
      ? window.location.host
      : pageContext.headers?.host ?? ""
  ).split(":")[0];

  const section = host.split(".")[0];
  if (!isSection(section)) return;

  const pathname = pageContext.urlPathname;
  const search = pageContext.urlParsed.searchOriginal ?? "";

  const inner =
    pathname === `/${section}`
      ? "/"
      : pathname.startsWith(`/${section}/`)
        ? pathname.slice(section.length + 1)
        : pathname;

  const urlLogical = `/${section}${inner === "/" ? "" : inner}${search}`;
  if (urlLogical === `${pathname}${search}`) return;

  return { pageContext: { urlLogical } };
}
