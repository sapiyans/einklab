const stripSlash = (value: string) => value.replace(/\/+$/, "");

const siteUrl = stripSlash(import.meta.env.VITE_SITE_URL ?? "");
const apiHost = stripSlash(import.meta.env.VITE_HOST_API ?? "");
const staticUrl = import.meta.env.VITE_STATIC_URL ?? "/";

export const links = {
  github: "https://github.com/sapiyans",
  email: "mailto:sapiensinsight@gmail.com",

  /** Origem pública do site (usada em URLs absolutas de SEO/OG). */
  site: siteUrl,
  /** Origem que serve os arquivos de mídia (upload do backend). */
  base: apiHost,
  base_static: siteUrl + staticUrl,
  base_media: apiHost + "/media/",

  // Rotas internas do app
  screensaver: "/screensaver",
  xteink_screensavers: "/screensaver",
  xteink_screensaver_editor: "/screensaver/editor",
  xteink_screensaver_screensaver_post: "/screensaver/post/",
  firmware: "/firmware",
} as const;
