/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOST_API: string;
  readonly VITE_STATIC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
