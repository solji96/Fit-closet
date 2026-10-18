import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createPushApiMiddleware } from "./server/push-api.mjs";

function webPushApi(): Plugin {
  const attach = (server: { middlewares: Connect.Server }) => {
    server.middlewares.use(createPushApiMiddleware());
  };
  return {
    name: "web-push-api",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [react(), webPushApi()],
    test: {
      environment: "node",
    },
  };
});

