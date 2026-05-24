import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState
} from "react";
import YAML from "yaml";

import { api, getStoredOpenRouterApiKey, setStoredOpenRouterApiKey, streamUrl } from "./api";
import type {
  ActorProfile,
  BundleResponse,
  CampaignSummary,
  NovelSummary,
  OpenRouterStatus,
  StepResponse,
  StreamEnvelope,
  StoryEvent,
  ViewResponse
} from "./types";

type LeftTab = "settings" | "memory" | "scripts";
type InputMode = "player" | "gm" | "director" | "inject";
type CenterMode = "story" | "backstage";

type FeedItem = {
  id: string;
  title: string;
  body: string;
  meta: string;
  tone?: string;
  createdAt?: string;
};

const GM_MODEL_OPTIONS = [
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.5",
  "x-ai/grok-4.3",
  "google/gemini-3.5-flash"
];

const NPC_MODEL_OPTIONS = [
  "google/gemini-3.5-flash",
  "moonshotai/kimi-k2.6",
  "deepseek/deepseek-v4-flash",
  "x-ai/grok-4.3"
];

function modelOptionsForRole(role: ActorProfile["role"]): string[] {
  if (role === "gm") return GM_MODEL_OPTIONS;
  if (role === "npc") return NPC_MODEL_OPTIONS;
  return [];
}

function modelNameForActor(actor: ActorProfile, modelName: string): string {
  const options = modelOptionsForRole(actor.role);
  if (options.length === 0) return modelName;
  return options.includes(modelName) ? modelName : options[0];
}

const keyLabels: Record<string, string> = {
  campaign: "劇本",
  rulebook: "規則書",
  world_entries: "世界設定條目",
  latest_snapshot: "最新快照",
  timeline: "時間線",
  memories: "記憶",
  director_notes: "導演備註",
  gm_briefs: "GM 簡報",
  resolutions: "解析結果",
  novel_db_overlay: "NovelDB 劇本包",
  world_sections: "世界觀區段",
  context_current: "目前上下文",
  current_status: "目前狀態",
  last_chapter_summary: "上章摘要",
  secrets_lockbox: "秘密鎖箱",
  name: "名稱",
  description: "描述",
  status: "狀態",
  player_actor_id: "玩家角色 ID",
  active_run_id: "目前執行序 ID",
  metadata_json: "中繼資料",
  id: "ID",
  title: "標題",
  body: "內容",
  category: "分類",
  visibility_scope: "可見範圍",
  tags_json: "標籤",
  role: "角色類型",
  persona: "人物設定",
  motives_json: "動機",
  secret_motives: "秘密動機",
  model_provider: "模型供應商",
  model_name: "模型名稱",
  temperature: "溫度",
  current_scene: "目前場景",
  active_objectives_json: "進行中目標",
  npc_statuses_json: "NPC 狀態",
  raw_state_json: "原始狀態",
  run_id: "執行序 ID",
  sequence_no: "序號",
  event_kind: "事件類型",
  source_channel: "來源頻道",
  actor_id: "角色 ID",
  payload_json: "附加資料",
  created_at: "建立時間",
  scope: "範圍",
  artifact_type: "記憶類型",
  summary: "摘要",
  facts_json: "事實",
  recent_excerpt: "近期摘錄",
  source_event_ids_json: "來源事件 ID",
  token_count: "Token 數",
  note_type: "備註類型",
  is_consumed: "已消耗",
  reveal_in_context: "顯示於上下文",
  seed: "種子",
  rule_version: "規則版本",
  outcome: "結果",
  total: "總值",
  target: "目標值",
  breakdown_json: "拆解資訊",
  override_source: "覆寫來源",
  narration: "敘述",
  audience: "視角",
  layers: "層級",
  current_node: "目前節點",
  gm_output: "GM 輸出",
  actor_turns: "角色回合",
  resolution: "解析",
  node_log: "節點紀錄",
  interrupt_payload: "中斷資料",
  event: "事件",
  timestamp: "時間戳記",
  public_text: "公開文字",
  hidden_intent: "隱藏意圖",
  scene_title: "場景標題",
  pressure: "壓力",
  detail: "細節",
  node: "節點"
};

const valueLabels: Record<string, string> = {
  active: "進行中",
  paused: "已暫停",
  interrupted: "已中斷",
  idle: "待命中",
  completed: "已完成",
  public: "公開",
  private: "私密",
  world: "世界",
  player: "玩家",
  gm: "GM",
  director: "導演",
  agent: "代理",
  npc: "NPC",
  system: "系統",
  load_state: "載入狀態",
  director_preface: "導演前置階段",
  gm_frame: "GM 場景鋪陳",
  actor_round: "角色反應回合",
  rules_resolution: "規則解析",
  state_commit: "狀態提交",
  summarize: "摘要整理",
  awaiting_next_step: "等待下一步",
  campaign_created: "劇本建立",
  player_action: "玩家行動",
  actor_turn: "角色回合",
  nudge: "提示",
  inject_event: "注入事件",
  note: "備註",
  public_summary: "公開摘要",
  compressed_summary: "壓縮摘要",
  success: "成功",
  failure: "失敗",
  critical_success: "大成功",
  critical_failure: "大失敗",
  investigate: "調查",
  watchful: "警戒",
  guarded: "戒備",
  skittish: "驚惶",
  created: "已建立",
  pause_before_node: "節點前暫停",
  manual_step_complete: "手動步驟完成"
};

