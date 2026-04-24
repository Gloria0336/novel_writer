import type { OpenRouterClient } from "./openRouterClient";
import type {
  OperaCampaign,
  OperaCharacter,
  OperaGmConfig,
  OperaMessage,
  OperaMessageType,
  OperaScene,
} from "../types/opera";

// ─── 角色系統提示詞建構 ───────────────────────────────────────────────────

function buildCharacterSystemPrompt(
  character: OperaCharacter,
  campaignWorldKnowledge: string,
  campaignStoryState: string,
  sceneDescription: string,
  sceneActiveCharacters: OperaCharacter[],
): string {
  const otherChars = sceneActiveCharacters
    .filter((c) => c.id !== character.id)
    .map((c) => `${c.name}（${c.role}）`)
    .join("、");

  const sections: string[] = [];

  sections.push(
    `你是 ${character.name}。${character.role ? `你的身分：${character.role}。` : ""}` +
    `\n個性：${character.personality || "未設定"}` +
    `\n說話方式：${character.speechStyle || "未設定"}`,
  );

  // L1：世界知識（公開，所有角色可見）
  const worldKnowledge = [campaignWorldKnowledge, character.memoryLayers.worldKnowledge]
    .filter(Boolean)
    .join("\n\n");
  if (worldKnowledge) {
    sections.push(`【世界知識 — 你所知的公開事實】\n${worldKnowledge}`);
  }

  // L2：故事狀態（目前事件，各角色視角不同）
  const storyState = [campaignStoryState, character.memoryLayers.storyState]
    .filter(Boolean)
    .join("\n\n");
  if (storyState) {
    sections.push(`【故事狀態 — 你所知的目前情況】\n${storyState}`);
  }

  // L3：角色個人記憶（僅此角色可見）
  if (character.memoryLayers.characterMemory) {
    sections.push(`【你的個人記憶與背景】\n${character.memoryLayers.characterMemory}`);
  }

  // 場景說明
  if (sceneDescription) {
    sections.push(`【目前場景設定】\n${sceneDescription}`);
  }

  // 在場角色
  if (otherChars) {
    sections.push(`【目前在場的其他角色】${otherChars}`);
  }

  // 輸出格式
  sections.push(
    `【回應規則】\n` +
    `1. 你只能扮演 ${character.name}，不得跳出角色。\n` +
    `2. 回應必須是嚴格的 JSON 格式：{"type":"dialogue","content":"..."} 或 {"type":"action","content":"..."}\n` +
    `   - "dialogue"：角色說的話（直接引言，不含說話者姓名）\n` +
    `   - "action"：角色的動作或反應（第三人稱旁白式描述）\n` +
    `3. 絕不暴露你的隱藏動機。\n` +
    `4. content 欄位只含對話或動作內容，不含角色姓名前綴。`,
  );

  // L4 隱藏意圖絕不包含在此提示詞中。

  return sections.join("\n\n");
}

// ─── 訊息歷程格式化 ───────────────────────────────────────────────────────

function buildCharacterMessageHistory(
  messages: OperaMessage[],
  characterId: string,
  maxMessages = 20,
): Array<{ role: "user" | "assistant" | "system"; content: string }> {
  const recent = messages
    .filter((m) => m.type !== "gm-note")
    .slice(-maxMessages);

  return recent.map((m) => {
    const isOwn = m.speakerId === characterId;
    const prefix =
      m.type === "director"
        ? `[導演指令]：`
        : m.type === "narration"
        ? `[旁白]：`
        : `${m.speakerName}：`;

    return {
      role: isOwn ? ("assistant" as const) : ("user" as const),
      content: `${isOwn ? "" : prefix}${m.content}`,
    };
  });
}

// ─── GM 系統提示詞（可見全部 4 層，含 L4）────────────────────────────────

