import { ALL_CARDS, ENEMY_INTERNAL_CARDS } from "../data/cards";
import { defaultCardArtSrc, resolveCardArt } from "./cardArt";
import { buildCardFaceModel } from "./cardPresentation";

describe("card art resolution", () => {
  it("uses the public card-art path by default", () => {
    expect(defaultCardArtSrc("T01")).toBe("/card-art/cards/T01.webp");
    expect(resolveCardArt("T01").src).toBe("/card-art/cards/T01.webp");
  });

  it("allows manifest overrides for source, focus, and credit data", () => {
    const art = resolveCardArt("T01", {
      T01: {
        src: "/custom/t01.png",
        objectPosition: "30% 20%",
        artist: "Studio Test",
        credit: "Internal concept pass",
        tone: "warm",
      },
    });

    expect(art).toMatchObject({
      src: "/custom/t01.png",
      objectPosition: "30% 20%",
      artist: "Studio Test",
      credit: "Internal concept pass",
      tone: "warm",
      hasOverride: true,
    });
  });
});

describe("card face presentation", () => {
  it("builds a valid face model for every playable and internal card", () => {
    for (const card of [...ALL_CARDS, ...ENEMY_INTERNAL_CARDS]) {
      const model = buildCardFaceModel(card);

      expect(model.id).toBe(card.id);
      expect(model.name).toBe(card.name);
      expect(model.typeLabel.length).toBeGreaterThan(0);
      expect(model.rarityLabel.length).toBeGreaterThan(0);
      expect(model.effectLines.length).toBeGreaterThan(0);
      expect(model.art.src).toBe(`/card-art/cards/${card.id}.webp`);
    }
  });

  it("creates sensible stat and summary fallbacks for every card type", () => {
    const byType = new Map(ALL_CARDS.map((card) => [card.type, card]));

    for (const type of ["troop", "action", "spell", "equipment", "field"] as const) {
      const card = byType.get(type);
      expect(card, `missing fixture for ${type}`).toBeDefined();

      const model = buildCardFaceModel(card!);
      expect(model.effectLines.join(" ").trim().length).toBeGreaterThan(0);
      if (type === "troop") expect(model.stats).toBeDefined();
      else expect(model.stats).toBeUndefined();
    }
  });
});