const leftTabs: Array<{ id: LeftTab; label: string }> = [
  { id: "settings", label: "設定查詢" },
  { id: "memory", label: "記憶層" },
  { id: "scripts", label: "劇本包" }
];

const inputModes: Array<{ id: InputMode; label: string }> = [
  { id: "player", label: "玩家行動" },
  { id: "gm", label: "GM 簡報" },
  { id: "director", label: "導演備註" },
  { id: "inject", label: "注入事件" }
];

const centerModes: Array<{ id: CenterMode; label: string }> = [
  { id: "story", label: "劇情" },
  { id: "backstage", label: "後台" }
];

const storyInputModeIds: InputMode[] = ["player"];
const backstageInputModeIds: InputMode[] = ["gm", "director", "inject"];

const inputModeLabels: Record<InputMode, string> = {
  player: "玩家行動",
  gm: "GM 簡報",
  director: "導演備註",
  inject: "注入事件"
};

const inputModePlaceholders: Record<InputMode, string> = {
  player: "輸入玩家接下來要採取的行動、目標或對話。",
  gm: "輸入要提供給 GM 的場景重點、節奏提醒或公開資訊。",
  director: "輸入導演層級的備註、節奏調整或隱藏指令。",
  inject: "輸入要插入目前劇情的事件、變化或外部壓力。"
};

function translateText(value: string): string {
  return valueLabels[value] ?? value;
}

function localizeData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(localizeData);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, innerValue]) => [
        keyLabels[key] ?? key,
        localizeData(innerValue)
      ])
    );
  }
  if (typeof value === "string") {
    return translateText(value);
  }
  return value;
}

function prettyLocalized(value: unknown): string {
  return JSON.stringify(localizeData(value), null, 2);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function shortText(value: string, max = 220): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= max) {
    return compact;
  }
  return `${compact.slice(0, max - 1)}…`;
}

function readableRecordText(value: unknown, keys: string[]): string {
  const record = asRecord(value);
  for (const key of keys) {
    const entry = record[key];
    if (typeof entry === "string" && entry.trim()) {
      return entry;
    }
  }
  return "";
}

function layerOf(view: ViewResponse | null, layer: string): unknown {
  return view?.layers[layer] ?? {};
}

function eventToFeedItem(event: StoryEvent): FeedItem {
  return {
    id: `event-${event.id}`,
    title: event.title,
    body: event.body,
    meta: `${translateText(event.source_channel)} #${event.sequence_no}`,
    tone: event.event_kind,
    createdAt: event.created_at
  };
}

function directorNoteToFeedItem(note: BundleResponse["director_notes"][number]): FeedItem {
  return {
    id: `note-${note.id}`,
    title: note.note_type === "inject_event" ? "注入事件" : "導演備註",
    body: note.body,
    meta: `${note.title} · ${new Date(note.created_at).toLocaleTimeString()}`,
    tone: note.note_type,
    createdAt: note.created_at
  };
}

function gmBriefToFeedItem(brief: BundleResponse["gm_briefs"][number]): FeedItem {
  return {
    id: `brief-${brief.id}`,
    title: "GM 簡報",
    body: brief.body,
    meta: `${brief.title} · ${new Date(brief.created_at).toLocaleTimeString()}`,
    tone: "gm_brief",
    createdAt: brief.created_at
  };
}

function streamToFeedItem(message: StreamEnvelope, index: number): FeedItem {
  const payloadText = readableRecordText(message.payload, ["body", "title", "detail", "id"]);
  return {
    id: `${message.timestamp}-${index}`,
    title: translateText(message.event),
    body: payloadText || prettyLocalized(message.payload),
    meta: new Date(message.timestamp).toLocaleTimeString(),
    tone: "stream"
  };
}

function actorStatus(actor: ActorProfile, bundle: BundleResponse | null): Record<string, unknown> {
  const npcStatuses = asRecord(bundle?.latest_snapshot?.npc_statuses_json);
  return asRecord(npcStatuses[actor.name]);
}

function openRouterIndicatorTone(status: OpenRouterStatus | null): string {
  if (!status) return "is-checking";
  if (status.connected) return "is-online";
  if (!status.configured) return "is-missing";
  return "is-offline";
}

function openRouterIndicatorLabel(status: OpenRouterStatus | null): string {
  if (!status) return "OpenRouter 檢查中";
  if (status.connected) {
    return status.latency_ms === null
      ? "OpenRouter 已連線"
      : `OpenRouter 已連線 ${status.latency_ms}ms`;
  }
  if (!status.configured) return "OpenRouter 未設定";
  return "OpenRouter 離線";
}

