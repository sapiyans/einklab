import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

const isProduction = process.env.NODE_ENV === "production";
const baseAssets = isProduction ? "/static/" : undefined;

const config: Config = {
  // https://vike.dev/prerender
  prerender: true,
  baseAssets,

  title: "E-InkLab",
  description:
    "Ferramentas para dispositivos E-Ink XTEINK: editor de screensavers e pesquisa de firmware.",

  extends: [vikeReact],
};

export default config;
