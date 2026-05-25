# Novel 05 — 原神（Genshin Impact）世界觀資料庫

- `Novel ID`: `novel_05_genshin`
- `Status`: 世界觀設定庫（非原創小說，為官方 IP 參考資料）
- `版本基準`: Genshin Impact v6.x（截至 2026-05，含 Nod-Krai Luna I～V 內容）
- `Project Folder`: `novel_05_genshin`

## 定位

`novel_05_genshin` 是以米哈遊《原神》官方世界觀、劇情、角色、地理資訊為素材，
依照 `novel_00` 模板格式整理而成的**設定參考資料庫**。
其目的是作為以提瓦特大陸為背景進行 AI 協作小說創作的 canon 基礎，
確保角色口吻、世界規則、地理設定、專有名詞在正文中保持一致。

本資料庫以旅行者（瑩）的視角為主軸，以官方已揭露的主線劇情（魔神任務序章至第六章）
及衍生世界觀為基礎。

## 目錄結構

- `bible/worldbuilding.md`：提瓦特世界基礎規則——七元素體系、神之眼、神之心、天理、深淵、降臨者制度、坎瑞亞歷史、原能系統。
- `bible/characters.yaml`：30-40 位主要角色設定（七魔神、執行官、旅行者群、各國要角）。
- `bible/location.yaml`：30-40 處重要地理位置，含各國核心地標與特殊區域。
- `bible/plot-threads.yaml`：8-10 條主線與重要伏筆線（旅行者尋親、深淵陰謀、天理之謎、神之心爭奪等）。
- `bible/relationships.yaml`：各陣營、角色間的關鍵關係動態。
- `bible/timeline.yaml`：從提瓦特太初到 v6.x 最新事件的時間線。
- `outline/master-outline.yaml`：以魔神任務章節為單位的主線大綱（序章至第六章）。
- `outline/act1.md`：序章「捕風的異鄉人」與第一章「蒙德」詳細分節。
- `chapters/ch001.md`：正文首章（留白，待創作使用）。
- `context/CONTEXT.md`：旅行者當前行動狀態摘要（v6.x 進度基準）。
- `context/secrets-lockbox.md`：尚未在正文中正式揭露的隱藏真相、伏筆與作者規劃（含玩家高可信推測，標「暫定」）。
- `scripts/`：一致性檢查與 bible 更新流程備忘。
- `temp/`：臨時參考資料，不自動列為 canon。

## 重要使用守則

1. `bible/` 內所有資料均對應官方已公開的正式劇情，可直接在正文中引用。
2. `context/secrets-lockbox.md` 的內容不得在正文中「提前說破」——此為作者層級資訊。
3. 角色口吻以 `bible/characters.yaml` 的 `speech_style` 為準；魔神有神格特質，執行官各有政治目的。
4. 地名、術語請對照 `bible/location.yaml` 及 `bible/worldbuilding.md` 的官方繁中譯名。
5. 版本基準為 v6.x（2026-05）；後續新版本推出時，請手動更新相關 canon 檔案。

## 建議閱讀順序

1. `bible/worldbuilding.md` → 了解提瓦特基礎規則
2. `bible/timeline.yaml` → 掌握歷史脈絡
3. `outline/master-outline.yaml` → 理解主線章節結構
4. `bible/characters.yaml` → 掌握主要角色
5. `context/secrets-lockbox.md` → 了解隱藏伏筆（作者視角）
