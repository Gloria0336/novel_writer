// card.jsx — Customizable trading card template

const { useState, useEffect, useRef, Fragment } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Theme palettes — each set drives frame metal + cost orb + accent
// ─────────────────────────────────────────────────────────────────────────────
const FRAME_THEMES = {
  midnight: {
    name: '夜幕',
    bg: 'linear-gradient(155deg,#0d1620 0%,#16202d 45%,#0a121c 100%)',
    bgEdge: '#070c14',
    metalA: '#c9a45a',
    metalB: '#7a5b25',
    metalC: '#fff2c8',
    rivet: '#1d2a3a',
    panelInk: '#e8d9b4',
    titleBg: 'linear-gradient(180deg,#1a2533 0%,#0f1822 100%)',
  },
  crimson: {
    name: '緋紅',
    bg: 'linear-gradient(155deg,#1f0a0c 0%,#2e1112 45%,#160707 100%)',
    bgEdge: '#0d0405',
    metalA: '#d4ad62',
    metalB: '#7a5b25',
    metalC: '#ffe4a8',
    rivet: '#341013',
    panelInk: '#f0d9b5',
    titleBg: 'linear-gradient(180deg,#2a1012 0%,#180809 100%)',
  },
  emerald: {
    name: '翠林',
    bg: 'linear-gradient(155deg,#0a1a14 0%,#0f2a1f 45%,#06140e 100%)',
    bgEdge: '#03100a',
    metalA: '#c9a45a',
    metalB: '#6e5526',
    metalC: '#f4e2b1',
    rivet: '#0a201a',
    panelInk: '#ead5af',
    titleBg: 'linear-gradient(180deg,#0e2218 0%,#06140e 100%)',
  },
  arcane: {
    name: '秘紫',
    bg: 'linear-gradient(155deg,#150d24 0%,#1f1638 45%,#0c0617 100%)',
    bgEdge: '#080414',
    metalA: '#cdb073',
    metalB: '#7a5b25',
    metalC: '#fbe9b8',
    rivet: '#1a1230',
    panelInk: '#ead5af',
    titleBg: 'linear-gradient(180deg,#1c1430 0%,#0d0719 100%)',
  },
  obsidian: {
    name: '玄鐵',
    bg: 'linear-gradient(155deg,#16161a 0%,#22232a 45%,#0d0d12 100%)',
    bgEdge: '#070708',
    metalA: '#a8a8b0',
    metalB: '#535560',
    metalC: '#e6e7ec',
    rivet: '#1a1b22',
    panelInk: '#e6e2d4',
    titleBg: 'linear-gradient(180deg,#1d1e26 0%,#0e0f14 100%)',
  },
};

const COST_THEMES = {
  azure:   { a: '#1b3d70', b: '#2f6bc4', glow: '#7ec0ff', ink: '#fff' },
  crimson: { a: '#5c1517', b: '#b83236', glow: '#ffb0a8', ink: '#fff' },
  amber:   { a: '#5c3a09', b: '#d6890e', glow: '#ffd17a', ink: '#fff' },
  jade:    { a: '#0e3a26', b: '#1f7a4d', glow: '#9dffcc', ink: '#fff' },
  violet:  { a: '#2d1850', b: '#6b3fc4', glow: '#cbb0ff', ink: '#fff' },
  shadow:  { a: '#1a1a22', b: '#3a3a48', glow: '#aaa9b8', ink: '#fff' },
};

