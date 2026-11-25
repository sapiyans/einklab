# E-InkLab — Frontend

App [Vike](https://vike.dev) + React + Tailwind CSS v4 para o toolkit E-InkLab.

## Páginas

| Rota | Descrição |
| --- | --- |
| `/` e `/xteink` | Landing com os serviços |
| `/screensaver` | Galeria de screensavers da comunidade |
| `/screensaver/editor` | Editor de screensaver (corte, ajustes, export BMP/PNG) |
| `/screensaver/post/:id` | Detalhe de um screensaver |
| `/firmware` | Comparativo de firmwares XTEINK |

## Rodando

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # gera dist/client + dist/server
npm run preview
```

O backend Django deve estar em `http://127.0.0.1:8010` (veja
[`../backend/README.md`](../backend/README.md)).

## Variáveis de ambiente

Os valores ficam em `.env.development` (dev) e `.env.production` (build).
Copie `.env.example` se precisar recriar.

| Variável | Descrição |
| --- | --- |
| `VITE_HOST_API` | Origem do backend (API e `/media`). Ex.: `http://127.0.0.1:8010/` |
| `VITE_SITE_URL` | Origem pública do site, usada em URL absoluta de SEO/Open Graph |
| `VITE_STATIC_URL` | Prefixo das imagens estáticas |
| `BASE_PATH` | `base` do Vite (`/` em dev, `/static/` no build) |
| `DEV_HOST` / `DEV_PORT` / `PREVIEW_PORT` | Servidor de dev/preview |
| `API_PROXY_TARGET` | Destino do proxy `/api`, `/admin` e `/media` |

Apenas variáveis com prefixo `VITE_` chegam ao navegador — nunca coloque
segredos nelas.

## Estrutura

- `pages/` — rotas (arquivos `+Page`, `+Head`, `+Layout` do Vike)
- `src/api/` — cliente axios e endpoints da API
- `src/components/ui/` — componentes shadcn/ui (Tailwind v4)
- `src/config/links.ts` — URLs e rotas usadas pelo app
- `src/layouts/globals.css` — tema e tokens de design
- `src/images/xteink/` — mockups dos dispositivos X3/X4/X4 Pro
