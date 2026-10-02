import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../react-dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    manifest: true,
    rolldownOptions: {
      output: {
        entryFileNames: "kanji5-react.js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css")
            ? "kanji5-react.css"
            : assetInfo.name?.includes("NotoSerifJP-Regular.subset")
              ? "assets/[name][extname]"
              : "assets/[name]-[hash][extname]",
      },
    },
  },
});