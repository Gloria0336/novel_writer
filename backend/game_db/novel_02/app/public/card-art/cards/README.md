# 卡牌美術放置資料夾

正式卡牌美術完成後，請放在這個資料夾。

## 預設命名

- 檔案路徑：`public/card-art/cards/{cardId}.webp`
- 範例：`public/card-art/cards/T01.webp`
- 執行時 URL：`/card-art/cards/T01.webp`

## 建議素材規格

- 格式：正式版建議使用 WebP；若要使用 PNG 或 JPG，可透過美術 manifest 指定。
- 比例：直式插畫，構圖需能裁切進卡牌圖框。
- 安全區：臉部與重要輪廓建議放在畫面偏上方的中間區域。
- 最小尺寸：900 x 1260 px。

## Manifest 覆寫

當某張卡需要不同檔案、裁切焦點、作者、版權標記或色調時，請在 `src/game/cardArt.ts` 裡設定。

```ts
T01: {
  src: "/card-art/cards/T01-final.png",
  objectPosition: "50% 32%",
  artist: "美術作者",
  credit: "正式卡圖",
  tone: "warm",
}
```

如果圖片不存在或載入失敗，`CardFace` 會自動退回 CSS 佔位圖，畫面仍可正常使用。
