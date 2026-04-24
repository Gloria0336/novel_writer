export interface OperaMemoryLayers {
  /** L1：世界知識（公開事實）—— 傳送給所有角色 */
  worldKnowledge: string;
  /** L2：故事狀態（當前事件）—— 依角色視角填入，各角色只知道自己應知道的 */
  storyState: string;
  /** L3：角色記憶（個人經歷）—— 僅此角色可見 */
  characterMemory: string;
  /** L4：隱藏意圖（秘密動機）—— 僅導演可見，絕不傳送給任何 AI 角色 */
  hiddenIntent: string;
}

export interface OperaCharacter {
  id: string;
  name: string;
  /** OpenRouter 模型 ID */
  model: string;
  temperature: number;
  maxCompletionTokens: number;
  /** 職位標籤（如：主角、反派、謎樣角色） */
  role: string;
  /** 個性描述，注入到每次系統提示詞 */
  personality: string;
  /** 說話方式，注入到每次系統提示詞 */
  speechStyle: string;
  memoryLayers: OperaMemoryLayers;
  /** 是否在目前場景中啟用 */
  isActive: boolean;
  /** 從小說資料庫匯入時的來源路徑 */
  importedFrom?: string;
  /** 頭像縮寫，未設定時從 name 自動推導 */
  avatarInitials?: string;
}

export type OperaMessageType =
  | "dialogue"    // 角色對話
  | "action"      // 動作描述
  | "narration"   // GM 或世界旁白
  | "director"    // 導演注入（所有人可見）
  | "gm-note";    // GM 私下評估（僅導演可見）

export interface OperaMessage {
  id: string;
  sceneId: string;
  /** 說話者 ID：characterId | "director" | "gm" */
  speakerId: string;
  speakerName: string;
  type: OperaMessageType;
  content: string;
  createdAt: number;
  /** 樂觀 UI 的待傳送狀態 */
  isStreaming?: boolean;
}

export interface OperaScene {
  id: string;
  title: string;
  /** 導演的場景設定說明 */
  description: string;
  /** 目前場景中在場的角色 ID 列表 */
  activeCharacterIds: string[];
  createdAt: number;
}

export interface OperaGmConfig {
  model: string;
  temperature: number;
  maxCompletionTokens: number;
  /** 額外的 GM 個性設定說明 */
  systemPromptExtra: string;
  /** 每幾則訊息自動執行 GM 評估；0 = 僅手動觸發 */
  autoEvalFrequency: number;
  isEnabled: boolean;
}

export interface OperaCampaign {
  id: string;
  name: string;
  /** L1：本劇本的共用世界知識 */
  worldKnowledge: string;
  /** L2：目前的公開故事狀態摘要 */
  storyState: string;
  gmConfig: OperaGmConfig;
  /** 本劇本的角色 ID 清單（有序） */
  characterIds: string[];
  sceneIds: string[];
  activeSceneId: string;
  /** 若從小說匯入，記錄來源 novel ID（如 "novel_01"） */
  importedNovelId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface OperaState {
  campaigns: OperaCampaign[];
  activeCampaignId: string;
  /** 所有角色，以 characterId 為鍵值 */
  characters: Record<string, OperaCharacter>;
  /** 所有場景，以 sceneId 為鍵值 */
  scenes: Record<string, OperaScene>;
  /** 各場景的訊息列表，以 sceneId 為鍵值 */
  messages: Record<string, OperaMessage[]>;
}
