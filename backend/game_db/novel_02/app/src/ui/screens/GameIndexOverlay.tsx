import { useMemo, useState } from "react";
import {
  buildGameIndexData,
  CARD_TYPE_LABEL,
  RARITY_LABEL,
  cardStatsLine,
  type GameIndexData,
  type IndexedCard,
  type CardType,
  type Rarity,
} from "../../game/gameIndexData";
import styles from "../styles/gameIndex.module.css";

type TabId = "overview" | "rules" | "heroes" | "cards";
type TypeFilter = "all" | CardType;
type RarityFilter = "all" | Rarity;

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "概覽" },
  { id: "rules", label: "玩法規則" },
  { id: "heroes", label: "英雄/框架" },
  { id: "cards", label: "卡牌庫" },
];

interface Props {
  onClose: () => void;
}

export function GameIndexOverlay({ onClose }: Props): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const data = buildGameIndexData();

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="遊戲實裝索引">
      <section className={styles.panel}>
        <header className={styles.header}>
          <div>
            <h2>實裝索引</h2>
            <p>目前資料直接來自 TypeScript 實裝：卡牌、英雄、規則與敵方內容。</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>關閉</button>
        </header>

        <nav className={styles.tabs} aria-label="索引分頁">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === "overview" && <OverviewTab data={data} />}
          {activeTab === "rules" && <RulesTab data={data} />}
          {activeTab === "heroes" && <HeroesTab data={data} />}
          {activeTab === "cards" && <CardsTab data={data} />}
        </div>
      </section>
    </div>
  );
}

