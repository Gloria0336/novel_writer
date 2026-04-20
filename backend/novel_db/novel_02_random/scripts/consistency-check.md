# 一致性檢查 (Consistency Check) Prompt

請根據目前的章節草稿 `chXXX.md`，比對本專案 `bible/` 與 `outline/` 中的設定，確認以下重點：

1. **邏輯衝突**: 是否有前文已設下的限制、規則或因果被違反？
2. **角色口吻**: 角色說話方式是否與 `bible/characters.yaml` 的 `speech_style` 一致？
3. **專有名詞與地理資訊**: 地名、術語、物品名稱、稱呼是否前後統一，並與 `bible/location.yaml` 對齊？
4. **時間線**: `bible/timeline.yaml` 是否需要新增或修正本章事件與 `location_id`？
5. **秘密外洩**: 本章是否提前說破 `context/secrets-lockbox.md` 中尚未正式揭露的資訊？
6. **大綱對齊**: 本章是否讓 `outline/master-outline.yaml` 的當前落點過時？

請列出所有潛在不一致之處，並附上具體修改建議。
