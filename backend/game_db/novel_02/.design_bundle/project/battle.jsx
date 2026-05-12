// battle.jsx — 戰鬥畫面主程式

const { useState, useEffect, useRef, useMemo, Fragment } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const HEROES = {
  legion: {
    id: 'legion', name: '軍團統帥', race: '人類', cls: '指揮官', rarity: 'SR',
    theme: 'azure', frame: 'midnight',
    hp: 80, maxHp: 80, atk: 6, def: 5, cmd: 9,
    gauge: { name: '軍令', max: 100, value: 35, hint: '部署兵力 +10；場上每存活 1 兵力每回合 +5' },
    intentDesc: '指揮 2 名兵力衝擊我方前線；準備發動「徵召令」。',
    glyph: 'crown',
  },
  sage: {
    id: 'sage', name: '大賢者', race: '精靈', cls: '法師', rarity: 'SR',
    theme: 'violet', frame: 'arcane',
    hp: 60, maxHp: 60, atk: 7, def: 3, cmd: 4,
    gauge: { name: '共鳴', max: 4, value: 2, hint: '每施放 1 張法術 +1，達 4 層下一法術費用 0' },
    intentDesc: '詠唱中——下回合對全體造成 (法術數 ×3) 傷害。',
    glyph: 'arcane',
  },
  smith: {
    id: 'smith', name: '鍛造宗師', race: '矮人', cls: '鍛造師', rarity: 'SR',
    theme: 'amber', frame: 'crimson',
    hp: 110, maxHp: 110, atk: 10, def: 10, cmd: 5,
    gauge: { name: '爐火', max: 100, value: 60, hint: '裝備 +20；滿值進入大師之爐' },
    intentDesc: '正在鍛造傳說器具——意圖：金。',
    glyph: 'gear',
  },
  illusion: {
    id: 'illusion', name: '幻形宗主', race: '妖族', cls: '幻術師', rarity: 'SR',
    theme: 'fey', frame: 'arcane',
    hp: 85, maxHp: 85, atk: 12, def: 5, cmd: 5,
    gauge: { name: '靈蘊', max: 100, value: 70, hint: '每回合 +10；妖形 -15' },
    intentDesc: '人形姿態——準備施放鏡像風暴。',
    glyph: 'eye',
  },
  rage: {
    id: 'rage', name: '蠻血酋長', race: '獸族', cls: '狂戰士', rarity: 'SR',
    theme: 'crimson', frame: 'crimson',
    hp: 110, maxHp: 110, atk: 19, def: 1, cmd: 5,
    gauge: { name: '血怒', max: 10, value: 4, hint: '每損失 10% HP +1；5 層後攻擊吸血' },
    intentDesc: '怒吼震天——直接衝擊我方英雄。',
    glyph: 'flame',
  },
  divine: {
    id: 'divine', name: '遺落神裔', race: '半神族', cls: '神官', rarity: 'SR',
    theme: 'divine', frame: 'midnight',
    hp: 125, maxHp: 125, atk: 16, def: 9, cmd: 2,
    gauge: { name: '神力殘響', max: 100, value: 30, hint: '稀缺資源；每次使用 +1 透支' },
    intentDesc: '舉起神言——詠唱「神域結界」。',
    glyph: 'star',
  },
};

const BOSS = {
  name: '惡魔將領', race: '惡魔', cls: '指揮官', rarity: 'BOSS',
  hp: 96, maxHp: 130, atk: 14, def: 7, cmd: 5,
  gauge: { name: '腐化', max: 100, value: 62 },
  intent: { kind: 'ATTACK', color: '紅', num: 28, desc: '兩名暗影兵推進並攻擊。命中後次元壁 -2。' },
};

