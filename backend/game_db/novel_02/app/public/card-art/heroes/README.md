# 英雄美術放置資料夾

左側英雄卡牌欄位會優先讀取這個資料夾中的英雄圖。

## 預設命名

- 檔案路徑：`public/card-art/heroes/{heroId}.webp`
- 範例：`public/card-art/heroes/lulu.webp`
- 執行時 URL：`/card-art/heroes/lulu.webp`

## 目前英雄 ID

- `lulu`
- `mountain-hunter`
- `reka`
- `elno-honorary-mage`

## 建議素材規格

- 格式：WebP。
- 比例：直式角色圖，建議保留上半身與臉部。
- 構圖：臉部與主體建議放在畫面上方中間區域。
- 最小尺寸：900 x 1260 px。

如果圖片不存在或載入失敗，英雄卡會自動退回原本的 SVG 佔位圖。
