import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const certDir = path.resolve(__dirname, "../certs");
const certPath = path.resolve(certDir, "localhost-cert.pem");
const keyPath = path.resolve(certDir, "localhost-key.pem");

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  throw new Error(
    `HTTPS certificates are missing in ${certDir}. Run "npm run setup:https" in backend.`
  );
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    https: {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
