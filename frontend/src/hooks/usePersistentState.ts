import { useEffect, useState } from "react";
import { storageClient } from "../services/storageClient";

export function usePersistentState<T>(scope: string, fallback: T) {
  const [value, setValue] = useState<T>(() => storageClient.read(scope, fallback));

  useEffect(() => {
    storageClient.write(scope, value);
  }, [scope, value]);

  return [value, setValue] as const;
}

