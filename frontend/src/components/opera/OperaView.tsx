import { useCallback, useMemo, useState } from "react";
import type { BridgeClient } from "../../services/bridgeClient";
import { OperaAgentService } from "../../services/operaAgentService";
import type { OpenRouterClient } from "../../services/openRouterClient";
import type { ModelInfo, RepoConfig, RepoTreeEntry } from "../../types/app";
import type {
  OperaCharacter,
  OperaMessage,
  OperaMessageType,
  OperaScene,
} from "../../types/opera";
import { useOperaStore } from "../../stores/OperaStore";
import { CharacterRoster } from "./CharacterRoster";
import { DirectorConsole } from "./DirectorConsole";
import { ImportModal } from "./ImportModal";
import { Stage } from "./Stage";

interface OperaViewProps {
  bridgeClient: BridgeClient;
  openRouterClient: OpenRouterClient | null;
  repoConfig: RepoConfig;
  repoEntries: RepoTreeEntry[];
  models: ModelInfo[];
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `opera-${Date.now()}-${Math.random()}`;
}

function createDefaultCharacter(): OperaCharacter {
  return {
    id: createId(),
    name: "新角色",
    model: "openai/gpt-4o-mini",
    temperature: 0.85,
    maxCompletionTokens: 600,
    role: "",
    personality: "",
    speechStyle: "",
    memoryLayers: { worldKnowledge: "", storyState: "", characterMemory: "", hiddenIntent: "" },
    isActive: true,
    avatarInitials: "新",
  };
}

function createDefaultScene(index: number): OperaScene {
  return {
    id: createId(),
    title: `場景 ${index}`,
    description: "",
    activeCharacterIds: [],
    createdAt: Date.now(),
  };
}

