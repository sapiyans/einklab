import logoUrl from "@/../public/images/sapiensin.svg";
import capa  from "@/../public/images/xteink-screensavers.png";
import { links } from "@/config/links";

export function Head() {
  return (
    <>
      <title>Screensaver Xteink — Corte, ajuste e exporte BMP ou PNG | Sapiens In</title>
      <link rel="icon" href={logoUrl} />
      <link rel="apple-touch-icon" href={logoUrl} />

      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="Corte, ajuste e exporte BMP ou PNG para XTEINK X3, X4, Classic ou X4 Pro. Explore screensavers da comunidade ou envie o seu"
      />
      <meta
        name="keywords"
        content="Xteink, XTEINK X3, XTEINK X4, XTEINK Classic, XTEINK X4 Pro, screensaver, BMP, PNG, CrossPoint, e-reader, papéis de parede, Sapiens in, saiyans, sapiyans"
      />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#000000" />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Sapiens in" />
      <meta
        property="og:title"
        content="Screensaver Xteink — Corte, ajuste e exporte BMP ou PNG | Sapiens In"
      />
      <meta
        property="og:description"
        content="Corte, ajuste e exporte BMP ou PNG para XTEINK X3, X4, Classic ou X4 Pro. Explore screensavers da comunidade ou envie o seu."
      />
      <meta property="og:image" content={links.site+capa} />
      <meta property="og:image:alt" content="Screensaver Xteink — Sapiens in" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="pt_BR" />
      <meta
        property="og:url"
        content={`${links.site}/screensaver`}
      />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Screensaver Xteink — Corte, ajuste e exporte BMP ou PNG | Sapiens In"
      />
      <meta
        name="twitter:description"
        content="Corte, ajuste e exporte BMP ou PNG para XTEINK X3, X4, Classic ou X4 Pro. Explore screensavers da comunidade ou envie o seu."
      />
      <meta name="twitter:image" content={links.site+capa} />
      <meta
        name="twitter:image:alt"
        content="Screensaver Xteink — Sapiens in"
      />
    </>
  );
}