---
title: 將 YEAR_OPTIONS 年份列表改為動態產生
created: 2026-03-10
priority: low
suggested_order: P11
---

# YEAR_OPTIONS 動態產生

MangaFilter.tsx 硬編碼 YEAR_OPTIONS = ['2025', '2024', ..., '2020', '更早']，每年需手動更新。

改為根據 `new Date().getFullYear()` 動態產生，往回推 5-6 年，末尾加 '更早'。

## User Stories

- As a developer, I want the year filter options to automatically include the current year, so that the filter stays up-to-date without manual code changes.

## 驗收條件

- Given the current year is 2026, when YEAR_OPTIONS is generated, then it includes '2026' as first option
- Given the year changes to 2027, when YEAR_OPTIONS is generated, then it includes '2027' without code change
