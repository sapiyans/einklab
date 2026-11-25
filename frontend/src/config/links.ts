import { usePageContext } from "vike-react/usePageContext";
import { isSection, type Section } from "./sections";

const stripSlash = (value: string) => value.replace(/\/+$/, "");

const siteUrl = stripSlash(import.meta.env.VITE_SITE_URL);
const apiHost = stripSlash(import.meta.env.VITE_HOST_API);
const staticUrl = import.meta.env.VITE_STATIC_URL;

export const links = {
  github: "https://github.com/sapiyans",
  email: "mailto:sapiensinsight@gmail.com",

  /** Origem pública do site (usada em URLs absolutas de SEO/OG). */
  site: siteUrl,
  /** Origem que serve os arquivos de mídia (upload do backend). */
  base: apiHost,
  base_static: siteUrl + staticUrl,
  base_media: apiHost + "/media/",
} as const;

export function useLinks() {
  const pageContext = usePageContext();
  const isServer = typeof window === "undefined";
  const headers = (pageContext as { headers?: Record<string, string> }).headers;

  const host = (isServer ? headers?.host ?? "" : window.location.host).toLowerCase();
  const protocol = isServer
    ? `${headers?.["x-forwarded-proto"] ?? "http"}:`
    : window.location.protocol;
  const pathname = isServer ? pageContext.urlPathname : window.location.pathname;

  const [hostname, port] = host.split(":");
  const fromHost = hostname.split(".")[0];
  const fromPath = pathname.split("/")[1] ?? "";
  const hostSection = isSection(fromHost) ? fromHost : null;
  const current: Section | null = hostSection ?? (isSection(fromPath) ? fromPath : null);

  const domain = hostSection ? hostname.slice(hostSection.length + 1) : hostname;

  const href = (section: Section, path: string) => {
    if (current === section) return path;
    if (!domain) return `/${section}${path === "/" ? "" : path}`;
    return `${protocol}//${section}.${domain}${port ? `:${port}` : ""}${path}`;
  };

  return {
    screensaver: href("screensaver", "/"),
    xteink_screensavers: href("screensaver", "/"),
    xteink_screensaver_editor: href("screensaver", "/editor"),
    xteink_screensaver_screensaver_post: href("screensaver", "/post/"),
    firmware: href("firmware", "/"),
  };
}
