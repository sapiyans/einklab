import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import vike from "vike/plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  const apiTarget = env.API_PROXY_TARGET;

  return {
    base: env.BASE_PATH,
    plugins: [vike(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: env.DEV_HOST,
      port: Number(env.DEV_PORT),
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/admin": { target: apiTarget, changeOrigin: true },
        "/media": { target: apiTarget, changeOrigin: true },
      },
    },
    preview: {
      host: env.DEV_HOST,
      port: Number(env.PREVIEW_PORT),
    },
  };
});
