/// <reference types="vite/client" />

import type { TowerMap } from "./types";

declare global {
  interface Window {
    __TOWER_MAP__?: TowerMap;
  }
}
