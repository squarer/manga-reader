---
title: 劇情分類篩選器：UI 改為單選或顯示多選限制提示
created: 2026-03-10
priority: high
suggested_order: B3
---

# 劇情分類篩選器：UI 改為單選或顯示多選限制提示

MangaFilter 的 genre 區塊允許多選（toggleGenre 支援多個 genre），但 API route 只取 `genreParam.split(',')[0]`，因為上游網站不支援多類型組合篩選。使用者選了多個 genre 卻只有第一個生效，無任何提示。

建議方案：將 genre 改為單選，與 region/year 一致。需同步修改 FilterState type、filtersToParams、parseFiltersFromParams。

## User Stories

- As a user, I want the genre filter to clearly show which filter is actually applied so that I am not confused by selecting multiple genres with no effect.

## 驗收條件

- Given the genre filter, when clicking a genre, then it behaves as single-select (previous selection is replaced)
- Given FilterState type, when inspected, then genres is `string` not `string[]`
- Given a URL with genre param, when parsed, then single genre is correctly applied
