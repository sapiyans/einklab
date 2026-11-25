import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import vike from "vike/plugin";

export default defineConfig(({ command, mode }) => { 
  const env = loadEnv(mode, ".", "");

  const apiTarget = env.API_PROXY_TARGET;

  return {
    base: env.BASE_PATH,
    plugins: [vike(), react()],
    server: {
      host: env.DEV_HOST,
      port: Number(env.DEV_PORT),
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/admin": { target: apiTarget, changeOrigin: true },
      },
    },
    preview: {
      host: env.DEV_HOST,
      port: Number(env.PREVIEW_PORT),
    },
  };
});
