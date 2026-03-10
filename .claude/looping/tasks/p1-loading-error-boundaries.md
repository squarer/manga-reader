---
title: 為所有 App Router 路由加入 loading.tsx 和 error.tsx 邊界
created: 2026-03-10
priority: high
suggested_order: P1
---

# 為所有 App Router 路由加入 loading.tsx 和 error.tsx 邊界

所有頁面完全沒有 loading.tsx 或 error.tsx，用元件內條件渲染處理 loading/error，錯過 App Router 的 Suspense streaming 和自動 error recovery。

應為每個路由段新增：
- `loading.tsx`：Skeleton UI，讓首屏 HTML 能立即 stream 靜態骨架
- `error.tsx`：含 reset 按鈕的 error boundary，API 失敗時自動 catch 而不是整頁白屏

## User Stories

- As a user, I want to see an instant loading skeleton when navigating between pages, and a clear error recovery UI when something fails, so that the app feels responsive and I can retry without manually refreshing.

## 驗收條件

- Given navigation to manga detail page, when data is loading, then a skeleton UI is shown immediately via streaming
- Given an API failure on rank page, when error occurs, then error.tsx catches it with a retry button
- Given all route segments, when inspected, then each has loading.tsx and error.tsx
