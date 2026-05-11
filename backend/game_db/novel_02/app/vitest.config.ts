import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx", "test/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/core/**/*.ts", "src/game/**/*.ts"],
      exclude: ["**/*.spec.ts", "**/*.d.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@core": resolve(__dirname, "src/core"),
      "@data": resolve(__dirname, "src/data"),
      "@game": resolve(__dirname, "src/game"),
      "@ui": resolve(__dirname, "src/ui"),
    },
  },
});
