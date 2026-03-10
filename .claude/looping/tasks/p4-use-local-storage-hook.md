---
title: 抽取 useLocalStorage 通用 hook 統一 localStorage 邏輯
created: 2026-03-10
priority: medium
suggested_order: P4
---

# 抽取 useLocalStorage 通用 hook

useFavorites 和 useHistory 有約 80% 相同程式碼（localStorage 初始化、SSR guard、isLoaded 狀態管理、同步寫入）。useReaderHooks 又用第三套方式。

應抽取 `useLocalStorage<T>(key, defaultValue)` 通用 hook：
- SSR 安全讀取
- JSON parse/stringify
- isLoaded 狀態
- error handling（Fail-Fast）
- 三個 hook 改成薄包裝

## User Stories

- As a developer, I want a single, well-tested localStorage abstraction, so that adding new persistent features does not require duplicating boilerplate code.

## 驗收條件

- Given useLocalStorage hook, when used in SSR, then no window is not defined error
- Given useFavorites, when inspected, then it delegates localStorage logic to useLocalStorage
- Given useHistory, when inspected, then it delegates localStorage logic to useLocalStorage
