import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  logLevel: "info",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/groq": {
        target: "https://api.groq.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/groq/, ""),
      },
      "/api": {
        target:
          process.env.VITE_BASE44_APP_BASE_URL ||
          "https://forgebodyai.base44.app",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy) => {
          proxy.on("error", (err, _req, res) => {
            if (!res.headersSent) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: true }));
            }
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            if (
              req.url?.includes("/analytics/") ||
              req.url?.includes("/track/")
            ) {
              proxyRes.statusCode = 200;
            }
          });
        },
      },
    },
  },
});
