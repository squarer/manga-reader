---
title: 閱讀器章節切換改用 router.push 實現 SPA 導航
created: 2026-03-10
priority: high
suggested_order: A3
---

# 閱讀器章節切換改用 router.push 實現 SPA 導航

Reader.tsx 的 SinglePageReader 和鍵盤快捷鍵在切換上/下一章時使用 `window.location.href = ...` 做 hard navigation（6 處），造成整頁重載、狀態丟失、白屏閃爍。而 ReaderToolbar.tsx 中的 BottomToolbar 已正確使用 `router.push` + Link 元件。

需將 Reader.tsx 中所有 `window.location.href` 賦值改為 `router.push()`，並確保章節切換時正確重置 currentPage、scrollTo top、及更新 history。

## User Stories

- As a reader, I want chapter transitions to be smooth without full page reloads so that I have a seamless reading experience.

## 驗收條件

- Given the reader on chapter 5, when clicking next chapter, then navigate to chapter 6 without full page reload
- Given chapter navigation via keyboard shortcut, when pressing the shortcut, then SPA navigation occurs
- Given chapter switch, when new chapter loads, then currentPage resets to 1 and scroll position is at top
