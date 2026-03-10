---
title: 為 API 路由加入 Cache-Control 回應標頭
created: 2026-03-10
priority: high
suggested_order: P3
---

# 為 API 路由加入 Cache-Control 回應標頭

manga detail、rank、chapter、manga list、update 五個 API 路由都沒有 Cache-Control（只有 image proxy 有）。CDN 和瀏覽器無法快取，每次都觸發上游爬取。

建議策略：
- rank/update：`s-maxage=300, stale-while-revalidate=3600`（5 分鐘）
- manga detail：`s-maxage=3600, stale-while-revalidate=86400`（1 小時）
- chapter：`s-maxage=86400`（24 小時，圖片資料不常變）

## User Stories

- As a user, I want previously loaded manga data to be served from cache instantly, so that navigation feels snappy and the upstream server is not overwhelmed.

## 驗收條件

- Given /api/manga/[id] response, when inspected, then Cache-Control header is present
- Given /api/rank response, when inspected, then s-maxage=300 is set
- Given repeated requests to same manga detail, when CDN serves, then upstream is not re-fetched