export default function App() {
  const [novels, setNovels] = useState<NovelSummary[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selectedNovelId, setSelectedNovelId] = useState("");
  const [selectedPlayerCharId, setSelectedPlayerCharId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [bundle, setBundle] = useState<BundleResponse | null>(null);
  const [directorView, setDirectorView] = useState<ViewResponse | null>(null);
  const [gmView, setGMView] = useState<ViewResponse | null>(null);
  const [agentViews, setAgentViews] = useState<Record<string, ViewResponse>>({});
  const [stepResult, setStepResult] = useState<StepResponse | null>(null);
  const [exportFormat, setExportFormat] = useState("json");
  const [exportedContent, setExportedContent] = useState("");
  const [importBuffer, setImportBuffer] = useState("");
  const [logMessages, setLogMessages] = useState<StreamEnvelope[]>([]);
  const [playerAction, setPlayerAction] = useState("");
  const [directorNote, setDirectorNote] = useState("");
  const [gmBrief, setGMBrief] = useState("");
  const [injectedEvent, setInjectedEvent] = useState("");
  const [status, setStatus] = useState("待命中。");
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>("settings");
  const [centerMode, setCenterMode] = useState<CenterMode>("story");
  const [activeInputMode, setActiveInputMode] = useState<InputMode>("player");
  const [submittingInputMode, setSubmittingInputMode] = useState<InputMode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSettingId, setSelectedSettingId] = useState("");
  const [expandedActorId, setExpandedActorId] = useState("");
  const [sceneExpanded, setSceneExpanded] = useState(false);
  const [actorEdits, setActorEdits] = useState<
    Record<string, { model_name: string; temperature: string }>
  >({});
  const [savingActorId, setSavingActorId] = useState("");
  const [openRouterStatus, setOpenRouterStatus] = useState<OpenRouterStatus | null>(null);
  const [openRouterKeyDraft, setOpenRouterKeyDraft] = useState(getStoredOpenRouterApiKey);
  const [openRouterKeyPanelOpen, setOpenRouterKeyPanelOpen] = useState(false);

  const deferredLogs = useDeferredValue(logMessages);
  const selectedNovel = novels.find((novel) => novel.novel_id === selectedNovelId) ?? null;
  const filteredCampaigns = useMemo(
    () =>
      selectedNovelId
        ? campaigns.filter((campaign) => campaign.metadata_json.novel_id === selectedNovelId)
        : campaigns,
    [campaigns, selectedNovelId]
  );
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;
  const playerActor = bundle?.actors.find((actor) => actor.role === "player") ?? null;
  const latestScene = bundle?.latest_snapshot?.current_scene ?? "尚未選擇劇本。";
  const directorOverlay = asRecord(directorView?.layers.novel_db_overlay);

  async function loadNovels() {
    const data = await api.listNovels();
    setNovels(data);
    if (!selectedNovelId && data.length) {
      const preferred = data.find((novel) => novel.novel_id === "novel_04_dungen") ?? data[0];
      setSelectedNovelId(preferred.novel_id);
      setSelectedPlayerCharId(preferred.characters[0]?.char_id ?? "");
    }
  }

  async function loadCampaigns(preferredCampaignId?: string) {
    const data = await api.listCampaigns();
    setCampaigns(data);
    if (preferredCampaignId) {
      setSelectedCampaignId(preferredCampaignId);
    } else if (!selectedCampaignId && data[0]) {
      setSelectedCampaignId(data[0].id);
    }
  }

  async function refreshCampaignState(campaignId: string) {
    const [bundleResponse, director, gm] = await Promise.all([
      api.getCampaign(campaignId),
      api.getDirectorView(campaignId),
      api.getGMView(campaignId)
    ]);
    const actorViews = await Promise.all(
      bundleResponse.actors
        .filter((actor) => actor.role !== "player")
        .map((actor) => api.getAgentView(campaignId, actor.id))
    );
    setBundle(bundleResponse);
    setDirectorView(director);
    setGMView(gm);
    setAgentViews(
      Object.fromEntries(
        actorViews
          .filter((view) => view.actor_id)
          .map((view) => [view.actor_id as string, view])
      )
    );
    if (!expandedActorId) {
      setExpandedActorId(bundleResponse.actors.find((actor) => actor.role !== "player")?.id ?? "");
    }
  }

  async function refreshOpenRouterConnection(shouldIgnore = () => false) {
    try {
      const data = await api.getOpenRouterStatus();
      if (!shouldIgnore()) {
        setOpenRouterStatus(data);
      }
    } catch (error) {
      if (!shouldIgnore()) {
        setOpenRouterStatus({
          connected: false,
          configured: false,
          status: "frontend_error",
          status_code: null,
          latency_ms: null,
          checked_at: new Date().toISOString(),
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  useEffect(() => {
    void loadNovels();
    void loadCampaigns();
  }, []);

  useEffect(() => {
    let cancelled = false;

    void refreshOpenRouterConnection(() => cancelled);
    const intervalId = window.setInterval(
      () => void refreshOpenRouterConnection(() => cancelled),
      5000
    );
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const novel = novels.find((item) => item.novel_id === selectedNovelId);
    if (novel && !novel.characters.some((character) => character.char_id === selectedPlayerCharId)) {
      setSelectedPlayerCharId(novel.characters[0]?.char_id ?? "");
    }
  }, [novels, selectedNovelId, selectedPlayerCharId]);

  useEffect(() => {
    if (!selectedNovelId) {
      return;
    }
    if (selectedCampaign?.metadata_json.novel_id === selectedNovelId) {
      return;
    }
    if (filteredCampaigns[0]) {
      setSelectedCampaignId(filteredCampaigns[0].id);
      return;
    }
    setSelectedCampaignId("");
    setBundle(null);
    setDirectorView(null);
    setGMView(null);
    setAgentViews({});
    setStepResult(null);
  }, [filteredCampaigns, selectedCampaign, selectedNovelId]);

  useEffect(() => {
    if (!selectedCampaignId) {
      return;
    }
    startTransition(() => {
      void refreshCampaignState(selectedCampaignId);
    });
  }, [selectedCampaignId]);

  useEffect(() => {
    if (!selectedCampaignId) {
      return;
    }
    const source = new EventSource(streamUrl(selectedCampaignId));
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as StreamEnvelope;
      setLogMessages((current) => [payload, ...current].slice(0, 36));
      void refreshCampaignState(selectedCampaignId);
    };
    source.onerror = () => {
      setStatus("串流暫時中斷，仍可手動操作。");
    };
    return () => source.close();
  }, [selectedCampaignId]);

  async function handleCreateNovelCampaign() {
    if (!selectedNovel) return;
    setStatus("正在建立 NovelDB 劇本...");
    const created = await api.createCampaignFromNovel({
      novel_id: selectedNovel.novel_id,
      name: selectedNovel.novel_id,
      description: selectedNovel.readme_summary,
      premise: selectedNovel.readme_summary || `Campaign bootstrapped from ${selectedNovel.novel_id}.`,
      player_char_id: selectedPlayerCharId || null
    });
    setBundle(created);
    setStatus(`已建立劇本：${created.campaign.name}。`);
    await loadCampaigns(created.campaign.id);
  }

  async function handleRunStep() {
    if (!selectedCampaignId) return;
    setStatus("正在執行一個編排步驟...");
    const result = await api.stepCampaign(selectedCampaignId, {
      run_id: bundle?.campaign.active_run_id ?? null,
      max_actor_turns: 3
    });
    setStepResult(result);
    setStatus(`步驟已完成，目前節點為 ${translateText(result.current_node)}。`);
    await refreshCampaignState(selectedCampaignId);
  }

  async function handlePlayerAction(content = playerAction) {
    if (!selectedCampaignId) return;
    await api.postPlayerAction(selectedCampaignId, {
      actor_id: playerActor?.id ?? bundle?.campaign.player_actor_id ?? selectedCampaign?.player_actor_id ?? null,
      content,
      intent: "調查"
    });
    setStatus("玩家行動已加入佇列。");
    await refreshCampaignState(selectedCampaignId);
  }

  async function handleDirectorNote(content = directorNote) {
    if (!selectedCampaignId) return;
    await api.postDirectorAction(selectedCampaignId, {
      title: "導演提示",
      content,
      command_type: "nudge",
      payload: { share_with_gm: true }
    });
    setStatus("導演備註已加入佇列。");
    await refreshCampaignState(selectedCampaignId);
  }

  async function handleGMBrief(content = gmBrief) {
    if (!selectedCampaignId) return;
    await api.postGMBrief(selectedCampaignId, {
      title: "GM 簡報",
      body: content,
      reveal_in_context: true,
      payload: { tone: "緊張" }
    });
    setStatus("GM 簡報已儲存。");
    await refreshCampaignState(selectedCampaignId);
  }

  async function handleInjectedEvent(content = injectedEvent) {
    if (!selectedCampaignId) return;
    await api.postInjectedEvent(selectedCampaignId, {
      title: "強制事件",
      body: content,
      payload: { spotlight: "目前場景" }
    });
    setStatus("注入事件已加入佇列。");
    await refreshCampaignState(selectedCampaignId);
  }

  async function handleSubmitInput() {
    if (submittingInputMode) {
      return;
    }
    const mode = activeInputMode;
    const content = activeInputValue.trim();
    if (!selectedCampaignId) {
      setStatus("請先選擇劇本再送出。");
      return;
    }
    if (!content) {
      setStatus(`請輸入${inputModeLabels[mode]}內容。`);
      return;
    }

    setSubmittingInputMode(mode);
    try {
      if (mode === "player") await handlePlayerAction(content);
      if (mode === "gm") await handleGMBrief(content);
      if (mode === "director") await handleDirectorNote(content);
      if (mode === "inject") await handleInjectedEvent(content);
      setInputValueForMode(mode, "");
    } catch (error) {
      setStatus(`送出失敗：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSubmittingInputMode(null);
    }
  }

  async function handleExport() {
    if (!selectedCampaignId) return;
    const exported = await api.exportCampaign(selectedCampaignId, exportFormat);
    setExportedContent(exported.content);
    setStatus(`劇本已匯出為 ${exportFormat.toUpperCase()} 格式。`);
  }

  async function handleImport() {
    if (!selectedCampaignId || !importBuffer.trim()) return;
    const parsed = importBuffer.trim().startsWith("{")
      ? JSON.parse(importBuffer)
      : YAML.parse(importBuffer);
    const imported = await api.importCampaign(selectedCampaignId, {
      payload: parsed,
      preserve_ids: false
    });
    setBundle(imported);
    setStatus("劇本已匯入目前工作區。");
    await loadCampaigns(imported.campaign.id);
  }

  function getActorDraft(actor: ActorProfile) {
    return (
      actorEdits[actor.id] ?? {
        model_name: modelNameForActor(actor, actor.model_name),
        temperature: actor.temperature.toFixed(2)
      }
    );
  }

  function setActorField(
    actor: ActorProfile,
    field: "model_name" | "temperature",
    value: string
  ) {
    setActorEdits((prev) => ({
      ...prev,
      [actor.id]: { ...getActorDraft(actor), [field]: value }
    }));
  }

  function actorIsDirty(actor: ActorProfile): boolean {
    const draft = actorEdits[actor.id];
    if (!draft) return false;
    const parsedTemp = Number.parseFloat(draft.temperature);
    return (
      draft.model_name !== actor.model_name ||
      !Number.isFinite(parsedTemp) ||
      Math.abs(parsedTemp - actor.temperature) > 1e-9
    );
  }

  async function handleSaveActor(actor: ActorProfile) {
    if (!selectedCampaignId) return;
    const draft = getActorDraft(actor);
    const temp = Number.parseFloat(draft.temperature);
    if (!Number.isFinite(temp) || temp < 0 || temp > 2) {
      setStatus("溫度必須是 0.0–2.0 的數字。");
      return;
    }
    setSavingActorId(actor.id);
    try {
      await api.updateActor(selectedCampaignId, actor.id, {
        model_provider: "openrouter",
        model_name: draft.model_name.trim() || actor.model_name,
        temperature: temp
      });
      setActorEdits((prev) => {
        const next = { ...prev };
        delete next[actor.id];
        return next;
      });
      setStatus(`已更新 ${actor.name} 的模型設定。`);
      await refreshCampaignState(selectedCampaignId);
    } catch (error) {
      setStatus(`更新失敗：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSavingActorId("");
    }
  }

  function handleResetActor(actor: ActorProfile) {
    setActorEdits((prev) => {
      const next = { ...prev };
      delete next[actor.id];
      return next;
    });
  }

  const feedItems = useMemo<FeedItem[]>(() => {
    const storyItems: FeedItem[] = [];
    const backstageItems: FeedItem[] = [];

    if (stepResult) {
      const gmText = readableRecordText(stepResult.gm_output, ["public_text", "narration", "scene_title"]);
      const resolutionText = stepResult.resolution
        ? readableRecordText(stepResult.resolution, ["narration", "outcome"])
        : "";
      storyItems.push({
        id: `step-${stepResult.run_id}-${stepResult.current_node}`,
        title: translateText(stepResult.current_node),
        body: gmText || resolutionText || "編排步驟已完成。",
        meta: translateText(stepResult.status),
        tone: "step"
      });
    }
    storyItems.push(...deferredLogs.slice(0, 8).map(streamToFeedItem));
    storyItems.push(...(bundle?.timeline ?? []).map(eventToFeedItem));

    backstageItems.push(...(bundle?.director_notes ?? []).map(directorNoteToFeedItem));
    backstageItems.push(...(bundle?.gm_briefs ?? []).map(gmBriefToFeedItem));

    const pick = centerMode === "story" ? storyItems : backstageItems;
    pick.sort(
      (left, right) =>
        new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime()
    );
    return pick.slice(0, 28);
  }, [bundle?.director_notes, bundle?.gm_briefs, bundle?.timeline, centerMode, deferredLogs, stepResult]);

  const visibleInputModes = useMemo(
    () =>
      inputModes.filter((mode) =>
        (centerMode === "story" ? storyInputModeIds : backstageInputModeIds).includes(mode.id)
      ),
    [centerMode]
  );

  useEffect(() => {
    const allowed = centerMode === "story" ? storyInputModeIds : backstageInputModeIds;
    if (!allowed.includes(activeInputMode)) {
      setActiveInputMode(allowed[0]);
    }
  }, [centerMode, activeInputMode]);

  const filteredSettings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const items = [
      {
        id: "rulebook",
        title: "規則書",
        meta: String(bundle?.rulebook?.name ?? "Opera"),
        body: prettyLocalized(bundle?.rulebook ?? {})
      },
      ...(bundle?.world_entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        meta: `${entry.category} ${entry.visibility_scope}`,
        body: entry.body
      })) ?? [])
    ];
    if (!query) {
      return items;
    }
    return items.filter((item) =>
      `${item.title} ${item.meta} ${item.body}`.toLowerCase().includes(query)
    );
  }, [bundle?.rulebook, bundle?.world_entries, searchTerm]);
  const selectedSetting = filteredSettings.find((item) => item.id === selectedSettingId) ?? null;

  useEffect(() => {
    if (selectedSettingId && !selectedSetting) {
      setSelectedSettingId("");
    }
  }, [selectedSetting, selectedSettingId]);

  const scriptSections = useMemo(() => {
    const characters = asArray(directorOverlay.characters).map((item, index) => {
      const record = asRecord(item);
      return {
        id: String(record.char_id ?? `character-${index}`),
        title: String(record.title ?? record.char_id ?? "角色"),
        meta: "character",
        body: String(record.body_md ?? "")
      };
    });
    const worlds = asArray(directorOverlay.world_sections).map((item, index) => {
      const record = asRecord(item);
      return {
        id: String(record.slug ?? `world-${index}`),
        title: String(record.title ?? "世界觀"),
        meta: "world",
        body: String(record.body_md ?? "")
      };
    });
    const query = searchTerm.trim().toLowerCase();
    const items = [...characters, ...worlds];
    return query
      ? items.filter((item) => `${item.title} ${item.body}`.toLowerCase().includes(query))
      : items;
  }, [directorOverlay.characters, directorOverlay.world_sections, searchTerm]);

  const activeInputValue =
    activeInputMode === "player"
      ? playerAction
      : activeInputMode === "gm"
        ? gmBrief
        : activeInputMode === "director"
          ? directorNote
          : injectedEvent;

  const setInputValueForMode = (mode: InputMode, value: string) => {
    if (mode === "player") setPlayerAction(value);
    if (mode === "gm") setGMBrief(value);
    if (mode === "director") setDirectorNote(value);
    if (mode === "inject") setInjectedEvent(value);
  };

  const setActiveInputValue = (value: string) => {
    setInputValueForMode(activeInputMode, value);
  };

  const canSubmitInput = Boolean(
    selectedCampaignId && activeInputValue.trim() && !submittingInputMode
  );

  function handleSaveOpenRouterApiKey() {
    const trimmed = openRouterKeyDraft.trim();
    setStoredOpenRouterApiKey(trimmed);
    setOpenRouterKeyDraft(trimmed);
    setOpenRouterStatus(null);
    setStatus(trimmed ? "OpenRouter API key 已儲存在此瀏覽器。" : "OpenRouter API key 已清除。");
    void refreshOpenRouterConnection();
  }

  function handleClearOpenRouterApiKey() {
    setStoredOpenRouterApiKey("");
    setOpenRouterKeyDraft("");
    setOpenRouterStatus(null);
    setStatus("OpenRouter API key 已清除。");
    void refreshOpenRouterConnection();
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <span className="app-mark">Opera</span>
          <strong>{selectedCampaign?.name ?? "未選擇劇本"}</strong>
          <small>{status}</small>
          <div className="openrouter-row">
            <div
              className={`openrouter-indicator ${openRouterIndicatorTone(openRouterStatus)}`}
              title={openRouterStatus?.message ?? "Checking OpenRouter connection"}
            >
              <span aria-hidden="true" />
              <strong>{openRouterIndicatorLabel(openRouterStatus)}</strong>
            </div>
            <button
              type="button"
              className="openrouter-key-toggle"
              aria-expanded={openRouterKeyPanelOpen}
              aria-label="設定 OpenRouter API key"
              title="設定 OpenRouter API key"
              onClick={() => setOpenRouterKeyPanelOpen((current) => !current)}
            >
              KEY
            </button>
          </div>
          {openRouterKeyPanelOpen && (
            <form
              className="openrouter-key-panel"
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveOpenRouterApiKey();
              }}
            >
              <input
                type="password"
                value={openRouterKeyDraft}
                onChange={(event) => setOpenRouterKeyDraft(event.target.value)}
                placeholder="OpenRouter API key"
                autoComplete="off"
              />
              <button type="submit">儲存</button>
              <button type="button" onClick={handleClearOpenRouterApiKey}>
                清除
              </button>
            </form>
          )}
        </div>

        <div className="top-controls">
          <label>
            <span>世界觀</span>
            <select value={selectedNovelId} onChange={(event) => setSelectedNovelId(event.target.value)}>
              <option value="">選擇 NovelDB</option>
              {novels.map((novel) => (
                <option key={novel.novel_id} value={novel.novel_id}>
                  {novel.novel_id}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>玩家角色</span>
            <select
              value={selectedPlayerCharId}
              onChange={(event) => setSelectedPlayerCharId(event.target.value)}
              disabled={!selectedNovel?.characters.length}
            >
              <option value="">自動</option>
              {selectedNovel?.characters.map((character) => (
                <option key={character.char_id} value={character.char_id}>
                  {character.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>劇本</span>
            <select
              value={selectedCampaignId}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
            >
              <option value="">選擇 campaign</option>
              {filteredCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handleCreateNovelCampaign} disabled={!selectedNovel}>
            建立
          </button>
          <button type="button" className="primary-action" onClick={handleRunStep} disabled={!selectedCampaignId}>
            執行一步
          </button>
          {selectedNovel && (
            <div className="novel-meta">
              <strong>{selectedNovel.novel_id}</strong>
              <span>
                {selectedNovel.world_section_count} world sections / {selectedNovel.characters.length} characters
              </span>
              <p>{shortText(selectedNovel.readme_summary || "No README summary.", 180)}</p>
            </div>
          )}
        </div>
      </header>

      <main className="workbench">
        <aside className="side-panel left-panel">
          <div className="panel-tabs">
            {leftTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeLeftTab === tab.id ? "is-active" : ""}
                onClick={() => {
                  setActiveLeftTab(tab.id);
                  if (tab.id !== "settings") {
                    setSelectedSettingId("");
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            className="search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜尋"
          />

          {activeLeftTab === "settings" && (
            <div className="scroll-stack settings-stack">
              {selectedSetting ? (
                <article className="setting-detail">
                  <button
                    type="button"
                    className="back-button"
                    onClick={() => setSelectedSettingId("")}
                  >
                    {"<返回"}
                  </button>
                  <header>
                    <strong>{selectedSetting.title}</strong>
                    <span>{translateText(selectedSetting.meta)}</span>
                  </header>
                  <pre>{selectedSetting.body}</pre>
                </article>
              ) : (
                filteredSettings.map((item) => (
                  <button
                    type="button"
                    className="setting-row"
                    key={item.id}
                    onClick={() => setSelectedSettingId(item.id)}
                  >
                    {item.title}
                  </button>
                ))
              )}
            </div>
          )}

          {activeLeftTab === "memory" && (
            <div className="scroll-stack">
              {[
                ["導演 L1", layerOf(directorView, "layer1")],
                ["導演 L2", layerOf(directorView, "layer2")],
                ["導演 L3", layerOf(directorView, "layer3")],
                ["導演 L4", layerOf(directorView, "layer4")],
                ["GM L1", layerOf(gmView, "layer1")],
                ["GM L2", layerOf(gmView, "layer2")],
                ["GM L3", layerOf(gmView, "layer3")],
                ["GM L4", layerOf(gmView, "layer4")]
              ].map(([title, data]) => (
                <details className="memory-card" key={String(title)}>
                  <summary>{String(title)}</summary>
                  <pre>{prettyLocalized(data)}</pre>
                </details>
              ))}
            </div>
          )}

          {activeLeftTab === "scripts" && (
            <div className="scroll-stack">
              {scriptSections.map((item) => (
                <article className="query-card" key={item.id}>
                  <header>
                    <strong>{item.title}</strong>
                    <span>{item.meta}</span>
                  </header>
                  <p>{shortText(item.body)}</p>
                </article>
              ))}
            </div>
          )}
        </aside>

        <section className="center-panel">
          <div className="center-mode-tabs">
            {centerModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={centerMode === mode.id ? "is-active" : ""}
                onClick={() => setCenterMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className={`scene-strip ${sceneExpanded ? "is-open" : "is-collapsed"}`}>
            <div className="scene-strip-header">
              <span>{translateText(bundle?.campaign.status ?? "idle")}</span>
              <button
                type="button"
                className="scene-toggle"
                aria-expanded={sceneExpanded}
                onClick={() => setSceneExpanded((current) => !current)}
              >
                {sceneExpanded ? "收起" : "展開"}
              </button>
            </div>
            <p className="scene-text">{latestScene}</p>
          </div>

          <div className="feed-list">
            {feedItems.map((item) => (
              <article className="feed-item" key={item.id}>
                <header>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </header>
                <p>{shortText(item.body, 520)}</p>
              </article>
            ))}
          </div>

          {stepResult && (
            <details className="debug-drawer">
              <summary>節點紀錄</summary>
              <pre>{prettyLocalized(stepResult.node_log)}</pre>
              <pre>{prettyLocalized(stepResult.gm_output)}</pre>
              <pre>{prettyLocalized(stepResult.resolution ?? {})}</pre>
            </details>
          )}
        </section>

        <aside className="side-panel right-panel">
          <div className="panel-heading">
            <h2>AI 狀態</h2>
            <span>{bundle?.actors.length ?? 0}</span>
          </div>

          <div className="actor-list">
            {bundle?.actors.map((actor) => {
              const isPlayer = actor.role === "player";
              const statusRecord = actorStatus(actor, bundle);
              const isExpanded = !isPlayer && expandedActorId === actor.id;
              const view = agentViews[actor.id];
              const recentTurn = stepResult?.actor_turns.find((turn) => {
                const turnRecord = asRecord(turn);
                return turnRecord.actor_id === actor.id || turnRecord.actor_name === actor.name;
              });
              return (
                <article className={`actor-card ${isExpanded ? "is-expanded" : ""}`} key={actor.id}>
                  <button
                    type="button"
                    className={`actor-summary ${isPlayer ? "is-player" : ""}`}
                    onClick={() => {
                      if (!isPlayer) {
                        setExpandedActorId(isExpanded ? "" : actor.id);
                      }
                    }}
                  >
                    <span>
                      <strong>{actor.name}</strong>
                      {!isPlayer && <small>{translateText(actor.role)}</small>}
                    </span>
                    {!isPlayer && <span>{translateText(String(statusRecord.state ?? "idle"))}</span>}
                  </button>

                  {isExpanded && (
                    <div className="actor-detail">
                      {(() => {
                        const draft = getActorDraft(actor);
                        const dirty = actorIsDirty(actor);
                        const saving = savingActorId === actor.id;
                        const modelOptions = modelOptionsForRole(actor.role);
                        return (
                          <div className="actor-model-form">
                            <label hidden>
                              <span>供應商</span>
                              <input type="hidden" value="openrouter" readOnly />
                            </label>
                            <label>
                              <span>模型</span>
                              {modelOptions.length > 0 ? (
                                <select
                                  value={draft.model_name}
                                  onChange={(event) =>
                                    setActorField(actor, "model_name", event.target.value)
                                  }
                                >
                                  {modelOptions.map((model) => (
                                    <option key={model} value={model}>
                                      {model}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={draft.model_name}
                                  onChange={(event) =>
                                    setActorField(actor, "model_name", event.target.value)
                                  }
                                  placeholder="openrouter/auto"
                                />
                              )}
                            </label>
                            <label>
                              <span>溫度</span>
                              <input
                                type="number"
                                min={0}
                                max={2}
                                step={0.05}
                                value={draft.temperature}
                                onChange={(event) =>
                                  setActorField(actor, "temperature", event.target.value)
                                }
                              />
                            </label>
                            <div className="actor-model-actions">
                              <button
                                type="button"
                                onClick={() => handleSaveActor(actor)}
                                disabled={!dirty || saving}
                              >
                                {saving ? "儲存中…" : "儲存"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResetActor(actor)}
                                disabled={!dirty || saving}
                              >
                                還原
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                      <dl>
                        <div>
                          <dt>知識</dt>
                          <dd>{actor.knowledge_scopes_json.join(", ") || "未設定"}</dd>
                        </div>
                      </dl>
                      <p>{shortText(actor.persona, 260)}</p>
                      {actor.motives_json.length > 0 && (
                        <ul>
                          {actor.motives_json.slice(0, 3).map((motive) => (
                            <li key={motive}>{motive}</li>
                          ))}
                        </ul>
                      )}
                      {recentTurn && (
                        <pre>{prettyLocalized(recentTurn)}</pre>
                      )}
                      {view && (
                        <details>
                          <summary>收到內容</summary>
                          <pre>{prettyLocalized(view.layers)}</pre>
                        </details>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </aside>
      </main>

      <footer className="input-dock">
        <div
          className="mode-tabs"
          style={{ gridTemplateColumns: `repeat(${visibleInputModes.length}, minmax(0, 1fr))` }}
        >
          {visibleInputModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={activeInputMode === mode.id ? "is-active" : ""}
              onClick={() => setActiveInputMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <textarea
          value={activeInputValue}
          onChange={(event) => setActiveInputValue(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void handleSubmitInput();
            }
          }}
          placeholder={inputModePlaceholders[activeInputMode]}
        />
        <button type="button" className="primary-action" onClick={handleSubmitInput} disabled={!canSubmitInput}>
          {submittingInputMode ? "送出中…" : "送出"}
        </button>

        <details className="utility-drawer">
          <summary>匯入 / 匯出</summary>
          <div className="utility-grid">
            <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="markdown">Markdown</option>
            </select>
            <button type="button" onClick={handleExport} disabled={!selectedCampaignId}>
              匯出
            </button>
            <textarea
              value={exportedContent}
              onChange={(event) => setExportedContent(event.target.value)}
              placeholder="export"
            />
            <textarea
              value={importBuffer}
              onChange={(event) => setImportBuffer(event.target.value)}
              placeholder="import"
            />
            <button type="button" onClick={handleImport} disabled={!selectedCampaignId || !importBuffer.trim()}>
              匯入
            </button>
          </div>
        </details>
      </footer>
    </div>
  );
}
