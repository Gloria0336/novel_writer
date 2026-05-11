import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  main: {
    build: {
      outDir: "out/main",
      lib: { entry: "electron/main/index.ts" },
    },
  },
  preload: {
    build: {
      outDir: "out/preload",
      lib: { entry: "electron/preload/index.ts" },
    },
  },
  renderer: {
    root: ".",
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "@core": resolve(__dirname, "src/core"),
        "@data": resolve(__dirname, "src/data"),
        "@game": resolve(__dirname, "src/game"),
        "@ui": resolve(__dirname, "src/ui"),
      },
    },
    build: {
      outDir: "out/renderer",
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
    server: {
      port: 5173,
    },
  },
});
