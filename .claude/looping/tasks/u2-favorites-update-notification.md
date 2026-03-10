---
title: 收藏頁新章更新提示
created: 2026-03-10
priority: medium
suggested_order: U2
blockedBy: a2-history-read-chapters-bug
---

# 收藏頁新章更新提示

收藏頁僅顯示靜態的漫畫卡片，無法得知收藏的漫畫是否有新章節更新。需要：

1. 在收藏頁載入時，批次呼叫 `/api/manga/{id}` 取得各漫畫最新章節資訊
2. 比對 localStorage 中記錄的最後閱讀章節，若有更新則在卡片上顯示「NEW」badge
3. 考慮效能：加入請求節流、快取結果、避免同時發送過多請求

## User Stories

- As a reader, I want to see which favorited manga have new chapters so that I can quickly catch up on updates.

## 驗收條件

- Given a favorited manga with new chapters, when visiting favorites page, then a "NEW" badge appears on the card
- Given a favorited manga already read to latest, when visiting favorites page, then no badge appears
- Given 20 favorites, when loading the page, then requests are batched/throttled to avoid overwhelming the server
