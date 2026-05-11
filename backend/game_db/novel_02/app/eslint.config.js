import importPlugin from "eslint-plugin-import";

export default [
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: { import: importPlugin },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/core",
              from: "./src/data",
              message: "core/ 不可 import data/（core 必須由外部餵入資料）",
            },
            {
              target: "./src/core",
              from: "./node_modules/react",
              message: "core/ 不可依賴 React",
            },
            {
              target: "./src/data",
              from: "./src/game",
              message: "data/ 不可 import game/",
            },
            {
              target: "./src/data",
              from: "./src/ui",
              message: "data/ 不可 import ui/",
            },
            {
              target: "./src/ui",
              from: "./src/core",
              message: "ui/ 不可直接 import core/，請透過 game/ hook",
            },
            {
              target: "./src/ui",
              from: "./src/data",
              message: "ui/ 不可直接 import data/，請透過 game/ hook",
            },
          ],
        },
      ],
    },
  },
];
