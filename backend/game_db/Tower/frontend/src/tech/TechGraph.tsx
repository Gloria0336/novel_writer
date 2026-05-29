import { useMemo } from "react";

import { TechNodeCard } from "./TechNodeCard";
import { NODE_HEIGHT, NODE_WIDTH, type TechLayout } from "./layout";

type TechGraphProps = {
  layout: TechLayout;
  selectedId: string | null;
  highlightedIds: Set<string>;
  onSelect: (techId: string | null) => void;
};

// 自前置節點右緣 → 下游節點左緣的水平貝茲曲線。
function edgePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const x1 = from.x + NODE_WIDTH;
  const y1 = from.y + NODE_HEIGHT / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_HEIGHT / 2;
  const dx = Math.max(32, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function TechGraph({ layout, selectedId, highlightedIds, onSelect }: TechGraphProps) {
  const positions = useMemo(() => new Map(layout.nodes.map((node) => [node.tech.id, node])), [layout.nodes]);
  const hasHighlight = highlightedIds.size > 0;

  return (
    <div className="tech-graph-viewport" onClick={() => onSelect(null)}>
      <div
        className="tech-graph-canvas"
        style={{ width: layout.width, height: layout.height }}
        onClick={(event) => event.stopPropagation()}
      >
        <svg className="tech-edge-layer" width={layout.width} height={layout.height} aria-hidden="true">
          {layout.edges.map((edge) => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            if (!from || !to) return null;
            const active = hasHighlight && highlightedIds.has(edge.from) && highlightedIds.has(edge.to);
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                className={`tech-edge${active ? " is-active" : ""}${hasHighlight && !active ? " is-dimmed" : ""}`}
                d={edgePath(from, to)}
              />
            );
          })}
        </svg>
        {layout.nodes.map((item) => (
          <TechNodeCard
            key={item.tech.id}
            item={item}
            selected={item.tech.id === selectedId}
            dimmed={hasHighlight && !highlightedIds.has(item.tech.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
