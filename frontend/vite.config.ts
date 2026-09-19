import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../react-dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "kanji5-react.js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css")
            ? "kanji5-react.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});