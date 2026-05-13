import { ALL_CARDS, DEMON_CARDS, ENEMY_INTERNAL_CARDS, getCard } from "../data/cards";
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

  it("shows readable choice text for 盟約之誓 instead of raw script tag", () => {
    const model = buildCardFaceModel(getCard("S14"));
    const text = model.effectLines.join(" ");

    expect(text).toContain("三選一");
    expect(text).toContain("全面恢復");
    expect(text).toContain("全面強化");
    expect(text).toContain("全面淨化");
    expect(text).not.toContain("OATH_CHOICE");
  });

  it("does not expose raw scripted tags or payloads on any card face", () => {
    const rawScriptPattern = /腳本效果|[A-Z]{2,}_[A-Z0-9_]+|\{"[a-zA-Z0-9_]+":/;

    for (const card of [...ALL_CARDS, ...ENEMY_INTERNAL_CARDS, ...DEMON_CARDS]) {
      const model = buildCardFaceModel(card);
      const text = model.effectLines.join(" ");

      expect(text, `${card.id} ${card.name}`).not.toMatch(rawScriptPattern);
    }
  });
});
