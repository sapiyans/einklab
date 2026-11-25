import type { Config } from "vike/types";

export default {
  // Rota dinâmica: o HTML base é servido pelo fallback (SPA), os dados
  // são carregados no cliente a partir da API.
  prerender: false,
} satisfies Config;
