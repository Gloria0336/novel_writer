import { useMemo, useState, type CSSProperties } from "react";
import type { Card, CardType } from "../../core/types/card";
import type { HeroDefinition, Skill } from "../../core/types/hero";
import { composeHeroStats } from "../../core/stats/compose";
import { getCard } from "../../data/cards";
import { getStarterDeckIds } from "../../data/decks";
import { HEROES } from "../../data/heroes";
import { RACES } from "../../data/races";
import { CLASSES } from "../../data/classes";
import { buildCardFaceModel, CARD_TYPE_COLOR } from "../../game/cardPresentation";
import { CARD_TYPE_LABEL, describeCardEffects } from "../../game/gameIndexData";
import { CardFace } from "../components/CardFace";
import styles from "../styles/deckPreview.module.css";

type TypeFilter = "all" | CardType;

interface Props {
  heroId: string;
  onBack: () => void;
}

interface DeckCardEntry {
  card: Card;
  count: number;
}

const CARD_TYPE_ORDER: CardType[] = ["troop", "action", "spell", "equipment", "field", "device"];
const TYPE_FILTERS: TypeFilter[] = ["all", ...CARD_TYPE_ORDER];

export function DeckPreviewScreen({ heroId, onBack }: Props): JSX.Element {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const hero = HEROES[heroId];
  const deck = useMemo(() => (hero ? buildDeckEntries(hero.id) : []), [hero]);
  const typeCounts = useMemo(() => countByType(deck), [deck]);
  const filteredDeck = useMemo(
    () => (typeFilter === "all" ? deck : deck.filter((entry) => entry.card.type === typeFilter)),
    [deck, typeFilter],
  );

  if (!hero) {
    return (
      <div className={styles.root}>
        <button className={styles.backButton} onClick={onBack}>返回</button>
        <div className={styles.emptyState}>找不到英雄資料：{heroId}</div>
      </div>
    );
  }

  const race = RACES[hero.raceId];
  const classFrame = CLASSES[hero.classId];
  const stats = composeHeroStats(hero, race, classFrame);
  const gaugeName = hero.gauge.name ?? race.gauge.name;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>返回關卡選擇</button>
        <div className={styles.heroSummary}>
          <div>
            <span className={styles.kicker}>英雄牌組預覽</span>
            <h1>{hero.name}</h1>
            <p>{race.name} · {classFrame.name} · {hero.rarity}</p>
          </div>
          <div className={styles.statStrip} aria-label="英雄基礎數值">
            <span>HP {stats.hp}</span>
            <span>ATK {stats.atk}</span>
            <span>DEF {stats.def}</span>
            <span>CMD {stats.cmd}</span>
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <aside className={styles.sidePanel}>
          <section className={styles.panel}>
            <h2>英雄技能</h2>
            <p className={styles.gaugeLine}>{gaugeName} · {hero.gauge.description}</p>
            <SkillGroup title="被動" skills={hero.passives} gaugeName={gaugeName} />
            <SkillGroup title="主動" skills={hero.actives} gaugeName={gaugeName} />
            <SkillGroup title="終極" skills={[hero.ultimate]} gaugeName={gaugeName} />
          </section>

          <section className={styles.panel}>
            <h2>牌組統計</h2>
            <div className={styles.deckTotal}>
              <strong>{deck.reduce((sum, entry) => sum + entry.count, 0)}</strong>
              <span>張起始牌組</span>
            </div>
            <div className={styles.typeCounts}>
              {CARD_TYPE_ORDER.map((type) => (
                <div key={type} className={styles.typeCount}>
                  <span style={{ "--type-color": CARD_TYPE_COLOR[type] } as CSSProperties} />
                  <p>{CARD_TYPE_LABEL[type]}</p>
                  <strong>{typeCounts[type]}</strong>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className={styles.deckSection}>
          <div className={styles.deckToolbar}>
            <div>
              <h2>卡牌內容</h2>
              <p>顯示 {filteredDeck.length} / {deck.length} 種卡牌</p>
            </div>
            <div className={styles.filterBar} aria-label="卡牌類型篩選">
              {TYPE_FILTERS.map((type) => (
                <button
                  key={type}
                  className={typeFilter === type ? styles.activeFilter : ""}
                  onClick={() => setTypeFilter(type)}
                >
                  {type === "all" ? "全部" : CARD_TYPE_LABEL[type]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.cardGrid}>
            {filteredDeck.map((entry) => (
              <DeckCard key={entry.card.id} entry={entry} gaugeName={gaugeName} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function buildDeckEntries(heroId: string): DeckCardEntry[] {
  const counts = new Map<string, number>();
  for (const cardId of getStarterDeckIds(heroId)) {
    counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([cardId, count]) => ({ card: getCard(cardId), count }))
    .sort((a, b) => {
      const typeDiff = CARD_TYPE_ORDER.indexOf(a.card.type) - CARD_TYPE_ORDER.indexOf(b.card.type);
      if (typeDiff !== 0) return typeDiff;
      if (a.card.cost !== b.card.cost) return a.card.cost - b.card.cost;
      return a.card.name.localeCompare(b.card.name, "zh-Hant");
    });
}

function countByType(deck: readonly DeckCardEntry[]): Record<CardType, number> {
  const counts: Record<CardType, number> = {
    troop: 0,
    action: 0,
    spell: 0,
    equipment: 0,
    field: 0,
    device: 0,
  };

  for (const entry of deck) counts[entry.card.type] += entry.count;
  return counts;
}

function DeckCard({ entry, gaugeName }: { entry: DeckCardEntry; gaugeName: string }): JSX.Element {
  const effectLines = describeCardEffects(entry.card, { gaugeName });

  return (
    <article className={styles.cardItem}>
      <div className={styles.cardFaceWrap}>
        <CardFace
          model={buildCardFaceModel(entry.card, {
            metaLine: `${CARD_TYPE_LABEL[entry.card.type]} · ${entry.count} 張`,
            effectLines,
            gaugeName,
          })}
          variant="gallery"
        />
        <span className={styles.copyBadge}>x{entry.count}</span>
      </div>
      <div className={styles.cardText}>
        <div className={styles.cardTitleRow}>
          <h3>{entry.card.name}</h3>
          <span>{entry.card.id}</span>
        </div>
        <ul>
          {effectLines.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    </article>
  );
}

function SkillGroup({ title, skills, gaugeName }: { title: string; skills: readonly Skill[]; gaugeName: string }): JSX.Element {
  if (skills.length === 0) return <div className={styles.skillGroup}><h3>{title}</h3><p className={styles.emptyLine}>無</p></div>;

  return (
    <div className={styles.skillGroup}>
      <h3>{title}</h3>
      {skills.map((skill) => (
        <article key={skill.id} className={styles.skillItem}>
          <div>
            <strong>{skill.name}</strong>
            <span>{formatSkillCost(skill, gaugeName)}</span>
          </div>
          <p>{skill.description}</p>
        </article>
      ))}
    </div>
  );
}

function formatSkillCost(skill: Skill, gaugeName: string): string {
  const costs = [
    skill.cost.morale ? `${skill.cost.morale} 鬥志` : "",
    skill.cost.gauge ? `${skill.cost.gauge} ${gaugeName}` : "",
    skill.cost.mana ? `${skill.cost.mana} 魔力` : "",
  ].filter(Boolean);

  return costs.length > 0 ? costs.join(" / ") : "無消耗";
}
