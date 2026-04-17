import { STORAGE_PREFIX, STORAGE_SCHEMA_VERSION } from "../utils/constants";

interface PersistedEnvelope<T> {
  schemaVersion: number;
  data: T;
}

function keyFor(scope: string): string {
  return `${STORAGE_PREFIX}:${scope}`;
}

export const storageClient = {
  read<T>(scope: string, fallback: T): T {
    if (typeof window === "undefined") {
      return fallback;
    }

    try {
      const raw = window.localStorage.getItem(keyFor(scope));
      if (!raw) {
        return fallback;
      }

      const parsed = JSON.parse(raw) as PersistedEnvelope<T>;
      if (parsed.schemaVersion !== STORAGE_SCHEMA_VERSION) {
        return fallback;
      }

      return parsed.data;
    } catch {
      return fallback;
    }
  },

  write<T>(scope: string, data: T): void {
    if (typeof window === "undefined") {
      return;
    }

    const payload: PersistedEnvelope<T> = {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      data,
    };
    window.localStorage.setItem(keyFor(scope), JSON.stringify(payload));
  },

  remove(scope: string): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(keyFor(scope));
  },
};

