import { CATEGORY_COLORS, CATEGORY_LABELS, RESOURCE_LABELS } from "./constants";
import { NODE_HEIGHT, NODE_WIDTH, type PositionedTech } from "./layout";
import type { ResourceKind } from "./types";

type TechNodeCardProps = {
  item: PositionedTech;
  selected: boolean;
  dimmed: boolean;
  onSelect: (techId: string) => void;
};

function costSummary(cost: Partial<Record<ResourceKind, number>>): string {
  const parts = Object.entries(cost).map(([kind, value]) => `${RESOURCE_LABELS[kind as ResourceKind]} ${value}`);
  return parts.length ? parts.join(" · ") : "無成本";
}

export function TechNodeCard({ item, selected, dimmed, onSelect }: TechNodeCardProps) {
  const { tech, x, y } = item;
  const accent = CATEGORY_COLORS[tech.category];
  const className = ["tech-node", selected ? "is-selected" : "", dimmed ? "is-dimmed" : ""].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={className}
      style={{ left: x, top: y, width: NODE_WIDTH, height: NODE_HEIGHT, borderColor: selected ? "var(--gold)" : accent }}
      onClick={() => onSelect(tech.id)}
      title={tech.name}
    >
      <span className="tech-node-bar" style={{ background: accent }} />
      <span className="tech-node-body">
        <span className="tech-node-head">
          <strong>{tech.name}</strong>
          <em style={{ color: accent }}>{CATEGORY_LABELS[tech.category]}</em>
        </span>
        <small>{costSummary(tech.cost)}</small>
      </span>
    </button>
  );
}
