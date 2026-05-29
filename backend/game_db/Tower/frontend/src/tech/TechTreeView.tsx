import { useMemo, useState } from "react";
import { FlaskConical, GitBranch, Sparkles } from "lucide-react";

import { TECH_CATALOG } from "./catalog";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EFFECT_LABELS,
  RACE_GROUP_COLORS,
  RACE_GROUP_LABELS,
  RESOURCE_LABELS,
  SIDE_LABELS
} from "./constants";
import { TechGraph } from "./TechGraph";
import { ancestorChain, layoutTechTree } from "./layout";
import type { RaceGroup, ResourceKind, Side, TechCategory } from "./types";

const RACE_GROUPS: RaceGroup[] = ["greenskins", "fleshes", "fures", "undeads", "demons"];

function formatEffect(value: number): string {
  if (value === 1) return "—";
  if (value > 1 && value < 3) return `+${Math.round((value - 1) * 100)}%`;
  if (value > 0 && value < 1) return `+${Math.round(value * 100)}%`;
  return String(value);
}

export function TechTreeView() {
  const [side, setSide] = useState<Side>("human");
  // 魔物端子分類：evolution | monster_research
  const [monsterTab, setMonsterTab] = useState<"evolution" | "monster_research">("evolution");
  // 進化樹的種族篩選；null = 顯示全部
  const [raceGroup, setRaceGroup] = useState<RaceGroup | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const layoutFilter = useMemo(() => {
    if (side === "human") return undefined;
    if (monsterTab === "monster_research") return { category: "monster_research" as TechCategory };
    return raceGroup
      ? { category: "evolution" as TechCategory, raceGroup }
      : { category: "evolution" as TechCategory };
  }, [side, monsterTab, raceGroup]);

  const layout = useMemo(() => layoutTechTree(TECH_CATALOG, side, layoutFilter), [side, layoutFilter]);
  const selected = selectedId ? TECH_CATALOG[selectedId] ?? null : null;
  const highlightedIds = useMemo(
    () => (selectedId ? ancestorChain(TECH_CATALOG, selectedId) : new Set<string>()),
    [selectedId]
  );

  const changeSide = (next: Side) => {
    setSide(next);
    setMonsterTab("evolution");
    setRaceGroup(null);
    setSelectedId(null);
  };

  const changeMonsterTab = (tab: "evolution" | "monster_research") => {
    setMonsterTab(tab);
    setRaceGroup(null);
    setSelectedId(null);
  };

  const changeRaceGroup = (group: RaceGroup | null) => {
    setRaceGroup(group);
    setSelectedId(null);
  };

  return (
    <div className="tech-shell">
      <main className="tech-stage">
        {/* ── 頂部工具列 ── */}
        <div className="tech-toolbar">
          <h2>
            <GitBranch size={16} />
            科技樹
          </h2>
          <div className="segmented tech-side-toggle">
            {(["human", "monster"] as Side[]).map((value) => (
              <button
                key={value}
                type="button"
                className={side === value ? "is-active" : ""}
                onClick={() => changeSide(value)}
              >
                {SIDE_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        {/* ── 魔物端子工具列 ── */}
        {side === "monster" && (
          <div className="tech-sub-toolbar">
            <div className="segmented">
              {(["evolution", "monster_research"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={monsterTab === tab ? "is-active" : ""}
                  onClick={() => changeMonsterTab(tab)}
                  style={monsterTab === tab ? { borderColor: CATEGORY_COLORS[tab] } : undefined}
                >
                  {CATEGORY_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* 進化樹才顯示種族篩選 */}
            {monsterTab === "evolution" && (
              <div className="race-filter">
                <button
                  type="button"
                  className={raceGroup === null ? "race-chip is-active" : "race-chip"}
                  onClick={() => changeRaceGroup(null)}
                >
                  全部
                </button>
                {RACE_GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={raceGroup === g ? "race-chip is-active" : "race-chip"}
                    style={raceGroup === g ? { background: RACE_GROUP_COLORS[g], borderColor: RACE_GROUP_COLORS[g] } : { borderColor: RACE_GROUP_COLORS[g] }}
                    onClick={() => changeRaceGroup(raceGroup === g ? null : g)}
                  >
                    {RACE_GROUP_LABELS[g]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <TechGraph layout={layout} selectedId={selectedId} highlightedIds={highlightedIds} onSelect={setSelectedId} />
      </main>

      {/* ── 右欄：節點詳情 ── */}
      <aside className="right-rail tech-rail">
        <section className="inspector-section">
          <h2>
            <FlaskConical size={16} />
            節點
          </h2>
          {selected ? (
            <div className="node-detail">
              <header>
                <strong>{selected.name}</strong>
                <span>
                  {CATEGORY_LABELS[selected.category]} · {SIDE_LABELS[selected.side]}
                  {selected.race_group ? ` · ${RACE_GROUP_LABELS[selected.race_group]}` : ""}
                </span>
              </header>
              {selected.description ? <p className="tech-desc">{selected.description}</p> : null}

              <div className="tech-block">
                <h3>成本</h3>
                <div className="chip-list">
                  {Object.entries(selected.cost).length ? (
                    Object.entries(selected.cost).map(([kind, value]) => (
                      <span key={kind}>
                        {RESOURCE_LABELS[kind as ResourceKind]} {value}
                      </span>
                    ))
                  ) : (
                    <span>無</span>
                  )}
                </div>
              </div>

              <div className="tech-block">
                <h3>
                  <Sparkles size={13} /> 效果
                </h3>
                <dl className="detail-grid">
                  {Object.entries(selected.effects).map(([key, value]) => (
                    <div key={key}>
                      <dt>{EFFECT_LABELS[key] ?? key}</dt>
                      <dd>{formatEffect(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="tech-block">
                <h3>前置</h3>
                {selected.prerequisites.length ? (
                  <div className="neighbor-list">
                    {selected.prerequisites.map((prereqId) => {
                      const prereq = TECH_CATALOG[prereqId];
                      return (
                        <button key={prereqId} type="button" onClick={() => setSelectedId(prereqId)}>
                          <span>{prereq?.name ?? prereqId}</span>
                          <small>{prereq ? CATEGORY_LABELS[prereq.category] : ""}</small>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="chip-list">
                    <span>無前置</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">點選節點以檢視詳情</div>
          )}
        </section>
      </aside>
    </div>
  );
}