const HAND_CARDS = [
  { id: 'h1', type: 'unit', name: '帝國長戟兵', cost: 2, atk: 3, hp: 4, def: 1, kw: ['守護'], rarity: '●', desc: '入場曲：相鄰兵力 +1 DEF。', glyph: 'shield' },
  { id: 'h2', type: 'unit', name: '聖盾騎士', cost: 3, atk: 3, hp: 5, def: 2, kw: ['守護'], rarity: '●●', desc: '相鄰我方兵力受傷 -1。', glyph: 'banner' },
  { id: 'h3', type: 'unit', name: '皇家弓手', cost: 2, atk: 4, hp: 2, def: 0, kw: [], rarity: '●', desc: '可指定任一敵方兵力。', glyph: 'bolt' },
  { id: 'h4', type: 'action', name: '集火指令', cost: 1, kw: ['行動'], rarity: '●', desc: '對 1 兵力造成 ATK ×1.2 傷害；場上每多 1 兵力 +5%。', glyph: 'swords' },
  { id: 'h5', type: 'spell', name: '軍號吹響', cost: 3, kw: ['法術'], rarity: '●●', desc: '我方所有兵力本回合 ATK +2；軍令 +20。', glyph: 'horn' },
  { id: 'h6', type: 'equip', name: '統帥之劍', cost: 2, kw: ['武器'], rarity: '●●', desc: '英雄 ATK +3；指揮攻擊命中時抽 1 張。', glyph: 'swords' },
  { id: 'h7', type: 'race', name: '帝國總動員', cost: 6, kw: ['種族'], rarity: '★', desc: '部署手牌中所有兵力卡；本回合所有兵力 ATK + 場上兵力數。', glyph: 'crown' },
];

