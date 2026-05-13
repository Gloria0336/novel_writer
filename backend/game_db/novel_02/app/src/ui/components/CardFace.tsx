import { useEffect, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import type { CardFaceModel } from "../../game/cardPresentation";
import styles from "./cardFace.module.css";

export type CardFaceVariant = "hand" | "gallery" | "mini" | "preview";

interface CardFaceProps {
  model: CardFaceModel;
  variant?: CardFaceVariant;
  playable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  targetable?: boolean;
  className?: string;
  onClick?: () => void;
  onPreview?: () => void;
}

export function CardFace({
  model,
  variant = "hand",
  playable = false,
  selected = false,
  disabled = false,
  targetable = false,
  className,
  onClick,
  onPreview,
}: CardFaceProps): JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);
  const isInteractive = onClick !== undefined && !disabled;
  const visibleLines =
    variant === "preview"
      ? model.effectLines
      : variant === "gallery"
        ? model.effectLines.slice(0, 5)
        : model.effectLines.slice(0, 3);
  const toneClass = styles[model.art.tone] ?? "";

  useEffect(() => {
    setImageFailed(false);
  }, [model.art.src]);

  function activate(): void {
    if (!isInteractive) return;
    onClick();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (!isInteractive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  function handleContextMenu(event: MouseEvent<HTMLElement>): void {
    if (!onPreview) return;
    event.preventDefault();
    onPreview();
  }

  const style = {
    "--card-type-color": model.typeColor,
    "--card-rarity-color": model.rarityColor,
    "--card-art-position": model.art.objectPosition,
  } as CSSProperties;

  const classes = [
    styles.face,
    styles[variant],
    playable ? styles.playable : "",
    selected ? styles.selected : "",
    disabled ? styles.disabled : "",
    targetable ? styles.targetable : "",
    isInteractive ? styles.interactive : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={classes}
      style={style}
      onClick={activate}
      onKeyDown={handleKeyDown}
      onContextMenu={onPreview ? handleContextMenu : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-disabled={disabled || undefined}
      title={`${model.name} (${model.id})`}
      data-rarity={model.rarity}
      data-type={model.type}
    >
      <div className={styles.frameGlow} />
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <strong className={styles.name}>{model.name}</strong>
          {model.metaLine && <span className={styles.meta}>{model.metaLine}</span>}
        </div>
        <span className={styles.cost}>{model.cost}</span>
      </header>

      <div className={styles.artBox}>
        {!imageFailed && (
          <img
            className={styles.art}
            src={model.art.src}
            alt=""
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        )}
        {imageFailed && (
          <div className={[styles.artFallback, toneClass].filter(Boolean).join(" ")}>
            <span>{model.id}</span>
          </div>
        )}
        <span className={styles.typeRibbon}>{model.typeLabel}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.badgeRow}>
          <span className={styles.rarity}>{model.rarityLabel}</span>
          <span className={styles.cardId}>{model.id}</span>
        </div>

        {variant !== "mini" && (
          <ul className={styles.effectList}>
            {visibleLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      {model.stats && (
        <footer className={styles.stats}>
          <span>HP {formatHp(model.stats.hp, model.stats.maxHp)}</span>
          <span>ATK {model.stats.atk}</span>
          <span>DEF {model.stats.def}</span>
        </footer>
      )}
    </article>
  );
}

function formatHp(hp: number, maxHp: number | undefined): string {
  return maxHp === undefined ? `${hp}` : `${hp}/${maxHp}`;
}
