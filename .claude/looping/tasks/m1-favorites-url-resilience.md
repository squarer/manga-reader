---
title: 收藏資料儲存改為 ID 為主：移除原始域名依賴
created: 2026-03-10
priority: medium
suggested_order: M1
---

# 收藏資料儲存改為 ID 為主：移除原始域名依賴

useFavorites 的 FavoriteItem 存 `mangaCover: string`（完整 URL），包含原始域名（如 `cf.mhgui.com`）。域名改版時所有 localStorage 中的封面 URL 全部失效。

修正：
1. mangaCover 改存漫畫 ID，渲染時動態組合 URL
2. 或改存相對路徑 `/cpic/b/{id}.jpg`，渲染時透過 getProxiedImageUrl 代理
3. 加入 localStorage 資料遷移邏輯，將舊格式轉為新格式

此任務與 B2（Reader hardcode 修正）相關可同步進行。

## User Stories

- As a reader, I want my favorites to survive domain changes so that I do not lose my collection when the upstream site changes its CDN.

## 驗收條件

- Given a new favorite is added, when stored in localStorage, then mangaCover is a relative path not a full URL
- Given old localStorage data with full URL covers, when the app loads, then data is migrated to relative paths
- Given a favorite card, when rendered, then cover image loads through the proxy API
