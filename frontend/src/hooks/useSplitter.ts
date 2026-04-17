import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface SplitterOptions {
  direction: "horizontal" | "vertical";
  value: number;
  min: number;
  max: number;
  onChange: (nextValue: number) => void;
}

export function useSplitter(options: SplitterOptions) {
  const { direction, value, min, max, onChange } = options;
  const dragState = useRef<{ startValue: number; startPosition: number } | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState.current) {
        return;
      }

      const currentPosition = direction === "horizontal" ? event.clientX : event.clientY;
      const delta = currentPosition - dragState.current.startPosition;
      const nextValue = direction === "horizontal" ? dragState.current.startValue + delta : dragState.current.startValue - delta;
      onChange(Math.max(min, Math.min(max, nextValue)));
    };

    const handlePointerUp = () => {
      dragState.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [direction, max, min, onChange]);

  const startDragging = (event: ReactPointerEvent<HTMLElement>) => {
    dragState.current = {
      startValue: value,
      startPosition: direction === "horizontal" ? event.clientX : event.clientY,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
  };

  return {
    startDragging,
  };
}