const RARITY_THEMES = {
  N:   { fillA: '#5c6573', fillB: '#3a414c', ink: '#f4f4f0' },
  R:   { fillA: '#9bb4d6', fillB: '#3f6494', ink: '#0f1c2e' },
  SR:  { fillA: '#f5d27a', fillB: '#a8782c', ink: '#3a2308' },
  SSR: { fillA: '#fff0bf', fillB: '#d0982c', ink: '#3a2308' },
  UR:  { fillA: '#f3b9ff', fillB: '#8c2fb1', ink: '#fff5fb' },
  LR:  { fillA: '#ff9d6d', fillB: '#b53216', ink: '#fff' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG icon glyphs for skill rows
// ─────────────────────────────────────────────────────────────────────────────
const ICONS = {
  chart:   <g><rect x="6" y="14" width="3" height="6" rx=".5"/><rect x="10.5" y="10" width="3" height="10" rx=".5"/><rect x="15" y="6" width="3" height="14" rx=".5"/></g>,
  banner:  <path d="M7 4h10v15l-5-3-5 3z"/>,
  horn:    <g><path d="M5 14V10h3l8-4v12l-8-4H5z"/><circle cx="16" cy="12" r="2" fill="none" strokeWidth="1.4"/></g>,
  shield:  <path d="M12 4l7 2v6c0 4-3 7-7 8-4-1-7-4-7-8V6z"/>,
  swords:  <g><path d="M4 4l8 8M4 6l2-2M12 12l-2 2 2 2 2-2zM20 4l-8 8M20 6l-2-2M12 12l2 2-2 2-2-2z" fill="none" strokeWidth="1.4"/></g>,
  crown:   <path d="M4 18h16v-2H4zm0-3l2-8 4 4 2-6 2 6 4-4 2 8z"/>,
  book:    <g><path d="M5 4h7v16H5z"/><path d="M12 4h7v16h-7z"/><path d="M12 4v16" stroke="#0006" strokeWidth=".6" fill="none"/></g>,
  flame:   <path d="M12 3c2 4 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-5 1-8z"/>,
  star:    <path d="M12 3l2.6 6 6.4.6-4.8 4.3 1.4 6.5L12 17l-5.6 3.4 1.4-6.5L3 9.6 9.4 9z"/>,
  bolt:    <path d="M13 3L5 14h5l-2 7 9-12h-5z"/>,
  eye:     <g><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" fill="none" strokeWidth="1.4"/><circle cx="12" cy="12" r="2.6"/></g>,
  skull:   <g><path d="M6 5h12v10l-2 2h-2v3h-4v-3H8l-2-2z"/><circle cx="9" cy="11" r="1.4" fill="#0008"/><circle cx="15" cy="11" r="1.4" fill="#0008"/></g>,
  potion:  <path d="M10 3h4v3l3 5v6a4 4 0 01-4 4h-2a4 4 0 01-4-4v-6l3-5z"/>,
  gear:    <path d="M12 4l1.4 2 2.3-.6 1 2.1 2.1 1-.6 2.3 2 1.4-2 1.4.6 2.3-2.1 1-1 2.1-2.3-.6L12 21l-1.4-2-2.3.6-1-2.1-2.1-1 .6-2.3L4 12.6l2-1.4-.6-2.3 2.1-1 1-2.1 2.3.6z"/>,
};

const ICON_KEYS = Object.keys(ICONS);

// ─────────────────────────────────────────────────────────────────────────────
// Reusable sub-components
// ─────────────────────────────────────────────────────────────────────────────

function MetalGradient({ id, a, b, c, vertical }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
      <stop offset="0" stopColor={b} />
      <stop offset=".35" stopColor={a} />
      <stop offset=".5" stopColor={c} />
      <stop offset=".65" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
}

// Cost orb (top-left): a faceted circle with type label hanging below
function CostOrb({ value, label, theme, frameTheme }) {
  const c = COST_THEMES[theme] || COST_THEMES.azure;
  return (
    <div className="cost-orb-wrap">
      <svg viewBox="0 0 100 100" className="cost-orb">
        <defs>
          <radialGradient id="costBody" cx=".4" cy=".35" r=".8">
            <stop offset="0" stopColor={c.glow} stopOpacity=".95" />
            <stop offset=".35" stopColor={c.b} />
            <stop offset="1" stopColor={c.a} />
          </radialGradient>
          <radialGradient id="costShine" cx=".35" cy=".25" r=".4">
            <stop offset="0" stopColor="#fff" stopOpacity=".75" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="costRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={frameTheme.metalB} />
            <stop offset=".5" stopColor={frameTheme.metalC} />
            <stop offset="1" stopColor={frameTheme.metalB} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#costRing)" />
        <circle cx="50" cy="50" r="40" fill="url(#costBody)" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#0004" strokeWidth=".8" />
        <ellipse cx="42" cy="36" rx="22" ry="14" fill="url(#costShine)" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#0006" strokeWidth=".6" />
      </svg>
      <div className="cost-num" style={{ color: c.ink, textShadow: `0 1px 0 ${c.a}, 0 2px 6px ${c.a}` }}>{value}</div>
      {label && (
        <div className="cost-label" style={{
          background: frameTheme.titleBg,
          borderColor: frameTheme.metalB,
          color: frameTheme.panelInk,
        }}>{label}</div>
      )}
    </div>
  );
}

// Rarity badge (top-right): hexagon with letters
function RarityBadge({ rarity, frameTheme }) {
  const r = RARITY_THEMES[rarity] || RARITY_THEMES.SR;
  return (
    <div className="rarity-wrap">
      <svg viewBox="0 0 100 100" className="rarity-badge">
        <defs>
          <linearGradient id="rarityBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={r.fillA} />
            <stop offset="1" stopColor={r.fillB} />
          </linearGradient>
          <linearGradient id="rarityRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={frameTheme.metalB} />
            <stop offset=".5" stopColor={frameTheme.metalC} />
            <stop offset="1" stopColor={frameTheme.metalB} />
          </linearGradient>
        </defs>
        <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="url(#rarityRing)" />
        <polygon points="50,11 86,31 86,69 50,89 14,69 14,31" fill="url(#rarityBody)" />
        <polygon points="50,11 86,31 86,69 50,89 14,69 14,31" fill="none" stroke="#0006" strokeWidth=".6" />
      </svg>
      <div className="rarity-text" style={{ color: r.ink, textShadow: `0 1px 0 ${r.fillB}` }}>{rarity}</div>
    </div>
  );
}

// Title banner: trapezoid with metal frame
function TitleBanner({ name, theme }) {
  return (
    <div className="title-banner">
      <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="title-svg">
        <defs>
          <linearGradient id="bannerFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0" stopColor={theme.titleBg.includes('1a2533') ? '#1a2533' : '#1a1010'} />
          </linearGradient>
          <linearGradient id="bannerMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={theme.metalB} />
            <stop offset=".5" stopColor={theme.metalC} />
            <stop offset="1" stopColor={theme.metalA} />
          </linearGradient>
        </defs>
        <polygon points="14,4 386,4 396,35 386,66 14,66 4,35" fill="url(#bannerMetal)" />
        <polygon points="20,10 380,10 388,35 380,60 20,60 12,35" style={{ fill: theme.bgEdge }} />
      </svg>
      <div className="title-text" style={{ color: theme.metalC }}>{name}</div>
    </div>
  );
}

// Tags strip — pill shapes with metal frame
function TagsStrip({ tags, theme }) {
  return (
    <div className="tags-strip">
      {tags.filter(t => t && t.trim()).map((tag, i) => (
        <div key={i} className="tag-pill" style={{
          background: theme.bgEdge,
          borderColor: theme.metalA,
          color: theme.panelInk,
        }}>
          <span className="tag-corner tag-corner-tl" style={{ borderColor: theme.metalC }} />
          <span className="tag-corner tag-corner-tr" style={{ borderColor: theme.metalC }} />
          <span className="tag-corner tag-corner-bl" style={{ borderColor: theme.metalC }} />
          <span className="tag-corner tag-corner-br" style={{ borderColor: theme.metalC }} />
          {tag}
        </div>
      ))}
    </div>
  );
}

// Skill row: round icon disc + text
function SkillRow({ skill, theme }) {
  const icon = ICONS[skill.icon] || ICONS.star;
  const isUltimate = skill.kind === '終極' || skill.kindHighlight;
  return (
    <div className="skill-row">
      <div className="skill-icon" style={{
        background: `radial-gradient(circle at 35% 30%, #fff6, #0000 60%), linear-gradient(160deg, ${theme.metalA}, ${theme.metalB})`,
        borderColor: theme.metalB,
        boxShadow: `inset 0 0 0 1px ${theme.metalC}66, 0 1px 2px #0008`,
      }}>
        <svg viewBox="0 0 24 24" fill="#2a1a08" stroke="#2a1a08" strokeWidth=".4" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <div className="skill-text">
        {skill.kind && (
          <span className="skill-kind" style={{ color: isUltimate ? '#9a1f1f' : '#3d2a14' }}>
            {skill.kind}
          </span>
        )}
        {skill.kind && skill.name && <span className="skill-sep" style={{ color: '#3d2a14' }}>│</span>}
        {skill.name && (
          <span className="skill-name" style={{ color: isUltimate ? '#9a1f1f' : '#2a1a08', fontWeight: 600 }}>
            {skill.name}
          </span>
        )}
        {(skill.kind || skill.name) && skill.desc && <span style={{ color: '#2a1a08' }}>：</span>}
        <span className="skill-desc" style={{ color: '#2a1a08' }}>{skill.desc}</span>
      </div>
    </div>
  );
}

// Stats footer: 4 wells
function StatsFooter({ stats, theme }) {
  return (
    <div className="stats-footer">
      {stats.map((s, i) => (
        <div key={i} className="stat-cell" style={{
          background: 'linear-gradient(180deg,#0a1018 0%,#1a2535 100%)',
          borderColor: theme.metalB,
          color: theme.metalC,
        }}>
          <div className="stat-label">{s.label}</div>
          <div className="stat-value" style={{ color: s.value && s.value !== '—' ? '#fff' : theme.metalA }}>
            {s.value || '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

// Corner ornament (gold bracket at each corner)
function CornerOrnament({ pos, theme }) {
  const transforms = {
    tl: 'translate(0,0)',
    tr: 'translate(100%,0) scaleX(-1)',
    bl: 'translate(0,100%) scaleY(-1)',
    br: 'translate(100%,100%) scale(-1,-1)',
  };
  return (
    <svg viewBox="0 0 80 80" className="corner-orn" style={{ transform: transforms[pos] }}>
      <defs>
        <linearGradient id={`cornerGrad-${pos}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={theme.metalB} />
          <stop offset=".5" stopColor={theme.metalC} />
          <stop offset="1" stopColor={theme.metalA} />
        </linearGradient>
      </defs>
      <g fill={`url(#cornerGrad-${pos})`} stroke="#0006" strokeWidth=".4">
        <path d="M0 0 L34 0 L34 4 L4 4 L4 34 L0 34 Z" />
        <path d="M8 8 L22 8 L22 10 L10 10 L10 22 L8 22 Z" opacity=".75" />
        <path d="M38 0 L46 0 L42 6 Z" />
        <path d="M0 38 L0 46 L6 42 Z" />
      </g>
      <circle cx="14" cy="14" r="2" fill={theme.metalC} stroke="#0008" strokeWidth=".4" />
    </svg>
  );
}

// Edge ornament (mid-edge diamond rivet)
function EdgeRivet({ pos, theme }) {
  return (
    <svg viewBox="0 0 24 24" className={`edge-rivet edge-rivet-${pos}`}>
      <defs>
        <linearGradient id={`rivetGrad-${pos}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.metalC} />
          <stop offset=".5" stopColor={theme.metalA} />
          <stop offset="1" stopColor={theme.metalB} />
        </linearGradient>
      </defs>
      <polygon points="12,2 22,12 12,22 2,12" fill={`url(#rivetGrad-${pos})`} stroke="#0008" strokeWidth=".5" />
      <polygon points="12,6 18,12 12,18 6,12" fill="#1c4068" stroke="#0006" strokeWidth=".4" />
      <polygon points="12,8 16,12 12,16 8,12" fill="#7fb8ff" opacity=".7" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Card
// ─────────────────────────────────────────────────────────────────────────────
function Card({ t }) {
  const theme = FRAME_THEMES[t.frameTheme] || FRAME_THEMES.midnight;

  return (
    <div className="card-root" style={{ background: theme.bg, borderColor: theme.bgEdge }}>
      {/* Outer metal frame (double-pinstripe) */}
      <div className="frame-outer" style={{
        '--frame-metal': `linear-gradient(135deg, ${theme.metalB}, ${theme.metalC} 25%, ${theme.metalA} 50%, ${theme.metalC} 75%, ${theme.metalB})`,
      }} />
      <div className="frame-inner" style={{
        borderColor: theme.metalA,
      }} />

      {/* Corner ornaments */}
      <CornerOrnament pos="tl" theme={theme} />
      <CornerOrnament pos="tr" theme={theme} />
      <CornerOrnament pos="bl" theme={theme} />
      <CornerOrnament pos="br" theme={theme} />

      {/* Edge rivets */}
      <EdgeRivet pos="top" theme={theme} />
      <EdgeRivet pos="bot" theme={theme} />
      <EdgeRivet pos="left" theme={theme} />
      <EdgeRivet pos="right" theme={theme} />

      {/* Header row */}
      <div className="card-header">
        <CostOrb value={t.cost} label={t.typeLabel} theme={t.costTheme} frameTheme={theme} />
        <TitleBanner name={t.name} theme={theme} />
        <RarityBadge rarity={t.rarity} frameTheme={theme} />
      </div>

      {/* Art window */}
      <div className="art-window" style={{ borderColor: theme.metalA }}>
        <image-slot
          id={`card-art-${t.artSlotId || 'main'}`}
          shape="rect"
          placeholder={t.artPlaceholder || '拖曳角色立繪至此'}
          style={{ width: '100%', height: '100%', background: theme.bgEdge }}
        ></image-slot>
        <div className="art-inner-frame" style={{ borderColor: theme.metalC }} />
      </div>

      {/* Tags */}
      <TagsStrip tags={t.tags} theme={theme} />

      {/* Skill panel (parchment) */}
      <div className="skill-panel" style={{ borderColor: theme.metalA }}>
        <div className="skill-panel-corner tl" style={{ borderColor: theme.metalB }} />
        <div className="skill-panel-corner tr" style={{ borderColor: theme.metalB }} />
        <div className="skill-panel-corner bl" style={{ borderColor: theme.metalB }} />
        <div className="skill-panel-corner br" style={{ borderColor: theme.metalB }} />
        <div className="skill-list">
          {t.skills.map((s, i) => <SkillRow key={i} skill={s} theme={theme} />)}
        </div>
        {t.flavor && (
          <div className="flavor-quote">{t.flavor}</div>
        )}
      </div>

      {/* Stats footer */}
      <StatsFooter stats={t.stats} theme={theme} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tweaks UI
// ─────────────────────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "name": "軍團統帥",
  "cost": "5",
  "typeLabel": "英雄",
  "rarity": "SR",
  "frameTheme": "midnight",
  "costTheme": "azure",
  "tags": ["英雄", "人類", "指揮官"],
  "skills": [
    { "icon": "chart",  "kind": "量表",  "name": "",          "desc": "部署兵力 +10；場上每存活 1 兵力每回合 +5" },
    { "icon": "banner", "kind": "被動",  "name": "軍團旗幟",  "desc": "所有我方兵力 +2 DEF、+5 HP。" },
    { "icon": "horn",   "kind": "主動",  "name": "徵召令",    "desc": "從牌庫搜尋 1 張兵力卡加入手牌（30 鬥志）" },
    { "icon": "shield", "kind": "主動",  "name": "堅守陣線",  "desc": "所有兵力本回合 DEF 強化（40 鬥志）" },
    { "icon": "swords", "kind": "主動",  "name": "戰場調度",  "desc": "所有兵力本回合 ATK +3（20 鬥志）" },
    { "icon": "crown",  "kind": "終極",  "name": "帝國總動員","desc": "立即部署手牌中所有兵力卡；本回合所有兵力 ATK 依場上兵力數提升（100 鬥志）", "kindHighlight": true }
  ],
  "flavor": "列陣！前進！我以軍團之名，命你寸步不退！",
  "stats": [
    { "label": "HP",  "value": "—" },
    { "label": "ATK", "value": "—" },
    { "label": "DEF", "value": "—" },
    { "label": "CMD", "value": "—" }
  ],
  "bgColor": "#1a1a20",
  "bgPattern": "vignette"
}/*EDITMODE-END*/;

function SkillEditor({ skill, idx, onChange, onRemove }) {
  return (
    <div className="skill-editor">
      <div className="skill-editor-hd">
        <span>#{idx + 1}</span>
        <button onClick={onRemove} className="skill-rm">✕</button>
      </div>
      <select className="twk-field" value={skill.icon} onChange={e => onChange({ ...skill, icon: e.target.value })}>
        {ICON_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
      </select>
      <input className="twk-field" placeholder="類型 (主動/被動/終極…)" value={skill.kind} onChange={e => onChange({ ...skill, kind: e.target.value })} />
      <input className="twk-field" placeholder="技能名稱" value={skill.name} onChange={e => onChange({ ...skill, name: e.target.value })} />
      <textarea className="twk-field skill-desc-field" placeholder="技能描述" value={skill.desc} onChange={e => onChange({ ...skill, desc: e.target.value })} />
      <label className="skill-ult-lbl">
        <input type="checkbox" checked={!!skill.kindHighlight} onChange={e => onChange({ ...skill, kindHighlight: e.target.checked })} />
        <span>標示為終極（紅色強調）</span>
      </label>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const updateSkill = (idx, next) => {
    const skills = [...t.skills];
    skills[idx] = next;
    setTweak('skills', skills);
  };
  const removeSkill = idx => {
    const skills = t.skills.filter((_, i) => i !== idx);
    setTweak('skills', skills);
  };
  const addSkill = () => {
    setTweak('skills', [...t.skills, { icon: 'star', kind: '主動', name: '新技能', desc: '描述…' }]);
  };

  const updateTag = (idx, val) => {
    const tags = [...t.tags];
    tags[idx] = val;
    setTweak('tags', tags);
  };
  const addTag = () => {
    if (t.tags.length < 4) setTweak('tags', [...t.tags, '新標籤']);
  };
  const removeTag = idx => {
    setTweak('tags', t.tags.filter((_, i) => i !== idx));
  };

  const updateStat = (idx, key, val) => {
    const stats = [...t.stats];
    stats[idx] = { ...stats[idx], [key]: val };
    setTweak('stats', stats);
  };

  return (
    <div className="app-wrap">
      <div className="stage" style={{
        background: t.bgPattern === 'vignette'
          ? `radial-gradient(ellipse at center, ${t.bgColor} 0%, #08080c 100%)`
          : t.bgPattern === 'solid' ? t.bgColor
          : `radial-gradient(circle at 30% 20%, ${t.bgColor}, #050505)`,
      }}>
        <Card t={t} />
      </div>

      <TweaksPanel>
        <TweakSection label="卡牌資訊" />
        <TweakText  label="卡名"     value={t.name}      onChange={v => setTweak('name', v)} />
        <TweakText  label="費用"     value={t.cost}      onChange={v => setTweak('cost', v)} />
        <TweakText  label="類型"     value={t.typeLabel} onChange={v => setTweak('typeLabel', v)} />
        <TweakSelect label="稀有度"  value={t.rarity}    options={['N','R','SR','SSR','UR','LR']} onChange={v => setTweak('rarity', v)} />

        <TweakSection label="外框主題" />
        <TweakSelect label="框架色"
          value={t.frameTheme}
          options={Object.keys(FRAME_THEMES).map(k => ({ value: k, label: `${FRAME_THEMES[k].name} (${k})` }))}
          onChange={v => setTweak('frameTheme', v)} />
        <TweakSelect label="費用珠"
          value={t.costTheme}
          options={Object.keys(COST_THEMES)}
          onChange={v => setTweak('costTheme', v)} />

        <TweakSection label="標籤" />
        {t.tags.map((tag, i) => (
          <div key={i} className="tag-editor-row">
            <input className="twk-field" value={tag} onChange={e => updateTag(i, e.target.value)} />
            <button className="skill-rm" onClick={() => removeTag(i)}>✕</button>
          </div>
        ))}
        {t.tags.length < 4 && (
          <TweakButton onClick={addTag}>＋ 新增標籤</TweakButton>
        )}

        <TweakSection label="技能列表" />
        {t.skills.map((s, i) => (
          <SkillEditor key={i} skill={s} idx={i} onChange={n => updateSkill(i, n)} onRemove={() => removeSkill(i)} />
        ))}
        <TweakButton onClick={addSkill}>＋ 新增技能</TweakButton>

        <TweakSection label="風味敘述" />
        <TweakText label="引文" value={t.flavor} onChange={v => setTweak('flavor', v)} multiline />

        <TweakSection label="底部數值" />
        {t.stats.map((s, i) => (
          <div key={i} className="stat-editor-row">
            <input className="twk-field stat-lbl" value={s.label} onChange={e => updateStat(i, 'label', e.target.value)} />
            <input className="twk-field stat-val" value={s.value} onChange={e => updateStat(i, 'value', e.target.value)} />
          </div>
        ))}

        <TweakSection label="背景" />
        <TweakColor label="底色" value={t.bgColor}
          options={['#1a1a20', '#0d1620', '#1f0a0c', '#0a1a14', '#150d24', '#2b1b08']}
          onChange={v => setTweak('bgColor', v)} />
        <TweakRadio label="模式" value={t.bgPattern}
          options={['vignette', 'solid']}
          onChange={v => setTweak('bgPattern', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
