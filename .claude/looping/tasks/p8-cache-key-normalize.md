---
title: 修正 cache key 使用完整 request.url 導致跨環境不命中
created: 2026-03-10
priority: medium
suggested_order: P8
---

# 修正 cache key 正規化

rank、manga、update route 的 cache key 直接用 request.url（含 host/port），不同環境（localhost vs production）即使參數相同也永不命中。

修正：cache key 正規化為 pathname + searchParams，移除 host/protocol。

## User Stories

- As a developer, I want the server-side cache to work correctly regardless of deployment environment, so that upstream scraping is minimized and response times are consistent.

## 驗收條件

- Given same query on different hosts, when cache is checked, then the same key is used
- Given withCache usage, when inspected, then cache key only contains pathname + query params
