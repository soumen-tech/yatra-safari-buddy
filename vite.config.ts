import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { apiDevMiddleware } from "./server/dev-middleware";

export default defineConfig({
  vite: {
    plugins: [apiDevMiddleware()],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
