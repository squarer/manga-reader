---
title: 閱讀器觸控手勢支援：左右滑動翻頁
created: 2026-03-10
priority: medium
suggested_order: U1
---

# 閱讀器觸控手勢支援：左右滑動翻頁

單頁閱讀模式僅支援點擊換頁和鍵盤快捷鍵，手機使用者需精確點擊左右區域翻頁，缺少直覺的 swipe 手勢。

需在 SinglePageReader 加入 touch 事件處理：touchstart 記錄起始位置，touchend 計算水平位移，超過閾值（如 50px）觸發翻頁。注意：
1. 不影響垂直滾動模式
2. 防止與瀏覽器後退手勢衝突
3. 加入 swipe 動畫反饋

## User Stories

- As a mobile reader, I want to swipe left and right to turn pages so that the reading experience feels natural on touchscreens.

## 驗收條件

- Given single page mode on mobile, when swiping left, then navigate to next page
- Given single page mode on mobile, when swiping right, then navigate to previous page
- Given scroll mode, when swiping horizontally, then no page navigation occurs
- Given a small swipe (< 50px), when touch ends, then no page navigation occurs
