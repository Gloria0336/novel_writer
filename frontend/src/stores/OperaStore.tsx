import { createContext, useContext, useMemo } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import type {
  OperaCampaign,
  OperaCharacter,
  OperaGmConfig,
  OperaMessage,
  OperaScene,
  OperaState,
} from "../types/opera";
import { DEFAULT_OPERA_GM_MODEL } from "../utils/constants";
import { usePersistentState } from "../hooks/usePersistentState";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `opera-${Date.now()}-${Math.random()}`;
}

function createDefaultGmConfig(): OperaGmConfig {
  return {
    model: DEFAULT_OPERA_GM_MODEL,
    temperature: 0.4,
    maxCompletionTokens: 800,
    systemPromptExtra: "",
    autoEvalFrequency: 0,
    isEnabled: true,
  };
}

function createDefaultCampaign(): OperaCampaign {
  const id = createId();
  const sceneId = createId();
  return {
    id,
    name: "新劇本",
    worldKnowledge: "",
    storyState: "",
    gmConfig: createDefaultGmConfig(),
    characterIds: [],
    sceneIds: [sceneId],
    activeSceneId: sceneId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const defaultCampaign = createDefaultCampaign();
const defaultSceneId = defaultCampaign.sceneIds[0];

const DEFAULT_OPERA_STATE: OperaState = {
  campaigns: [defaultCampaign],
  activeCampaignId: defaultCampaign.id,
  characters: {},
  scenes: {
    [defaultSceneId]: {
      id: defaultSceneId,
      title: "第一幕",
      description: "",
      activeCharacterIds: [],
      createdAt: Date.now(),
    },
  },
  messages: {
    [defaultSceneId]: [],
  },
};

function normalizeOperaState(state: OperaState): OperaState {
  const campaigns = state.campaigns.length > 0 ? state.campaigns : DEFAULT_OPERA_STATE.campaigns;
  const campaignIds = new Set(campaigns.map((c) => c.id));
  const activeCampaignId = campaignIds.has(state.activeCampaignId)
    ? state.activeCampaignId
    : campaigns[0].id;

  const scenes = { ...state.scenes };
  const messages = { ...state.messages };

  for (const campaign of campaigns) {
    for (const sceneId of campaign.sceneIds) {
      if (!scenes[sceneId]) {
        scenes[sceneId] = {
          id: sceneId,
          title: "場景",
          description: "",
          activeCharacterIds: [],
          createdAt: Date.now(),
        };
      }
      if (!messages[sceneId]) {
        messages[sceneId] = [];
      }
    }
  }

  return {
    campaigns,
    activeCampaignId,
    characters: state.characters ?? {},
    scenes,
    messages,
  };
}

interface OperaStoreValue {
  state: OperaState;
  setState: Dispatch<SetStateAction<OperaState>>;

  addCampaign: (campaign: OperaCampaign) => void;
  updateCampaign: (campaignId: string, patch: Partial<OperaCampaign>) => void;
  removeCampaign: (campaignId: string) => void;
  setActiveCampaignId: (campaignId: string) => void;

  upsertCharacter: (character: OperaCharacter) => void;
  updateCharacter: (characterId: string, patch: Partial<OperaCharacter>) => void;
  removeCharacter: (characterId: string) => void;

  addScene: (scene: OperaScene, campaignId: string) => void;
  updateScene: (sceneId: string, patch: Partial<OperaScene>) => void;
  setActiveScene: (campaignId: string, sceneId: string) => void;

  addMessage: (message: OperaMessage) => void;
  replaceLastMessage: (sceneId: string, message: OperaMessage) => void;
  clearSceneMessages: (sceneId: string) => void;

  updateCampaignWorldKnowledge: (campaignId: string, text: string) => void;
  updateCampaignStoryState: (campaignId: string, text: string) => void;
  updateCharacterMemoryLayer: (
    characterId: string,
    layer: keyof OperaCharacter["memoryLayers"],
    text: string,
  ) => void;
}

const OperaStoreContext = createContext<OperaStoreValue | null>(null);

export function OperaStoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = usePersistentState<OperaState>("opera", DEFAULT_OPERA_STATE);
  const normalized = useMemo(() => normalizeOperaState(state), [state]);

  const value = useMemo<OperaStoreValue>(
    () => ({
      state: normalized,
      setState,

      addCampaign: (campaign) => {
        setState((prev) =>
          normalizeOperaState({
            ...prev,
            campaigns: [...prev.campaigns, campaign],
            activeCampaignId: campaign.id,
            scenes: {
              ...prev.scenes,
              ...(campaign.sceneIds[0]
                ? {
                    [campaign.sceneIds[0]]: {
                      id: campaign.sceneIds[0],
                      title: "第一幕",
                      description: "",
                      activeCharacterIds: [],
                      createdAt: Date.now(),
                    },
                  }
                : {}),
            },
            messages: {
              ...prev.messages,
              ...(campaign.sceneIds[0] ? { [campaign.sceneIds[0]]: [] } : {}),
            },
          }),
        );
      },

      updateCampaign: (campaignId, patch) => {
        setState((prev) =>
          normalizeOperaState({
            ...prev,
            campaigns: prev.campaigns.map((c) =>
              c.id === campaignId ? { ...c, ...patch, updatedAt: Date.now() } : c,
            ),
          }),
        );
      },

      removeCampaign: (campaignId) => {
        setState((prev) => {
          const campaigns = prev.campaigns.filter((c) => c.id !== campaignId);
          if (campaigns.length === 0) {
            return DEFAULT_OPERA_STATE;
          }
          return normalizeOperaState({
            ...prev,
            campaigns,
            activeCampaignId:
              prev.activeCampaignId === campaignId ? campaigns[0].id : prev.activeCampaignId,
          });
        });
      },

      setActiveCampaignId: (campaignId) => {
        setState((prev) => normalizeOperaState({ ...prev, activeCampaignId: campaignId }));
      },

      upsertCharacter: (character) => {
        setState((prev) =>
          normalizeOperaState({
            ...prev,
            characters: { ...prev.characters, [character.id]: character },
          }),
        );
      },

      updateCharacter: (characterId, patch) => {
        setState((prev) => {
          const existing = prev.characters[characterId];
          if (!existing) return prev;
          return normalizeOperaState({
            ...prev,
            characters: { ...prev.characters, [characterId]: { ...existing, ...patch } },
          });
        });
      },

      removeCharacter: (characterId) => {
        setState((prev) => {
          const characters = { ...prev.characters };
          delete characters[characterId];
          return normalizeOperaState({
            ...prev,
            characters,
            campaigns: prev.campaigns.map((c) => ({
              ...c,
              characterIds: c.characterIds.filter((id) => id !== characterId),
            })),
          });
        });
      },

      addScene: (scene, campaignId) => {
        setState((prev) =>
          normalizeOperaState({
            ...prev,
            scenes: { ...prev.scenes, [scene.id]: scene },
            messages: { ...prev.messages, [scene.id]: [] },
            campaigns: prev.campaigns.map((c) =>
              c.id === campaignId
                ? { ...c, sceneIds: [...c.sceneIds, scene.id], updatedAt: Date.now() }
                : c,
            ),
          }),
        );
      },

      updateScene: (sceneId, patch) => {
        setState((prev) => {
          const existing = prev.scenes[sceneId];
          if (!existing) return prev;
          return normalizeOperaState({
            ...prev,
            scenes: { ...prev.scenes, [sceneId]: { ...existing, ...patch } },
          });
        });
      },

      setActiveScene: (campaignId, sceneId) => {
        setState((prev) =>
          normalizeOperaState({
            ...prev,
            campaigns: prev.campaigns.map((c) =>
              c.id === campaignId ? { ...c, activeSceneId: sceneId, updatedAt: Date.now() } : c,
            ),
          }),
        );
      },

      addMessage: (message) => {
        setState((prev) =>
          normalizeOperaState({
            ...prev,
            messages: {
              ...prev.messages,
              [message.sceneId]: [...(prev.messages[message.sceneId] ?? []), message],
            },
          }),
        );
      },

      replaceLastMessage: (sceneId, message) => {
        setState((prev) => {
          const existing = prev.messages[sceneId] ?? [];
          const updated =
            existing.length > 0
              ? [...existing.slice(0, -1), message]
              : [message];
          return normalizeOperaState({
            ...prev,
            messages: { ...prev.messages, [sceneId]: updated },
          });
        });
      },

      clearSceneMessages: (sceneId) => {
        setState((prev) =>
          normalizeOperaState({
            ...prev,
            messages: { ...prev.messages, [sceneId]: [] },
          }),
        );
      },

      updateCampaignWorldKnowledge: (campaignId, text) => {
        setState((prev) =>
          normalizeOperaState({
            ...prev,
            campaigns: prev.campaigns.map((c) =>
              c.id === campaignId ? { ...c, worldKnowledge: text, updatedAt: Date.now() } : c,
            ),
          }),
        );
      },

      updateCampaignStoryState: (campaignId, text) => {
        setState((prev) =>
          normalizeOperaState({
            ...prev,
            campaigns: prev.campaigns.map((c) =>
              c.id === campaignId ? { ...c, storyState: text, updatedAt: Date.now() } : c,
            ),
          }),
        );
      },

      updateCharacterMemoryLayer: (characterId, layer, text) => {
        setState((prev) => {
          const existing = prev.characters[characterId];
          if (!existing) return prev;
          return normalizeOperaState({
            ...prev,
            characters: {
              ...prev.characters,
              [characterId]: {
                ...existing,
                memoryLayers: { ...existing.memoryLayers, [layer]: text },
              },
            },
          });
        });
      },
    }),
    [normalized, setState],
  );

  return <OperaStoreContext.Provider value={value}>{children}</OperaStoreContext.Provider>;
}

export function useOperaStore() {
  const context = useContext(OperaStoreContext);
  if (!context) {
    throw new Error("useOperaStore must be used within OperaStoreProvider");
  }
  return context;
}
