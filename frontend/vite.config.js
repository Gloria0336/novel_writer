import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(function (_a) {
    var _b;
    var command = _a.command;
    return ({
        base: command === "build" ? "/novel_writer/" : "/",
        plugins: [react()],
        build: {
            chunkSizeWarningLimit: 900,
            rollupOptions: {
                output: {
                    manualChunks: {
                        react: ["react", "react-dom"],
                        codemirror: ["@uiw/react-codemirror", "@codemirror/lang-markdown", "@codemirror/lang-yaml", "@codemirror/lang-json"],
                    },
                },
            },
        },
        server: {
            host: "127.0.0.1",
            port: Number((_b = process.env.NOVEL_WRITER_FRONTEND_PORT) !== null && _b !== void 0 ? _b : "4173"),
        },
        test: {
            environment: "jsdom",
            globals: true,
            setupFiles: "./src/test/setup.ts",
            css: true,
            exclude: ["e2e/**", "node_modules/**"],
        },
    });
});
