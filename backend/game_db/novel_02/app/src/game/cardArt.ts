export type CardArtTone = "neutral" | "warm" | "cool" | "bright" | "shadow";

export interface CardArtSpec {
  src?: string;
  objectPosition?: string;
  artist?: string;
  credit?: string;
  tone?: CardArtTone;
}

export interface ResolvedCardArt {
  src: string;
  objectPosition: string;
  artist?: string;
  credit?: string;
  tone: CardArtTone;
  hasOverride: boolean;
}

export type CardArtManifest = Record<string, CardArtSpec | undefined>;

export const CARD_ART_BASE_PATH = "/card-art/cards";
export const DEFAULT_CARD_ART_POSITION = "50% 40%";
export const DEFAULT_CARD_ART_TONE: CardArtTone = "neutral";

const CARD_ART_MANIFEST: CardArtManifest = {};

export function defaultCardArtSrc(cardId: string): string {
  return `${CARD_ART_BASE_PATH}/${cardId}.webp`;
}

export function resolveCardArt(cardId: string, manifest: CardArtManifest = CARD_ART_MANIFEST): ResolvedCardArt {
  const override = manifest[cardId];

  return {
    src: override?.src ?? defaultCardArtSrc(cardId),
    objectPosition: override?.objectPosition ?? DEFAULT_CARD_ART_POSITION,
    artist: override?.artist,
    credit: override?.credit,
    tone: override?.tone ?? DEFAULT_CARD_ART_TONE,
    hasOverride: override !== undefined,
  };
}
