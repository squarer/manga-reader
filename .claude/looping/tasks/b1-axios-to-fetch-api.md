---
title: fetcher.ts 從 axios 遷移至 Fetch API
created: 2026-03-10
priority: high
suggested_order: B1
blockedBy: t1-test-infrastructure-and-core-tests
---

# fetcher.ts 從 axios 遷移至 Fetch API

fetcher.ts 使用 axios 作為 HTTP client，違反專案規範（typescript.md 規定 HTTP 客戶端必須使用 Fetch API）。需要：

1. 將所有 fetcher.ts 中的 axios 呼叫改為 global fetch + 相應 headers
2. fetchImage 改用 fetch + arrayBuffer() 取代 axios responseType: 'arraybuffer'
3. 保留 proxy 支援（可用環境變數 `HTTPS_PROXY`）
4. 保留 retry 邏輯
5. 移除 axios 依賴

## User Stories

- As a developer, I want the HTTP client to use the standard Fetch API so that the codebase follows project conventions and reduces bundle size.

## 驗收條件

- Given fetcher.ts, when inspected, then no axios import exists
- Given package.json, when inspected, then axios is not in dependencies
- Given a manga detail API call, when fetcher fetches upstream, then it uses global fetch with correct headers
- Given PROXY_HOST env set, when fetching, then proxy is respected
