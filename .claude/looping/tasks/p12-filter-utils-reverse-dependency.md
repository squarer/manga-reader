---
title: 消除 lib/filter-utils.ts 反向依賴 components/MangaFilter 的架構違規
created: 2026-03-10
priority: medium
suggested_order: P12
---

# 消除 lib → components 反向依賴

lib/filter-utils.ts 從 @/components/MangaFilter import FilterState、GenreKey、RegionKey 等型別和常數。lib 層反向依賴 components 層，違反單向依賴原則。

修正：將共用型別和常數移到 lib 層（如 lib/filter-types.ts），MangaFilter 和 filter-utils 都從 lib 匯入。

## User Stories

- As a developer, I want the lib layer to be independent from the components layer, so that I can safely refactor UI components without breaking utility functions.

## 驗收條件

- Given lib/filter-utils.ts, when inspected, then no import from @/components/
- Given lib/filter-types.ts, when inspected, then it contains FilterState and related types
- Given MangaFilter.tsx, when inspected, then it imports types from @/lib/filter-types
