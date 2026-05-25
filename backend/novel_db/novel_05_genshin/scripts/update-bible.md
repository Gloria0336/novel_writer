# Bible 更新流程（Update Bible）Prompt

當章節正文完成後，請依以下流程更新 canon 資料：

## 每章完成後必做

1. **更新 `context/last-chapter-summary.md`**
   - 本章的關鍵事件（1-3 條）
   - 旅行者目前位置與狀態
   - 尚未解決的伏筆或下一章鉤子

2. **視需要更新 `bible/characters.yaml`**
   - 角色 `current_status` 若有改變（地點、心理狀態、新揭露的秘密）
   - `progressions` 若本章是角色成長的關鍵節點

3. **視需要更新 `bible/location.yaml`**
   - 若本章出現新地點，補充地點條目
   - 若地點有物理改變（被毀壞、改建等），更新 `continuity_notes`

4. **視需要更新 `bible/plot-threads.yaml`**
   - 若某條劇情線在本章有推進或部分解決，更新 `status`
   - 若本章引入新伏筆，新增條目

5. **視需要更新 `bible/timeline.yaml`**
   - 若本章發生重大事件，補充對應時間節點
   - 注意 `location_id` 與 `bible/location.yaml` 保持一致

## 版本更新時（官方出新章節）

- 每次官方版本更新後，同步以下：
  - `bible/worldbuilding.md`：新揭露的世界觀資訊
  - `bible/characters.yaml`：角色的最新狀態
  - `bible/timeline.yaml`：新章節事件
  - `outline/master-outline.yaml`：新章節 beat 與 outcome
  - `context/CONTEXT.md`：更新當前進度
- 若官方揭露了 `secrets-lockbox.md` 中的某條秘密，**將其從秘密鎖箱移至對應的公開 canon 檔案**。

## 注意事項

- 絕對不要在公開 canon 檔案中提前記錄 `secrets-lockbox.md` 的內容。
- 版本基準：目前為 v6.x（2026-05）。未來版本更新時請同步更新 README.md 的「版本基準」欄位。