function OverviewTab({ data }: { data: GameIndexData }): JSX.Element {
  return (
    <div className={styles.stack}>
      <div className={styles.statGrid}>
        <StatTile label="總索引卡" value={data.stats.totalCards} note="含敵方與內部召喚" />
        <StatTile label="可用卡池" value={data.stats.playableCards} note="玩家可構築資料" />
        <StatTile label="敵方/內部" value={data.stats.enemyInternalCards} note="巢穴與召喚標記" />
        <StatTile label="英雄" value={data.heroes.length} note="目前可選 Demo 英雄" />
      </div>

      <section className={styles.section}>
        <h3>卡池分組</h3>
        <div className={styles.poolGrid}>
          {data.cardGroups.map((group) => (
            <div key={group.id} className={styles.poolItem}>
              <span>{group.label}</span>
              <strong>{group.total}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.twoCol}>
        <CountPanel title="類型統計" counts={data.stats.byType} labels={CARD_TYPE_LABEL} />
        <CountPanel title="稀有度統計" counts={data.stats.byRarity} labels={RARITY_LABEL} />
      </div>

      <section className={styles.section}>
        <h3>費用曲線</h3>
        <div className={styles.costBars}>
          {Object.entries(data.stats.byCost).map(([cost, count]) => (
            <div key={cost} className={styles.costRow}>
              <span>{cost} 費</span>
              <div className={styles.barTrack}>
                <span style={{ width: `${Math.min(100, Math.max(8, Number(count) * 4))}%` }} />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RulesTab({ data }: { data: GameIndexData }): JSX.Element {
  return (
    <div className={styles.ruleGrid}>
      {data.ruleSections.map((section) => (
        <section key={section.id} className={styles.section}>
          <h3>{section.title}</h3>
          <ul className={styles.cleanList}>
            {section.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function HeroesTab({ data }: { data: GameIndexData }): JSX.Element {
  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <h3>可選英雄</h3>
        <div className={styles.heroGrid}>
          {data.heroes.map(({ hero, race, classFrame, stats }) => (
            <article key={hero.id} className={styles.heroCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>{hero.name}</h4>
                  <p>{race.name} · {classFrame.name} · {hero.rarity}</p>
                </div>
                <span className={styles.idPill}>{hero.id}</span>
              </div>
              <div className={styles.monoLine}>HP {stats.hp} / ATK {stats.atk} / DEF {stats.def} / CMD {stats.cmd}</div>
              <p>{hero.gauge.description}</p>
              <SkillLine title="被動" names={hero.passives.map((skill) => skill.name)} />
              <SkillLine title="主動" names={hero.actives.map((skill) => skill.name)} />
              <SkillLine title="終極" names={[hero.ultimate.name]} />
            </article>
          ))}
        </div>
      </section>

      <div className={styles.twoCol}>
        <section className={styles.section}>
          <h3>種族框架</h3>
          <div className={styles.frameList}>
            {data.races.map((race) => (
              <div key={race.id} className={styles.frameItem}>
                <strong>{race.name}</strong>
                <span>{race.gauge.name} · {race.gauge.max}</span>
                <p>{race.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3>職業框架</h3>
          <div className={styles.frameList}>
            {data.classes.map((classFrame) => (
              <div key={classFrame.id} className={styles.frameItem}>
                <strong>{classFrame.name}</strong>
                <span>{classFrame.keyword}</span>
                <p>{classFrame.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function CardsTab({ data }: { data: GameIndexData }): JSX.Element {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const [poolFilter, setPoolFilter] = useState("all");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCards = useMemo(
    () =>
      data.cards.filter((entry) => {
        if (typeFilter !== "all" && entry.card.type !== typeFilter) return false;
        if (rarityFilter !== "all" && entry.card.rarity !== rarityFilter) return false;
        if (poolFilter !== "all" && entry.poolId !== poolFilter) return false;
        if (normalizedQuery && !entry.searchableText.includes(normalizedQuery)) return false;
        return true;
      }),
    [data.cards, normalizedQuery, poolFilter, rarityFilter, typeFilter],
  );

  return (
    <div className={styles.stack}>
      <div className={styles.filters}>
        <label>
          搜尋
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名稱、ID、效果或分類" />
        </label>
        <label>
          類型
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}>
            <option value="all">全部</option>
            {Object.entries(CARD_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          稀有度
          <select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value as RarityFilter)}>
            <option value="all">全部</option>
            {Object.entries(RARITY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          卡池
          <select value={poolFilter} onChange={(event) => setPoolFilter(event.target.value)}>
            <option value="all">全部</option>
            {data.cardGroups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
          </select>
        </label>
      </div>

      <div className={styles.resultLine}>顯示 {filteredCards.length} / {data.cards.length} 張</div>

      <div className={styles.cardGrid}>
        {filteredCards.map((entry) => <CardTile key={`${entry.poolId}:${entry.card.id}`} entry={entry} />)}
      </div>
    </div>
  );
}

function CardTile({ entry }: { entry: IndexedCard }): JSX.Element {
  const stats = cardStatsLine(entry.card);

  return (
    <article className={styles.indexCard}>
      <div className={styles.cardHeader}>
        <div>
          <h4>{entry.card.name}</h4>
          <p>{entry.card.id} · {entry.poolLabel}</p>
        </div>
        <span className={styles.cost}>{entry.card.cost}</span>
      </div>
      <div className={styles.badges}>
        <span>{entry.typeLabel}</span>
        <span>{entry.rarityLabel}</span>
        {stats && <span>{stats}</span>}
      </div>
      <ul className={styles.effectList}>
        {entry.effectSummary.map((line) => <li key={line}>{line}</li>)}
      </ul>
    </article>
  );
}

function CountPanel<T extends string>({ title, counts, labels }: { title: string; counts: Record<T, number>; labels: Record<T, string> }): JSX.Element {
  return (
    <section className={styles.section}>
      <h3>{title}</h3>
      <div className={styles.countList}>
        {Object.entries(counts).map(([key, count]) => (
          <div key={key} className={styles.countRow}>
            <span>{labels[key as T]}</span>
            <strong>{Number(count)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatTile({ label, value, note }: { label: string; value: number; note: string }): JSX.Element {
  return (
    <div className={styles.statTile}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}

function SkillLine({ title, names }: { title: string; names: string[] }): JSX.Element {
  return (
    <div className={styles.skillLine}>
      <span>{title}</span>
      <p>{names.join("、")}</p>
    </div>
  );
}
