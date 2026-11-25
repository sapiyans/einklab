Generated with [vike.dev/new](https://vike.dev/new) ([version 697](https://www.npmjs.com/package/create-vike/v/0.0.697)) using this command:

```sh
npm create vike@latest --- --react
```

## Contents

- [Vike](#vike)
  - [Plus files](#plus-files)
  - [Routing](#routing)
  - [SSR](#ssr)
  - [HTML Streaming](#html-streaming)

## Vike

This app is ready to start. It's powered by [Vike](https://vike.dev) and [React](https://react.dev/learn).

### Plus files

[The + files are the interface](https://vike.dev/config) between Vike and your code.

- [`+config.ts`](https://vike.dev/settings) — Settings (e.g. `<title>`)
- [`+Page.tsx`](https://vike.dev/Page) — The `<Page>` component
- [`+data.ts`](https://vike.dev/data) — Fetching data (for your `<Page>` component)
- [`+Layout.tsx`](https://vike.dev/Layout) — The `<Layout>` component (wraps your `<Page>` components)
- [`+Head.tsx`](https://vike.dev/Head) - Sets `<head>` tags
- [`/pages/_error/+Page.tsx`](https://vike.dev/error-page) — The error page (rendered when an error occurs)
- [`+onPageTransitionStart.ts`](https://vike.dev/onPageTransitionStart) and `+onPageTransitionEnd.ts` — For page transition animations

### Routing

[Vike's built-in router](https://vike.dev/routing) lets you choose between:

- [Filesystem Routing](https://vike.dev/filesystem-routing) (the URL of a page is determined based on where its `+Page.jsx` file is located on the filesystem)
- [Route Strings](https://vike.dev/route-string)
- [Route Functions](https://vike.dev/route-function)

### SSR

SSR is enabled by default. You can [disable it](https://vike.dev/ssr) for all or specific pages.

### HTML Streaming

You can [enable/disable HTML streaming](https://vike.dev/stream) for all or specific pages.


### Environment variables

The Vite config reads variables from `.env` files (see [`.env.example`](.env.example)):

- `.env.development` — used by `npm run dev`
- `.env.production` — used by `npm run build` / `npm run preview`
- `.env.local` — personal overrides, **not** committed (highest priority)

Only variables prefixed with `VITE_` are exposed to the browser (via
`import.meta.env`); everything else is available only inside `vite.config.ts`
— never put secrets in `VITE_*` variables, they end up in the bundle.

| Variable | Where | Description |
| --- | --- | --- |
| `VITE_HOST_API` | client | Backend API base URL |
| `VITE_STATIC_URL` | client | Prefix where static images are served |
| `BASE_PATH` | config | App base path (default: `/static/` on build, `/` on dev) |
| `DEV_HOST` / `DEV_PORT` | config | Dev server host/port (default `localhost:3000`) |
| `PREVIEW_PORT` | config | `vike preview` port (default `4173`) |
| `API_PROXY_TARGET` | config | Proxy target for `/api` and `/admin` in dev |
