import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: resolve("node_modules/react"),
      "react-dom": resolve("node_modules/react-dom"),
    },
  },
  base: "./",
  build: {
    outDir: "../react-dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "kanji5-react.js",
        advancedChunks: {
          groups: [
            { name: "react-vendor", test: /\/node_modules\/(?:react|react-dom)\// },
          ],
        },
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