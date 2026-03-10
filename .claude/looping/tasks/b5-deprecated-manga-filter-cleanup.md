---
title: 清除 MangaFilter deprecated default export
created: 2026-03-10
priority: low
suggested_order: B5
---

# 清除 MangaFilter deprecated default export

MangaFilter.tsx 有 `@deprecated` 標記的 `export default MangaFilter` 元件，註解說明應改用 Navbar 中的 FilterPopover。但 named exports（FilterContent、FilterState、getActiveFilterCount 等）仍被多處使用。

需要：
1. 確認 default export 確實無人使用（grep 所有 import）
2. 若無使用則刪除 deprecated 元件
3. 若有使用則遷移呼叫端

## User Stories

- As a developer, I want deprecated code to be removed so that the codebase stays clean and does not confuse future contributors.

## 驗收條件

- Given MangaFilter.tsx, when inspected, then no deprecated default export exists
- Given all import statements, when searched, then no file imports the default MangaFilter
- Given the app, when built, then no build errors related to MangaFilter imports
