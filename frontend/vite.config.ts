import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../react-dist",
    emptyOutDir: true,
    cssCodeSplit: true,
    manifest: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "kanji5-react.js",
        assetFileNames: (assetInfo) => {
          const sourceNames = [
            assetInfo.name ?? "",
            ...(assetInfo.names ?? []),
            ...(assetInfo.originalFileNames ?? []),
          ];
          if (sourceNames.some((name) => name.includes("dictionary-catalog"))) {
            return "assets/dictionary-catalog-[hash][extname]";
          }
          if (assetInfo.name?.endsWith(".css")) return "kanji5-react.css";
          if (assetInfo.name?.includes("NotoSerifJP-Regular.subset")) return "assets/[name][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});