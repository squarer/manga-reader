---
title: 消除漫畫詳情頁 Server generateMetadata 與 Client useFetch 的重複爬取
created: 2026-03-10
priority: high
suggested_order: P7
---

# 消除漫畫詳情頁雙重 fetch

manga/[id]/page.tsx 的 generateMetadata 在 Server 端呼叫 fetchMangaDetail，MangaDetailContent 又用 useFetch 再打一次 /api/manga/[id]（API 內部再爬一次）。同一頁觸發 2-3 次上游爬取。

修正：Server Component 取得資料後透過 props 傳入 Client Component 作為 initialData，避免 Client 端重複請求。閱讀器頁面也有同樣問題。

## User Stories

- As a user, I want the manga detail page to load faster without redundant server-side fetches, so that the page renders quickly and upstream servers are not hammered.

## 驗收條件

- Given manga detail page load, when server renders, then upstream is fetched only once
- Given MangaDetailContent, when receiving initialData prop, then it does not trigger useFetch
- Given reader page, when loaded, then chapter data is fetched once not twice
