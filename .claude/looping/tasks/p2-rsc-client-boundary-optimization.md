---
title: 將 rank、update、favorites、history 頁面拆分為 Server Component + Client 互動層
created: 2026-03-10
priority: high
suggested_order: P2
blockedBy: p1-loading-error-boundaries
---

# 將 rank、update、favorites、history 頁面拆分為 Server + Client

rank、update、favorites、history 全部 'use client'，靜態 UI 骨架完全可以是 Server Component。應將 page.tsx 改為 Server Component，抽出互動區域為獨立 Client Component（RankContent、UpdateContent 等），減少客戶端 JS bundle。

## User Stories

- As a user, I want pages to load faster with less JavaScript, so that the app performs well even on slow devices or networks.

## 驗收條件

- Given rank/page.tsx, when inspected, then it is a Server Component without 'use client'
- Given the rank page, when loaded, then only interactive parts are Client Components
- Given JS bundle analysis, when compared, then client JS size decreases