export function OperaView({
  bridgeClient,
  openRouterClient,
  repoConfig,
  repoEntries,
  models,
}: OperaViewProps) {
  const {
    state,
    setState,
    updateCampaign,
    upsertCharacter,
    updateCharacter,
    removeCharacter,
    addScene,
    updateScene,
    setActiveScene,
    addMessage,
    updateCampaignWorldKnowledge,
    updateCampaignStoryState,
  } = useOperaStore();

  const [sending, setSending] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [error, setError] = useState("");

  const agentService = useMemo(
    () => (openRouterClient ? new OperaAgentService(openRouterClient) : null),
    [openRouterClient],
  );

  // ─── 目前啟用的劇本與場景 ────────────────────────────────────────
  const activeCampaign = useMemo(
    () =>
      state.campaigns.find((c) => c.id === state.activeCampaignId) ?? state.campaigns[0],
    [state.campaigns, state.activeCampaignId],
  );

  const campaignScenes = useMemo(
    () =>
      activeCampaign.sceneIds
        .map((id) => state.scenes[id])
        .filter((s): s is OperaScene => Boolean(s)),
    [activeCampaign.sceneIds, state.scenes],
  );

  const activeScene = useMemo(
    () => state.scenes[activeCampaign.activeSceneId],
    [state.scenes, activeCampaign.activeSceneId],
  );

  const activeMessages = useMemo(
    () => state.messages[activeCampaign.activeSceneId] ?? [],
    [state.messages, activeCampaign.activeSceneId],
  );

  const campaignCharacters = useMemo(
    () =>
      activeCampaign.characterIds
        .map((id) => state.characters[id])
        .filter((c): c is OperaCharacter => Boolean(c)),
    [activeCampaign.characterIds, state.characters],
  );

  // ─── 角色操作 ────────────────────────────────────────────────────
  const handleAddCharacter = useCallback(() => {
    const newChar = createDefaultCharacter();
    upsertCharacter(newChar);
    updateCampaign(activeCampaign.id, {
      characterIds: [...activeCampaign.characterIds, newChar.id],
    });
  }, [activeCampaign, upsertCharacter, updateCampaign]);

  const handleToggleInScene = useCallback(
    (characterId: string) => {
      if (!activeScene) return;
      const current = activeScene.activeCharacterIds;
      const next = current.includes(characterId)
        ? current.filter((id) => id !== characterId)
        : [...current, characterId];
      updateScene(activeScene.id, { activeCharacterIds: next });
    },
    [activeScene, updateScene],
  );

  // ─── 場景操作 ────────────────────────────────────────────────────
  const handleAddScene = useCallback(() => {
    const scene = createDefaultScene(campaignScenes.length + 1);
    addScene(scene, activeCampaign.id);
    setActiveScene(activeCampaign.id, scene.id);
  }, [addScene, activeCampaign, campaignScenes.length, setActiveScene]);

  // ─── 導演注入訊息 ────────────────────────────────────────────────
  const handleDirectorSend = useCallback(
    (content: string, type: OperaMessageType, targetCharacterId?: string) => {
      if (!activeScene) return;

      const speakerName =
        type === "director"
          ? "導演"
          : type === "narration"
          ? "旁白"
          : (targetCharacterId && state.characters[targetCharacterId]?.name) ?? "導演";

      const speakerId =
        type === "director" || type === "narration"
          ? "director"
          : targetCharacterId ?? "director";

      const msg: OperaMessage = {
        id: createId(),
        sceneId: activeScene.id,
        speakerId,
        speakerName,
        type,
        content,
        createdAt: Date.now(),
      };
      addMessage(msg);
    },
    [activeScene, state.characters, addMessage],
  );

  // ─── 自動推進：觸發特定角色的 AI 回應 ────────────────────────────
  const handleAutoAdvance = useCallback(
    async (characterId: string) => {
      if (!agentService || !activeScene || sending) return;
      setError("");

      const character = state.characters[characterId];
      if (!character) return;

      setSending(true);

      const placeholderId = createId();
      const sceneId = activeScene.id;

      // 先加入 streaming 佔位訊息
      const placeholder: OperaMessage = {
        id: placeholderId,
        sceneId,
        speakerId: characterId,
        speakerName: character.name,
        type: "dialogue",
        content: "",
        createdAt: Date.now(),
        isStreaming: true,
      };
      addMessage(placeholder);

      try {
        const result = await agentService.runCharacterTurn({
          character,
          campaign: activeCampaign,
          scene: activeScene,
          allCharacters: state.characters,
          recentMessages: activeMessages,
        });

        // 將佔位訊息替換為真實回應
        setState((prev) => {
          const msgs = prev.messages[sceneId] ?? [];
          const updated = msgs.map((m) =>
            m.id === placeholderId
              ? { ...m, type: result.type, content: result.content, isStreaming: false }
              : m,
          );
          return { ...prev, messages: { ...prev.messages, [sceneId]: updated } };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "AI 代理人回應失敗");
        // 移除失敗的佔位訊息
        setState((prev) => {
          const msgs = (prev.messages[sceneId] ?? []).filter((m) => m.id !== placeholderId);
          return { ...prev, messages: { ...prev.messages, [sceneId]: msgs } };
        });
      } finally {
        setSending(false);
      }
    },
    [agentService, activeScene, activeCampaign, state.characters, activeMessages, sending, addMessage, setState],
  );

  // ─── GM 評估 ─────────────────────────────────────────────────────
  const handleEvaluate = useCallback(async () => {
    if (!agentService || !activeScene || isEvaluating) return;
    setError("");
    setIsEvaluating(true);

    try {
      const assessment = await agentService.runGmEvaluation({
        campaign: activeCampaign,
        scene: activeScene,
        characters: state.characters,
        messages: activeMessages,
      });

      const gmMsg: OperaMessage = {
        id: createId(),
        sceneId: activeScene.id,
        speakerId: "gm",
        speakerName: "GM",
        type: "gm-note",
        content: assessment,
        createdAt: Date.now(),
      };
      addMessage(gmMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "GM 評估失敗");
    } finally {
      setIsEvaluating(false);
    }
  }, [agentService, activeScene, activeCampaign, state.characters, activeMessages, isEvaluating, addMessage]);

  // ─── 匯入小說角色 ────────────────────────────────────────────────
  const handleImport = useCallback(
    (result: { characters: OperaCharacter[]; worldKnowledge: string; storyState: string }) => {
      const newIds: string[] = [];
      for (const char of result.characters) {
        upsertCharacter(char);
        newIds.push(char.id);
      }
      const existingIds = new Set(activeCampaign.characterIds);
      const merged = [
        ...activeCampaign.characterIds,
        ...newIds.filter((id) => !existingIds.has(id)),
      ];
      updateCampaign(activeCampaign.id, { characterIds: merged });

      if (result.worldKnowledge && !activeCampaign.worldKnowledge) {
        updateCampaignWorldKnowledge(activeCampaign.id, result.worldKnowledge);
      }
      if (result.storyState && !activeCampaign.storyState) {
        updateCampaignStoryState(activeCampaign.id, result.storyState);
      }
    },
    [activeCampaign, upsertCharacter, updateCampaign, updateCampaignWorldKnowledge, updateCampaignStoryState],
  );

  // ─── 渲染 ─────────────────────────────────────────────────────────
  return (
    <>
      {!openRouterClient && (
        <div className="screen-banner error" style={{ margin: "8px 24px 0" }}>
          OpenRouter API 金鑰未設定，請先在設定中輸入金鑰才能使用 AI 代理人功能。
        </div>
      )}

      <div className="opera-layout">
        {/* 左側：角色名單 */}
        <CharacterRoster
          activeCharacterIds={activeScene?.activeCharacterIds ?? []}
          characters={campaignCharacters}
          models={models}
          onAddCharacter={handleAddCharacter}
          onOpenImport={() => setIsImportOpen(true)}
          onRemoveCharacter={removeCharacter}
          onToggleInScene={handleToggleInScene}
          onUpdateCharacter={updateCharacter}
        />

        {/* 中央：舞台 */}
        {activeScene ? (
          <Stage
            characters={campaignCharacters}
            messages={activeMessages}
            onAutoAdvance={(id) => void handleAutoAdvance(id)}
            onDirectorSend={handleDirectorSend}
            onEditScene={() => {/* 場景編輯在右側導演台 */}}
            scene={activeScene}
            sending={sending}
          />
        ) : (
          <div
            className="opera-stage"
            style={{ alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "0.9rem" }}
          >
            無場景，請在右側點擊「＋ 新場景」。
          </div>
        )}

        {/* 右側：導演台 */}
        <DirectorConsole
          campaign={activeCampaign}
          isEvaluating={isEvaluating}
          models={models}
          onAddScene={handleAddScene}
          onEvaluate={() => void handleEvaluate()}
          onSelectScene={(sceneId) => setActiveScene(activeCampaign.id, sceneId)}
          onUpdateGmConfig={(patch) =>
            updateCampaign(activeCampaign.id, {
              gmConfig: { ...activeCampaign.gmConfig, ...patch },
            })
          }
          onUpdateScene={updateScene}
          onUpdateStoryState={(text) => updateCampaignStoryState(activeCampaign.id, text)}
          onUpdateWorldKnowledge={(text) => updateCampaignWorldKnowledge(activeCampaign.id, text)}
          scenes={campaignScenes}
        />
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div
          className="screen-banner error"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            maxWidth: 480,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "1rem", lineHeight: 1 }}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* 匯入 Modal */}
      <ImportModal
        bridgeClient={bridgeClient}
        defaultModel={models[0]?.id ?? "openai/gpt-4o-mini"}
        entries={repoEntries}
        isOpen={isImportOpen}
        models={models}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
        repoConfig={repoConfig}
      />
    </>
  );
}