function buildGmSystemPrompt(
  gmConfig: OperaGmConfig,
  campaign: OperaCampaign,
  scene: OperaScene,
  characters: OperaCharacter[],
): string {
  const sections: string[] = [];

  sections.push(
    `你是這個互動敘事的故事管理引擎（GM）。\n` +
    `你的任務是監控角色行為是否符合各自設定，並防止故事偏離導演的規劃。\n` +
    `你擁有所有角色的完整資訊，包含隱藏意圖（L4）。`,
  );

  if (campaign.worldKnowledge) {
    sections.push(`【世界知識】\n${campaign.worldKnowledge}`);
  }

  if (campaign.storyState) {
    sections.push(`【故事狀態】\n${campaign.storyState}`);
  }

  if (scene.description) {
    sections.push(`【導演的場景設定】\n${scene.description}`);
  }

  // 所有角色的完整資料，含 L4 隱藏意圖
  const charSummaries = characters
    .map((c) => {
      const lines = [
        `角色：${c.name}（${c.role}）`,
        `個性：${c.personality}`,
        c.memoryLayers.characterMemory
          ? `個人背景：${c.memoryLayers.characterMemory}`
          : "",
        c.memoryLayers.hiddenIntent
          ? `【隱藏意圖 L4】：${c.memoryLayers.hiddenIntent}`
          : "",
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n---\n\n");

  if (charSummaries) {
    sections.push(`【角色完整資料（含隱藏意圖）】\n${charSummaries}`);
  }

  if (gmConfig.systemPromptExtra) {
    sections.push(`【導演額外指示】\n${gmConfig.systemPromptExtra}`);
  }

  sections.push(
    `【評估任務】\n` +
    `檢視近期的場景訊息，判斷：\n` +
    `1. 角色行為是否符合其個性與隱藏意圖？\n` +
    `2. 故事走向是否符合導演設定？\n` +
    `3. 是否有任何角色行為矛盾或偏離設定？\n\n` +
    `以繁體中文回應，格式為 JSON：\n` +
    `{"assessment":"整體評估摘要","deviations":[{"character":"角色名","issue":"偏差說明"}]}\n` +
    `若無偏差，deviations 為空陣列。`,
  );

  return sections.join("\n\n");
}

// ─── 回應解析 ──────────────────────────────────────────────────────────────

interface CharacterTurnResult {
  content: string;
  type: OperaMessageType;
}

function parseCharacterResponse(raw: string): CharacterTurnResult {
  const trimmed = raw.trim();
  try {
    // 嘗試從文字中提取 JSON（有些模型會在 JSON 前後加說明文字）
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { type?: string; content?: string };
      const type: OperaMessageType =
        parsed.type === "action" ? "action" : "dialogue";
      const content = typeof parsed.content === "string" ? parsed.content.trim() : trimmed;
      return { content, type };
    }
  } catch {
    // 解析失敗，退回純文字
  }
  return { content: trimmed, type: "dialogue" };
}

interface GmEvalResult {
  assessment: string;
  deviations: Array<{ character: string; issue: string }>;
}

function parseGmResponse(raw: string): GmEvalResult {
  const trimmed = raw.trim();
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<GmEvalResult>;
      return {
        assessment: typeof parsed.assessment === "string" ? parsed.assessment : trimmed,
        deviations: Array.isArray(parsed.deviations) ? parsed.deviations : [],
      };
    }
  } catch {
    // 解析失敗
  }
  return { assessment: trimmed, deviations: [] };
}

// ─── 主要 Service 類別 ────────────────────────────────────────────────────

export class OperaAgentService {
  constructor(private readonly client: OpenRouterClient) {}

  /** 執行單一角色的回合，回傳訊息內容與類型 */
  async runCharacterTurn(params: {
    character: OperaCharacter;
    campaign: OperaCampaign;
    scene: OperaScene;
    allCharacters: Record<string, OperaCharacter>;
    recentMessages: OperaMessage[];
    directorInjection?: string;
  }): Promise<CharacterTurnResult> {
    const { character, campaign, scene, allCharacters, recentMessages, directorInjection } =
      params;

    const sceneActiveChars = scene.activeCharacterIds
      .map((id) => allCharacters[id])
      .filter((c): c is OperaCharacter => Boolean(c));

    const systemPrompt = buildCharacterSystemPrompt(
      character,
      campaign.worldKnowledge,
      campaign.storyState,
      scene.description,
      sceneActiveChars,
    );

    const history = buildCharacterMessageHistory(recentMessages, character.id);

    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...history,
    ];

    if (directorInjection) {
      messages.push({ role: "user", content: `[導演指令]：${directorInjection}` });
    }

    messages.push({
      role: "user",
      content: `現在輪到你（${character.name}）說話或行動，請以 JSON 格式回應。`,
    });

    const raw = await this.client.sendChat({
      model: character.model,
      messages,
      temperature: character.temperature,
      maxCompletionTokens: character.maxCompletionTokens,
    });

    return parseCharacterResponse(raw);
  }

  /** 執行 GM 評估，回傳評估摘要文字（用於 gm-note 訊息） */
  async runGmEvaluation(params: {
    campaign: OperaCampaign;
    scene: OperaScene;
    characters: Record<string, OperaCharacter>;
    messages: OperaMessage[];
  }): Promise<string> {
    const { campaign, scene, characters, messages } = params;

    const sceneChars = scene.activeCharacterIds
      .map((id) => characters[id])
      .filter((c): c is OperaCharacter => Boolean(c));

    const systemPrompt = buildGmSystemPrompt(
      campaign.gmConfig,
      campaign,
      scene,
      sceneChars,
    );

    // 取最近 10 則訊息（不含 gm-note）作為評估材料
    const recentPublic = messages
      .filter((m) => m.type !== "gm-note")
      .slice(-10)
      .map((m) => `[${m.speakerName}/${m.type}] ${m.content}`)
      .join("\n");

    const userContent = recentPublic
      ? `請評估以下近期場景訊息：\n\n${recentPublic}`
      : "場景尚無訊息，請確認場景設定是否符合導演規劃，輸出初始評估。";

    const raw = await this.client.sendChat({
      model: campaign.gmConfig.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: campaign.gmConfig.temperature,
      maxCompletionTokens: campaign.gmConfig.maxCompletionTokens,
    });

    const result = parseGmResponse(raw);
    const parts: string[] = [];

    if (result.assessment) parts.push(result.assessment);

    if (result.deviations.length > 0) {
      const devText = result.deviations
        .map((d) => `⚠ ${d.character}：${d.issue}`)
        .join("\n");
      parts.push(`\n【偏差警告】\n${devText}`);
    } else {
      parts.push("\n✓ 所有角色行為符合設定，故事走向正常。");
    }

    return parts.join("\n");
  }
}