const BATTLEFIELD = {
  enemy: [
    { id: 'e1', name: '暗影兵', cost: 2, atk: 3, hp: 4, maxHp: 5, def: 1, kw: ['守護'], glyph: 'skull', stunned: false, faction: 'enemy', glow: '#ff7d6a' },
    null,
    { id: 'e2', name: '腐化使徒', cost: 3, atk: 2, hp: 3, maxHp: 3, def: 0, kw: ['謝幕'], glyph: 'potion', stunned: false, faction: 'enemy', glow: '#b08fff' },
    null,
    { id: 'e3', name: '魘獸', cost: 4, atk: 5, hp: 2, maxHp: 6, def: 2, kw: [], glyph: 'flame', stunned: true, faction: 'enemy', glow: '#ff7d6a' },
  ],
  player: [
    null,
    { id: 'p1', name: '帝國長戟兵', cost: 2, atk: 3, hp: 4, maxHp: 4, def: 1, kw: ['守護'], glyph: 'shield', stunned: false, faction: 'player', glow: '#7fb8ff' },
    { id: 'p2', name: '皇家弓手', cost: 2, atk: 4, hp: 1, maxHp: 2, def: 0, kw: [], glyph: 'bolt', stunned: false, faction: 'player', glow: '#ffd97a' },
    { id: 'p3', name: '帝國長戟兵', cost: 2, atk: 3, hp: 4, maxHp: 4, def: 1, kw: ['守護'], glyph: 'shield', stunned: false, faction: 'player', glow: '#7fb8ff' },
    null,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG glyphs
// ─────────────────────────────────────────────────────────────────────────────
const GLYPHS = {
  crown: <path d="M4 18h16v-2H4zm0-3l2-8 4 4 2-6 2 6 4-4 2 8z"/>,
  shield:<path d="M12 4l7 2v6c0 4-3 7-7 8-4-1-7-4-7-8V6z"/>,
  banner:<path d="M7 4h10v15l-5-3-5 3z"/>,
  swords:<g><path d="M4 4l8 8M4 6l2-2M12 12l-2 2 2 2 2-2zM20 4l-8 8M20 6l-2-2M12 12l2 2-2 2-2-2z" fill="none" strokeWidth="1.4" stroke="currentColor"/></g>,
  bolt:  <path d="M13 3L5 14h5l-2 7 9-12h-5z"/>,
  horn:  <g><path d="M5 14V10h3l8-4v12l-8-4H5z"/><circle cx="16" cy="12" r="2" fill="none" strokeWidth="1.4" stroke="currentColor"/></g>,
  skull: <g><path d="M6 5h12v10l-2 2h-2v3h-4v-3H8l-2-2z"/><circle cx="9" cy="11" r="1.4" fill="#0008"/><circle cx="15" cy="11" r="1.4" fill="#0008"/></g>,
  flame: <path d="M12 3c2 4 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-5 1-8z"/>,
  potion:<path d="M10 3h4v3l3 5v6a4 4 0 01-4 4h-2a4 4 0 01-4-4v-6l3-5z"/>,
  eye:   <g><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" fill="none" strokeWidth="1.4" stroke="currentColor"/><circle cx="12" cy="12" r="2.6"/></g>,
  gear:  <path d="M12 4l1.4 2 2.3-.6 1 2.1 2.1 1-.6 2.3 2 1.4-2 1.4.6 2.3-2.1 1-1 2.1-2.3-.6L12 21l-1.4-2-2.3.6-1-2.1-2.1-1 .6-2.3L4 12.6l2-1.4-.6-2.3 2.1-1 1-2.1 2.3.6z"/>,
  star:  <path d="M12 3l2.6 6 6.4.6-4.8 4.3 1.4 6.5L12 17l-5.6 3.4 1.4-6.5L3 9.6 9.4 9z"/>,
  arcane:<g><circle cx="12" cy="12" r="8" fill="none" strokeWidth="1.4" stroke="currentColor"/><path d="M12 4v16M4 12h16M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth=".8" fill="none"/></g>,
};

function Glyph({ name, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 24 24" fill={color} stroke="none">
      {GLYPHS[name] || GLYPHS.star}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Corner ornament
// ─────────────────────────────────────────────────────────────────────────────
function CornerOrn({ cls = '' }) {
  return (
    <svg className={`corner-orn ${cls}`} viewBox="0 0 28 28">
      <defs>
        <linearGradient id="co-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--metal-b)"/>
          <stop offset=".5" stopColor="var(--metal-c)"/>
          <stop offset="1" stopColor="var(--metal-a)"/>
        </linearGradient>
      </defs>
      <g fill="url(#co-grad)" stroke="#0007" strokeWidth=".4">
        <path d="M0 0 H14 V2 H2 V14 H0 Z"/>
        <path d="M5 5 H10 V6 H6 V10 H5 Z"/>
      </g>
      <circle cx="7" cy="7" r="1.4" fill="var(--metal-c)" stroke="#0007" strokeWidth=".3"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero card (side panel)
// ─────────────────────────────────────────────────────────────────────────────
function HeroCard({ side, hero }) {
  const isEnemy = side === 'enemy';
  const skills = hero.skills || [
    { icon: 'banner', kind: '被動', name: hero.passiveName || '軍團旗幟',
      desc: hero.passiveDesc || '所有我方兵力 +2 DEF、+5 HP。' },
    { icon: 'crown',  kind: '終極', name: hero.ultName || '帝國總動員', ult: true,
      desc: hero.ultDesc  || '部署所有兵力卡；本回合 ATK 依場上兵力數提升。' },
  ];
  const tags = [hero.race, hero.cls];

  return (
    <div className="bf-hero" data-side={side}>
      <div className="bf-hero-frame"/>
      <div className="bf-hero-frame-in"/>
      <CornerOrn cls="ho-tl" />
      <CornerOrn cls="ho-tr" />
      <CornerOrn cls="ho-bl" />
      <CornerOrn cls="ho-br" />

      {/* Header: cost orb / banner / rarity badge */}
      <div className="mh-header">
        <div className="mh-cost">
          <svg viewBox="0 0 100 100">
            <defs>
              <radialGradient id={`mhCostBody-${side}`} cx=".4" cy=".35" r=".8">
                <stop offset="0" stopColor={isEnemy ? '#ffb0a8' : 'var(--hero-glow)'} stopOpacity=".95"/>
                <stop offset=".4" stopColor={isEnemy ? '#b83236' : 'var(--hero-a)'}/>
                <stop offset="1" stopColor={isEnemy ? '#5c1517' : 'var(--hero-b)'}/>
              </radialGradient>
              <linearGradient id={`mhCostRing-${side}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--metal-b)"/>
                <stop offset=".5" stopColor="var(--metal-c)"/>
                <stop offset="1" stopColor="var(--metal-b)"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill={`url(#mhCostRing-${side})`}/>
            <circle cx="50" cy="50" r="40" fill={`url(#mhCostBody-${side})`}/>
            <ellipse cx="42" cy="36" rx="22" ry="14" fill="#fff" opacity=".35"/>
            <circle cx="50" cy="50" r="46" fill="none" stroke="#0006" strokeWidth=".6"/>
          </svg>
          <div className="num">{hero.cost || '★'}</div>
        </div>

        <div className="mh-banner">
          <svg viewBox="0 0 280 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`mhBM-${side}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--metal-b)"/>
                <stop offset=".5" stopColor="var(--metal-c)"/>
                <stop offset="1" stopColor="var(--metal-a)"/>
              </linearGradient>
            </defs>
            <polygon points="10,3 270,3 277,25 270,47 10,47 3,25" fill={`url(#mhBM-${side})`}/>
            <polygon points="14,7 266,7 272,25 266,43 14,43 8,25" fill="var(--bg-deep)"/>
          </svg>
          <div className="name">{hero.name}</div>
        </div>

        <div className="mh-rarity">
          <svg viewBox="0 0 100 100">
            <defs>
              <linearGradient id={`mhRB-${side}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff0bf"/>
                <stop offset="1" stopColor="#d0982c"/>
              </linearGradient>
              <linearGradient id={`mhRR-${side}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--metal-b)"/>
                <stop offset=".5" stopColor="var(--metal-c)"/>
                <stop offset="1" stopColor="var(--metal-b)"/>
              </linearGradient>
            </defs>
            <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill={`url(#mhRR-${side})`}/>
            <polygon points="50,11 86,31 86,69 50,89 14,69 14,31" fill={`url(#mhRB-${side})`}/>
          </svg>
          <div className="t">{hero.rarity}</div>
        </div>
      </div>

      {/* Art window — silhouette */}
      <div className="mh-art">
        <svg className="silhouette" viewBox="0 0 200 210" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id={`mhBg-${side}`} cx=".5" cy=".4" r=".7">
              <stop offset="0" stopColor={isEnemy ? '#3a0d10' : 'var(--hero-a)'} stopOpacity=".55"/>
              <stop offset="1" stopColor="var(--bg-deep)"/>
            </radialGradient>
            <linearGradient id={`mhFg-${side}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={isEnemy ? '#6a1a1f' : 'var(--hero-a)'}/>
              <stop offset="1" stopColor="#0a0a12"/>
            </linearGradient>
          </defs>
          <rect width="200" height="210" fill={`url(#mhBg-${side})`}/>
          <ellipse cx="100" cy="180" rx="80" ry="14" fill="#000" opacity=".55"/>
          <g fill={`url(#mhFg-${side})`} stroke="#000" strokeWidth=".4">
            <path d="M40 200 Q 60 130 100 95 Q 140 130 160 200 Z"/>
            <path d="M60 130 Q 80 110 100 108 Q 120 110 140 130 L 140 145 Q 100 130 60 145 Z" fill="#0a0a12"/>
            <ellipse cx="100" cy="85" rx="18" ry="22"/>
            <path d="M82 82 Q 100 70 118 82 L 118 92 Q 100 86 82 92 Z" fill="#000" opacity=".6"/>
            <path d="M100 70 L 100 110" stroke="#000" strokeWidth="1" opacity=".5"/>
          </g>
          {isEnemy ? (
            <g fill="#5a0c10" stroke="#000" strokeWidth=".5">
              <rect x="155" y="60" width="3" height="120"/>
              <path d="M158 60 L 178 65 L 175 90 L 158 85 Z"/>
            </g>
          ) : (
            <g fill="var(--hero-b)" stroke="#000" strokeWidth=".5">
              <rect x="40" y="60" width="3" height="120"/>
              <path d="M40 60 L 20 65 L 23 90 L 40 85 Z"/>
              <circle cx="41" cy="58" r="4" fill="var(--metal-c)"/>
            </g>
          )}
          <g opacity=".18"><path d="M100 0 L 80 105 L 120 105 Z" fill="#fff"/></g>
        </svg>
        <div className="vignette"/>
      </div>

      {/* Tags */}
      <div className="mh-tags">
        {tags.map((tag, i) => <div key={i} className="mh-tag">{tag}<i/></div>)}
      </div>

      {/* Skill panel (parchment) */}
      <div className="mh-skills">
        {skills.slice(0, 2).map((s, i) => (
          <div key={i} className="mh-skill-row">
            <div className="mh-skill-ico">
              <svg viewBox="0 0 24 24">{GLYPHS[s.icon] || GLYPHS.star}</svg>
            </div>
            <div className="mh-skill-txt">
              <span className={`kind ${s.ult ? 'ult' : ''}`}>{s.kind}</span>
              <span className="sep">│</span>
              <span className="nm" style={{ color: s.ult ? '#9a1f1f' : '#2a1a08' }}>{s.name}</span>
              ：{s.desc}
            </div>
          </div>
        ))}
        <div className="mh-gauge">
          <div className="row">
            <span className="nm">{hero.gauge.name}</span>
            <span className="v">{hero.gauge.value} / {hero.gauge.max}</span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${(hero.gauge.value / hero.gauge.max) * 100}%` }}/>
          </div>
        </div>
      </div>

      {/* Stats footer: HP / ATK / DEF / CMD */}
      <div className="mh-stats">
        <div className="cell hp"><div className="l">HP</div><div className="v">{hero.hp}<span style={{opacity:.5, fontSize:'.65em'}}>/{hero.maxHp}</span></div></div>
        <div className="cell atk"><div className="l">ATK</div><div className="v">{hero.atk}</div></div>
        <div className="cell def"><div className="l">DEF</div><div className="v">{hero.def}</div></div>
        <div className="cell cmd"><div className="l">CMD</div><div className="v">{hero.cmd}</div></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit card on field
// ─────────────────────────────────────────────────────────────────────────────
function Unit({ unit }) {
  const kwClass = (kw) => ({
    '守護':'guard','突進':'rush','疾走':'swift','威壓':'taunt',
  }[kw] || '');
  return (
    <div className="unit"
      data-faction={unit.faction}
      data-stunned={unit.stunned || undefined}
      data-guard={unit.kw.includes('守護') || undefined}
    >
      <div className="unit-cost">{unit.cost}</div>
      <div className="unit-rarity">●</div>
      <div className="unit-art" style={{ '--unit-glow': unit.glow }}>
        <div className="glow"/>
        <svg viewBox="0 0 24 24" fill={unit.glow} stroke="#000" strokeWidth=".3" style={{ filter: `drop-shadow(0 1px 3px ${unit.glow}88)` }}>
          {GLYPHS[unit.glyph] || GLYPHS.star}
        </svg>
      </div>
      <div className="unit-name">{unit.name}</div>
      <div className="unit-stats">
        <div className="unit-stat atk">{unit.atk}</div>
        {unit.def > 0 && <div className="unit-stat def">{unit.def}</div>}
        <div className={`unit-stat hp ${unit.hp < unit.maxHp/2 ? 'crit' : unit.hp < unit.maxHp ? 'hurt' : ''}`}>
          {unit.hp}{unit.hp !== unit.maxHp && <span style={{opacity:.5, fontSize:'.7em', marginLeft:2}}>/{unit.maxHp}</span>}
        </div>
      </div>
      {unit.kw.length > 0 && (
        <div className="unit-keywords">
          {unit.kw.map((kw, i) => <span key={i} className={`unit-kw ${kwClass(kw)}`}>{kw}</span>)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hand card
// ─────────────────────────────────────────────────────────────────────────────
function HandCard({ card, index, total, mana, layout, onPlay }) {
  const playable = card.cost <= mana;
  // Fan layout
  const spread = Math.min(60, total * 11);
  const step = total > 1 ? spread / (total - 1) : 0;
  const angle = -spread / 2 + index * step;
  const rad = angle * Math.PI / 180;
  let x, y, rot;
  if (layout === 'fan') {
    x = Math.sin(rad) * 320;
    y = -Math.cos(rad) * 60 + 60;
    rot = angle;
  } else if (layout === 'row') {
    const spacing = 170;
    x = (index - (total - 1) / 2) * spacing;
    y = 0;
    rot = 0;
  } else { // stack
    const spacing = 35;
    x = (index - (total - 1) / 2) * spacing;
    y = -index * 2;
    rot = (index - (total - 1) / 2) * 1.5;
  }

  const baseTransform = `translate(calc(-50% + ${x}px), ${y}px) rotate(${rot}deg)`;
  const hoverTransform = `translate(calc(-50% + ${x}px), -90px) rotate(0deg) scale(1.18)`;

  const typeLabel = { unit: '兵力', action: '行動', spell: '法術', equip: '裝備', field: '場地', race: '種族' }[card.type];

  return (
    <div
      className={`hand-card ${playable ? 'playable' : ''}`}
      data-type={card.type}
      style={{
        transform: baseTransform,
        '--hover-transform': hoverTransform,
        zIndex: index,
      }}
      onClick={() => playable && onPlay && onPlay(card)}
    >
      <div className="hc-body">
        <div className="hc-header">
          <div className="hand-cost-orb">{card.cost}</div>
          <div className="hc-type">{typeLabel}{card.rarity && ` · ${card.rarity}`}</div>
        </div>
        <div className="hc-art" style={{ color: card.type === 'spell' ? '#b08fff' : card.type === 'action' ? '#ff9879' : card.type === 'equip' ? '#ffd97a' : card.type === 'race' ? '#fff2c8' : '#7fb8ff' }}>
          <div className="glow"/>
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="#000" strokeWidth=".3">
            {GLYPHS[card.glyph] || GLYPHS.star}
          </svg>
        </div>
        <div className="hc-name">{card.name}</div>
        <div className="hc-desc">{card.desc}</div>
        {card.type === 'unit' && (
          <div className="hc-stats">
            <span className="hc-stat atk">⚔ {card.atk}</span>
            {card.def > 0 && <span className="hc-stat def">🛡 {card.def}</span>}
            <span className="hc-stat hp">❤ {card.hp}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Battle field
// ─────────────────────────────────────────────────────────────────────────────
function Battlefield({ battlefield, perspective }) {
  return (
    <div className="bf-field-frame">
      <div className={`bf-field-floor ${perspective === 'perspective' ? 'perspective-on' : ''}`}>
        <div className="lanes">
          <div className="lane enemy">
            {battlefield.enemy.map((u, i) =>
              u ? <Unit key={u.id} unit={u}/> : <div key={i} className="unit-slot empty"/>
            )}
          </div>
          <div className="lane-divider"/>
          <div className="lane player">
            {battlefield.player.map((u, i) =>
              u ? <Unit key={u.id} unit={u}/> : <div key={i} className="unit-slot empty"/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top Bar
// ─────────────────────────────────────────────────────────────────────────────
function TopBar({ turn, round, phase, stability }) {
  let fillCls = '';
  if (stability < 30) fillCls = 'crit';
  else if (stability < 60) fillCls = 'warn';
  return (
    <div className="bf-topbar">
      <span className="corner-emb tl"/>
      <span className="corner-emb tr"/>
      <span className="corner-emb bl"/>
      <span className="corner-emb br"/>

      <div className="bf-turn" data-side={turn}>
        <div className="pip"/>
        <div>
          <div className="label">{turn === 'player' ? '我方回合' : '敵方回合'}</div>
        </div>
        <div className="round">第 {round} 回合</div>
      </div>

      <div className="bf-divider"/>

      <div className="bf-stability">
        <div className="lbl">次元壁穩定度</div>
        <div className="track">
          <div className={`fill ${fillCls}`} style={{ width: `${stability}%` }}/>
          <div className="ticks">
            {[25, 50, 75].map(t => <div key={t} className="tick" style={{ left: `${t}%` }}/>)}
          </div>
        </div>
        <div className="num">{stability}</div>
      </div>

      <div className="bf-divider"/>

      <div className="bf-phase">
        {['抽牌', '主要', '結束'].map(p => (
          <div key={p} className={`chip ${p === phase ? 'active' : ''}`}>{p}</div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Deck / Discard piles
// ─────────────────────────────────────────────────────────────────────────────
function Pile({ kind, count, label }) {
  return (
    <div className={`bf-pile ${kind}`}>
      <div className="bf-pile-stack">
        <div className="layer"/>
        <div className="layer"/>
        <div className="layer top">
          <div className="ornament"/>
          <div className="sigil">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z"/></svg>
          </div>
        </div>
      </div>
      <div className="bf-pile-count"><span className="num">{count}</span>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource HUD (right side)
// ─────────────────────────────────────────────────────────────────────────────
function ResourcePanel({ mana, maxMana, morale, hero, intent, onEndTurn, turn }) {
  const ultReady = morale >= 100;
  return (
    <div className="bf-rp-wrap" style={{ display:'contents' }}>
      <div className="bf-resources">
        <h4>魔力</h4>
        <div className="bf-mana">
          {Array.from({ length: 10 }).map((_, i) => {
            const cls = i >= maxMana ? 'empty' : i < mana ? '' : 'empty';
            return <div key={i} className={`orb ${cls}`}/>;
          })}
        </div>

        <div className="bf-morale">
          <div className="row">
            <div className="lbl">鬥志</div>
            <div className="v">{morale} / 100</div>
          </div>
          <div className="track">
            <div className={`fill ${ultReady ? 'ready' : ''}`} style={{ width: `${Math.min(100, morale)}%` }}/>
          </div>
        </div>

        <div className="bf-gauge">
          <div className="row">
            <div className="lbl">{hero.gauge.name}</div>
            <div className="v">{hero.gauge.value} / {hero.gauge.max}</div>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${(hero.gauge.value / hero.gauge.max) * 100}%` }}/>
          </div>
          <div className="desc">{hero.gauge.hint}</div>
        </div>
      </div>

      <button className="bf-end-turn" data-disabled={turn !== 'player' || undefined} onClick={onEndTurn}>
        結束回合
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Race gauge strip (segmented along bottom)
// ─────────────────────────────────────────────────────────────────────────────
function RaceGaugeStrip({ hero, style }) {
  const total = 20;
  const lit = Math.round((hero.gauge.value / hero.gauge.max) * total);
  return (
    <div className="bf-cmd-strip" data-style={style}>
      <div className="label">{hero.gauge.name}</div>
      <div className="seg-track">
        {Array.from({ length: total }).map((_, i) =>
          <div key={i} className={`seg ${i < lit ? 'lit' : ''}`}/>
        )}
      </div>
      <div className="num">{hero.gauge.value} / {hero.gauge.max}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "frameTheme": "midnight",
  "demoHero": "legion",
  "density": "regular",
  "perspective": "perspective",
  "handLayout": "fan",
  "gaugeStyle": "segment"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [turn, setTurn] = useState('player');
  const [round, setRound] = useState(4);
  const [phase, setPhase] = useState('主要');
  const [stability, setStability] = useState(78);
  const [mana, setMana] = useState(3);
  const [maxMana] = useState(4);
  const [morale, setMorale] = useState(70);
  const [log, setLog] = useState([{ id: 1, text: '主要階段——選擇行動' }]);
  const [hand, setHand] = useState(HAND_CARDS);

  const hero = HEROES[t.demoHero] || HEROES.legion;

  // Scale to fit viewport
  const scaleRef = useRef(null);
  useEffect(() => {
    const fit = () => {
      const el = scaleRef.current;
      if (!el) return;
      const sx = window.innerWidth / 1920;
      const sy = window.innerHeight / 1080;
      const s = Math.min(sx, sy);
      el.style.transform = `scale(${s})`;
      document.documentElement.style.setProperty('--dc-inv-zoom', String(1 / s));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const playCard = (card) => {
    if (card.cost > mana) return;
    setMana(m => m - card.cost);
    setHand(h => h.filter(c => c.id !== card.id));
    setLog(l => [{ id: Date.now(), text: `打出「${card.name}」(費用 ${card.cost})` }, ...l].slice(0, 3));
  };

  const endTurn = () => {
    if (turn !== 'player') return;
    setTurn('enemy');
    setLog(l => [{ id: Date.now(), text: '敵方回合開始' }, ...l].slice(0, 3));
    setTimeout(() => {
      setLog(l => [{ id: Date.now(), text: `敵方執行：${BOSS.intent.desc}` }, ...l].slice(0, 3));
    }, 700);
    setTimeout(() => {
      setTurn('player');
      setRound(r => r + 1);
      setMana(maxMana + 1);
      setLog(l => [{ id: Date.now(), text: `第 ${round + 1} 回合 · 我方` }, ...l].slice(0, 3));
    }, 1800);
  };

  return (
    <div className="bf-stage">
      <div className="bf-scale" ref={scaleRef}>
        <div
          className="bf-root"
          data-frame={t.frameTheme}
          data-hero={hero.theme}
          data-density={t.density}
        >
          <TopBar turn={turn} round={round} phase={phase} stability={stability}/>

          {/* Action log */}
          <div className="bf-log">
            {log.slice(0, 1).map(l => (
              <div key={l.id} className="bf-log-item">{l.text}</div>
            ))}
          </div>

          {/* Left side — enemy hero on top, player hero on bottom */}
          <div className="bf-side left">
            <HeroCard side="enemy" hero={BOSS}/>
            <HeroCard side="player" hero={hero}/>
          </div>

          {/* Right side — resources + intent + end turn */}
          <div className="bf-side right">
            <ResourcePanel
              mana={mana} maxMana={maxMana} morale={morale}
              hero={hero} intent={BOSS.intent}
              onEndTurn={endTurn} turn={turn}
            />
          </div>

          {/* Battlefield */}
          <div className="bf-field">
            <Battlefield battlefield={BATTLEFIELD} perspective={t.perspective}/>
          </div>

          {/* Race gauge strip */}
          <RaceGaugeStrip hero={hero} style={t.gaugeStyle}/>

          {/* Deck pile (left) */}
          <Pile kind="deck"    count={18} label=" 牌庫"/>
          <Pile kind="discard" count={6}  label=" 棄牌"/>

          {/* Hand */}
          <div className="bf-hand" data-layout={t.handLayout}>
            <div className="bf-hand-zone">
              {hand.map((c, i) => (
                <HandCard
                  key={c.id}
                  card={c}
                  index={i}
                  total={hand.length}
                  mana={mana}
                  layout={t.handLayout}
                  onPlay={playCard}
                />
              ))}
            </div>
          </div>
        </div>

        <TweaksPanel>
          <TweakSection label="主題色"/>
          <TweakSelect label="框架"
            value={t.frameTheme}
            options={[
              { value: 'midnight', label: '夜幕（藍金）' },
              { value: 'crimson',  label: '緋紅（紅金）' },
              { value: 'emerald',  label: '翠林（綠金）' },
              { value: 'arcane',   label: '秘紫（紫金）' },
              { value: 'obsidian', label: '玄鐵（鋼黑）' },
            ]}
            onChange={v => setTweak('frameTheme', v)}/>

          <TweakSection label="示範英雄"/>
          <TweakSelect label="角色"
            value={t.demoHero}
            options={Object.values(HEROES).map(h => ({ value: h.id, label: `${h.name}（${h.race}·${h.cls}）` }))}
            onChange={v => setTweak('demoHero', v)}/>

          <TweakSection label="顯示"/>
          <TweakRadio label="密度"
            value={t.density}
            options={['compact','regular','comfy']}
            onChange={v => setTweak('density', v)}/>
          <TweakRadio label="戰場視角"
            value={t.perspective}
            options={['flat','perspective']}
            onChange={v => setTweak('perspective', v)}/>
          <TweakRadio label="手牌排列"
            value={t.handLayout}
            options={['fan','row','stack']}
            onChange={v => setTweak('handLayout', v)}/>
          <TweakRadio label="量表樣式"
            value={t.gaugeStyle}
            options={['segment','bar','runes']}
            onChange={v => setTweak('gaugeStyle', v)}/>
        </TweaksPanel>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
