import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = String(assetInfo.name || "");
          if (name.endsWith(".css")) return "assets/app.css";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
