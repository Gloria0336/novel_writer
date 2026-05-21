import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleScreen } from "../ui/screens/BattleScreen";
import type { GameLogBridge } from "../types/gameLog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("BattleProvider UI action playback", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    delete window.gameLog;
    container.remove();
    vi.useRealTimers();
  });

  it("keeps auto recording alive through React StrictMode remount checks", async () => {
    const gameLog: GameLogBridge = {
      start: vi.fn(() => Promise.resolve({})),
      update: vi.fn(() => Promise.resolve({})),
      finish: vi.fn(() => Promise.resolve({})),
    };
    window.gameLog = gameLog;

    await act(async () => {
      root.render(
        <StrictMode>
          <BattleScreen
            heroId="lulu"
            enemyId="putrefactive_lair"
            initialDeckIds={[]}
            onExit={() => {}}
          />
        </StrictMode>,
      );
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(gameLog.start).toHaveBeenCalled();
    expect(gameLog.finish).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
      vi.runOnlyPendingTimers();
    });

    expect(gameLog.finish).toHaveBeenCalledWith(
      expect.any(String),
      "abandoned",
      "battle view unmounted",
      expect.objectContaining({ schemaVersion: 1 }),
    );
  });

  it("lets the end-turn button dispatch, animate, and unlock again", async () => {
    await act(async () => {
      root.render(
        <BattleScreen
          heroId="lulu"
          enemyId="putrefactive_lair"
          initialDeckIds={[]}
          onExit={() => {}}
        />,
      );
    });

    const button = container.querySelector('button[class*="endTurn"]') as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    expect(button!.disabled).toBe(false);

    act(() => {
      button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const lockedButton = container.querySelector('button[class*="endTurn"]') as HTMLButtonElement | null;
    expect(lockedButton).not.toBeNull();
    expect(lockedButton!.disabled).toBe(true);
    expect(lockedButton!.dataset.busy).toBe("true");
    expect(lockedButton!.textContent).toContain("回合結算中");
    expect(container.querySelector('[class*="logItem"]')).not.toBeNull();

    act(() => {
      vi.runAllTimers();
    });

    const unlockedButton = container.querySelector('button[class*="endTurn"]') as HTMLButtonElement | null;
    expect(unlockedButton).not.toBeNull();
    expect(unlockedButton!.disabled).toBe(false);
    expect(unlockedButton!.dataset.busy).toBe("false");
    expect(unlockedButton!.textContent).toContain("結束回合");
  });

  it("lets a playable troop card select a player slot and deploy", async () => {
    await act(async () => {
      root.render(
        <BattleScreen
          heroId="lulu"
          enemyId="putrefactive_lair"
          initialDeckIds={["T_c_01", "T_c_01", "T_c_01", "T_c_01"]}
          onExit={() => {}}
        />,
      );
    });

    const firstHandCard = container.querySelector('[class*="handCard"]') as HTMLElement | null;
    expect(firstHandCard).not.toBeNull();
    expect(firstHandCard!.dataset.playable).toBe("true");

    act(() => {
      firstHandCard!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const targetSlot = container.querySelector('[class*="unitSlot"][data-targetable="true"]') as HTMLElement | null;
    expect(targetSlot).not.toBeNull();

    act(() => {
      targetSlot!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[class*="logItem"]')).not.toBeNull();
    expect(container.querySelector('[class*="visualEventLayer"]')).not.toBeNull();
  });

  it("lets a playable device card select a player slot and deploy", async () => {
    await act(async () => {
      root.render(
        <BattleScreen
          heroId="eldr-thorin"
          enemyId="putrefactive_lair"
          initialDeckIds={["T_m_01", "T_m_01", "T_m_01", "T_m_01"]}
          onExit={() => {}}
        />,
      );
    });

    const endTurnButton = container.querySelector('button[class*="endTurn"]') as HTMLButtonElement | null;
    expect(endTurnButton).not.toBeNull();

    act(() => {
      endTurnButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      vi.runAllTimers();
    });

    const firstHandCard = container.querySelector('[class*="handCard"]') as HTMLElement | null;
    expect(firstHandCard).not.toBeNull();
    expect(firstHandCard!.dataset.playable).toBe("true");

    act(() => {
      firstHandCard!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const targetSlot = container.querySelector('[class*="unitSlot"][data-targetable="true"]') as HTMLElement | null;
    expect(targetSlot).not.toBeNull();

    act(() => {
      targetSlot!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[class*="logItem"]')).not.toBeNull();
  });

  it("lets a playable no-target spell dispatch from hand", async () => {
    await act(async () => {
      root.render(
        <BattleScreen
          heroId="lulu"
          enemyId="putrefactive_lair"
          initialDeckIds={["S_c_02", "S_c_02", "S_c_02", "S_c_02"]}
          onExit={() => {}}
        />,
      );
    });

    const firstHandCard = container.querySelector('[class*="handCard"]') as HTMLElement | null;
    expect(firstHandCard).not.toBeNull();
    expect(firstHandCard!.dataset.playable).toBe("true");

    act(() => {
      firstHandCard!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[class*="logItem"]')).not.toBeNull();
    expect(container.querySelector('[class*="visualEventLayer"]')).not.toBeNull();
  });

  it("keeps hand cards playable after an end-turn timeline finishes", async () => {
    await act(async () => {
      root.render(
        <BattleScreen
          heroId="lulu"
          enemyId="putrefactive_lair"
          initialDeckIds={["T_c_01", "T_c_01", "T_c_01", "T_c_01", "T_c_01"]}
          onExit={() => {}}
        />,
      );
    });

    const endTurnButton = container.querySelector('button[class*="endTurn"]') as HTMLButtonElement | null;
    expect(endTurnButton).not.toBeNull();

    act(() => {
      endTurnButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    act(() => {
      vi.runAllTimers();
    });

    const playableCard = container.querySelector('[class*="handCard"][data-playable="true"]') as HTMLElement | null;
    expect(playableCard).not.toBeNull();

    act(() => {
      playableCard!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const targetSlot = container.querySelector('[class*="unitSlot"][data-targetable="true"]') as HTMLElement | null;
    expect(targetSlot).not.toBeNull();
  });

  it("allows a second dispatch after the first timeline settles (structuredClone regression)", async () => {
    await act(async () => {
      root.render(
        <BattleScreen
          heroId="lulu"
          enemyId="putrefactive_lair"
          initialDeckIds={["T_c_01", "T_c_01", "T_c_01", "T_c_01", "T_c_01"]}
          onExit={() => {}}
        />,
      );
    });

    const endTurnButton = () =>
      container.querySelector('button[class*="endTurn"]') as HTMLButtonElement | null;

    // First end-turn dispatch.
    act(() => {
      endTurnButton()!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    act(() => {
      vi.runAllTimers();
    });

    // After the first timeline finishes, the button must return to "結束回合"
    // AND a *second* end-turn click must actually progress the game. The bug we
    // are protecting against left state.log with an own `push` property, which
    // made the next structuredClone in BattleProvider throw and silently swallow
    // the dispatch.
    const beforeSecond = container.querySelector('[class*="turnRound"]')?.textContent;

    act(() => {
      endTurnButton()!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    act(() => {
      vi.runAllTimers();
    });

    const afterSecond = container.querySelector('[class*="turnRound"]')?.textContent;
    expect(afterSecond).not.toBe(beforeSecond);

    // And after both timelines settle the player should be back in control.
    const unlocked = endTurnButton();
    expect(unlocked).not.toBeNull();
    expect(unlocked!.disabled).toBe(false);
    expect(unlocked!.dataset.busy).toBe("false");
  });
});
