---
title: Reader 封面 URL hardcode 修正：統一走圖片代理
created: 2026-03-10
priority: high
suggested_order: B2
---

# Reader 封面 URL hardcode 修正：統一走圖片代理

Reader.tsx 第 359 行 addHistory 時 mangaCover 寫死 `https://cf.mhgui.com/cpic/b/${json.data.bid}.jpg`，繞過圖片代理直接存原始域名。問題：1) 瀏覽器直連原始域名會被防盜鏈擋住；2) 域名變更時所有 localStorage 中的舊 URL 全部失效。

修正：mangaCover 改存相對路徑（如 `/cpic/b/{bid}.jpg`），渲染時統一透過 getProxiedImageUrl 轉換。需同時處理 localStorage 中舊格式的向後相容。

## User Stories

- As a reader, I want manga cover images in history and favorites to always load correctly so that they are not blocked by anti-hotlink protection.

## 驗收條件

- Given addHistory is called, when saving mangaCover, then it stores a relative path not a full URL
- Given old localStorage data with full URL covers, when the app loads, then covers still display correctly
- Given a cover image in history page, when rendered, then it goes through the image proxy API
