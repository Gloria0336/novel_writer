import type { BridgeClient } from "../services/bridgeClient";
import type { RepoConfig, RepoTreeEntry } from "../types/app";
import type { OperaCharacter, OperaMemoryLayers } from "../types/opera";

// ─── YAML 解析（輕量級，專為 characters.yaml 格式設計）─────────────────────

interface RawYamlCharacter {
  id: string;
  name: string;
  role?: string;
  personality?: string[];
  speechStyle?: Record<string, string>;
  goals?: string[];
  knownSecrets?: string[];
  currentStatus?: string;
  abilities?: string[];
}

/** 從 YAML 區塊中擷取單一字串欄位（含 block scalar `>` 和 `|`） */
function extractScalar(block: string, key: string): string {
  // 嘗試匹配單行值：  key: value
  const inlineMatch = block.match(new RegExp(`^    ${key}:\\s+(.+)$`, "m"));
  if (inlineMatch) return inlineMatch[1].trim();

  // 嘗試匹配 block scalar（> 或 |）後的縮排多行
  const blockMatch = block.match(new RegExp(`^    ${key}:\\s*[>|]\\s*\\n((?:^      .+\\n?)*)`, "m"));
  if (blockMatch) {
    return blockMatch[1]
      .split("\n")
      .map((l) => l.replace(/^      /, "").trim())
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  return "";
}

/** 從 YAML 區塊中擷取字串陣列欄位 */
function extractList(block: string, key: string): string[] {
  const sectionMatch = block.match(
    new RegExp(`^    ${key}:\\s*\\n((?:^      - .+\\n?)*)`, "m"),
  );
  if (!sectionMatch) return [];

  return sectionMatch[1]
    .split("\n")
    .map((l) => l.replace(/^      - /, "").trim())
    .filter(Boolean);
}

/** 從 YAML 區塊中擷取巢狀 key-value 物件欄位 */
function extractObject(block: string, key: string): Record<string, string> {
  const sectionMatch = block.match(
    new RegExp(`^    ${key}:\\s*\\n((?:^      \\S.+\\n?)*)`, "m"),
  );
  if (!sectionMatch) return {};

  const result: Record<string, string> = {};
  for (const line of sectionMatch[1].split("\n")) {
    const m = line.match(/^\s+(\S[^:]+):\s*(.*)$/);
    if (m) result[m[1].trim()] = m[2].trim();
  }
  return result;
}

/** 解析整個 characters.yaml 文字，回傳原始角色清單 */
function parseCharactersYaml(text: string): RawYamlCharacter[] {
  // 以 `  - id:` 分割成各角色區塊
  const blocks = text.split(/\n(?=  - id:)/);
  const results: RawYamlCharacter[] = [];

  for (const block of blocks) {
    const idMatch = block.match(/^  - id:\s*(.+)$/m);
    if (!idMatch) continue;

    const id = idMatch[1].trim();
    const name = extractScalar(block, "name");
    if (!name) continue;

    const personality = extractList(block, "personality");
    const goals = extractList(block, "goals");
    const knownSecrets = extractList(block, "known_secrets");
    const abilities = extractList(block, "abilities");
    const speechStyleRaw = extractObject(block, "speech_style");
    const role = extractScalar(block, "role");
    const currentStatus = extractScalar(block, "current_status");

    results.push({
      id,
      name,
      role,
      personality,
      speechStyle: speechStyleRaw,
      goals,
      knownSecrets,
      currentStatus,
      abilities,
    });
  }

  return results;
}

/** 從 secrets-lockbox.md 提取各角色（以名字對應）的「未揭露層」秘密 */
function parseSecretsForCharacters(
  lockboxText: string,
  characterNames: string[],
): Record<string, string> {
  const result: Record<string, string> = {};

  // 提取全域「隱藏真相」和「尚未揭露的人物秘密」區段
  const globalHiddenMatch = lockboxText.match(
    /^## 隱藏真相\n([\s\S]*?)(?=\n##|\n---|\Z)/m,
  );
  const globalSecrets = globalHiddenMatch
    ? globalHiddenMatch[1]
        .split("\n")
        .map((l) => l.replace(/^-\s*/, "").trim())
        .filter(Boolean)
        .join("\n")
    : "";

  const globalPersonMatch = lockboxText.match(
    /^## 尚未揭露的人物秘密\n([\s\S]*?)(?=\n##|\n---|\Z)/m,
  );
  const globalPersonSecrets = globalPersonMatch ? globalPersonMatch[1].trim() : "";

  // 為每個角色提取「未揭露層」區段
  for (const charName of characterNames) {
    const parts: string[] = [];

    // 嘗試匹配 ### CharacterName ... #### 未揭露層 ... 下一個 ###
    const charSectionMatch = lockboxText.match(
      new RegExp(
        `### ${charName}[\\s\\S]*?#### 未揭露層\\n([\\s\\S]*?)(?=\\n###|\\n---|\$)`,
        "m",
      ),
    );
    if (charSectionMatch) {
      parts.push(charSectionMatch[1].trim());
    }

    // 附加與此角色相關的全域秘密
    if (globalSecrets) parts.push(globalSecrets);
    if (globalPersonSecrets) parts.push(globalPersonSecrets);

    if (parts.length > 0) {
      result[charName] = parts.join("\n\n");
    }
  }

  return result;
}

// ─── 映射：RawYamlCharacter → OperaCharacter ───────────────────────────────

function deriveAvatarInitials(name: string): string {
  // 取前兩個字（中文）或兩個大寫字母（英文）
  const cjk = name.match(/[一-鿿㐀-䶿]/g);
  if (cjk && cjk.length > 0) {
    return cjk.slice(0, 2).join("");
  }
  const words = name.trim().split(/\s+/);
  return words
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function mapRawToOperaCharacter(
  raw: RawYamlCharacter,
  defaultModel: string,
  hiddenIntentText: string,
): OperaCharacter {
  const personality = Array.isArray(raw.personality) ? raw.personality.join("、") : "";

  const speechParts: string[] = [];
  if (raw.speechStyle) {
    for (const [k, v] of Object.entries(raw.speechStyle)) {
      if (v) speechParts.push(`${k}：${v}`);
    }
  }
  const speechStyle = speechParts.join("；");

  // L3：個人記憶 = 目標 + 已知秘密 + 現況
  const memoryParts: string[] = [];
  if (raw.goals?.length) {
    memoryParts.push(`【目標】\n${raw.goals.map((g) => `- ${g}`).join("\n")}`);
  }
  if (raw.knownSecrets?.length) {
    memoryParts.push(`【已知秘密】\n${raw.knownSecrets.map((s) => `- ${s}`).join("\n")}`);
  }
  if (raw.currentStatus) {
    memoryParts.push(`【目前狀況】\n${raw.currentStatus}`);
  }
  if (raw.abilities?.length) {
    memoryParts.push(`【能力】\n${raw.abilities.map((a) => `- ${a}`).join("\n")}`);
  }
  const characterMemory = memoryParts.join("\n\n");

  const memoryLayers: OperaMemoryLayers = {
    worldKnowledge: "",
    storyState: "",
    characterMemory,
    hiddenIntent: hiddenIntentText,
  };

  return {
    id: raw.id,
    name: raw.name,
    model: defaultModel,
    temperature: 0.85,
    maxCompletionTokens: 600,
    role: raw.role ?? "",
    personality,
    speechStyle,
    memoryLayers,
    isActive: true,
    importedFrom: `characters.yaml#${raw.id}`,
    avatarInitials: deriveAvatarInitials(raw.name),
  };
}

// ─── 路徑工具 ──────────────────────────────────────────────────────────────

function findPath(entries: RepoTreeEntry[], suffix: string): string | undefined {
  return entries.find(
    (e) => e.type === "blob" && e.path.endsWith(suffix),
  )?.path;
}

export function findNovelIds(entries: RepoTreeEntry[]): string[] {
  const ids = new Set<string>();
  for (const entry of entries) {
    // 比對路徑 backend/novel_db/novel_XX/...
    const m = entry.path.match(/backend\/novel_db\/(novel_[A-Za-z0-9_]+)\//);
    if (m) ids.add(m[1]);
  }
  return [...ids].sort();
}

// ─── 主要匯入函式 ──────────────────────────────────────────────────────────

export interface NovelImportResult {
  characters: OperaCharacter[];
  /** 建議的 L1 世界知識（來自 CONTEXT.md） */
  suggestedWorldKnowledge: string;
  /** 建議的 L2 故事狀態（來自 CONTEXT.md Key Events Log） */
  suggestedStoryState: string;
}

export async function importNovelCharacters(params: {
  novelId: string;
  entries: RepoTreeEntry[];
  bridgeClient: BridgeClient;
  repoConfig: RepoConfig;
  defaultModel: string;
}): Promise<NovelImportResult> {
  const { novelId, entries, bridgeClient, repoConfig, defaultModel } = params;

  const prefix = `backend/novel_db/${novelId}`;

  const charPath = findPath(entries, `${prefix}/bible/characters.yaml`);
  if (!charPath) {
    throw new Error(`找不到 ${prefix}/bible/characters.yaml`);
  }

  // 取得 SHA
  const charEntry = entries.find((e) => e.path === charPath);
  if (!charEntry) throw new Error("找不到角色檔案的 SHA");

  const [charFile, contextFile, secretsFile] = await Promise.allSettled([
    bridgeClient.getFileContent(repoConfig, charPath, charEntry.sha),
    (async () => {
      const p = findPath(entries, `${prefix}/context/CONTEXT.md`);
      if (!p) return null;
      const e = entries.find((x) => x.path === p);
      if (!e) return null;
      return bridgeClient.getFileContent(repoConfig, p, e.sha);
    })(),
    (async () => {
      const p = findPath(entries, `${prefix}/context/secrets-lockbox.md`);
      if (!p) return null;
      const e = entries.find((x) => x.path === p);
      if (!e) return null;
      return bridgeClient.getFileContent(repoConfig, p, e.sha);
    })(),
  ]);

  if (charFile.status === "rejected") {
    throw new Error(`載入角色檔案失敗：${String(charFile.reason)}`);
  }

  const rawChars = parseCharactersYaml(charFile.value.content);
  const charNames = rawChars.map((c) => c.name);

  // 解析秘密鎖箱
  const secretsText =
    secretsFile.status === "fulfilled" && secretsFile.value
      ? secretsFile.value.content
      : "";
  const hiddenIntents = parseSecretsForCharacters(secretsText, charNames);

  // 組裝角色
  const characters = rawChars.map((raw) =>
    mapRawToOperaCharacter(raw, defaultModel, hiddenIntents[raw.name] ?? ""),
  );

  // 從 CONTEXT.md 提取世界知識與故事狀態
  let suggestedWorldKnowledge = "";
  let suggestedStoryState = "";

  if (contextFile.status === "fulfilled" && contextFile.value) {
    const ctxText = contextFile.value.content;

    // L1 世界知識：取 Current Status 區段
    const statusMatch = ctxText.match(/^## Current Status\n([\s\S]*?)(?=\n##|\Z)/m);
    if (statusMatch) suggestedWorldKnowledge = statusMatch[1].trim();

    // L2 故事狀態：取 Key Events Log 區段
    const eventsMatch = ctxText.match(/^## Key Events Log\n([\s\S]*?)(?=\n##|\Z)/m);
    if (eventsMatch) suggestedStoryState = eventsMatch[1].trim();
  }

  return { characters, suggestedWorldKnowledge, suggestedStoryState };
}
