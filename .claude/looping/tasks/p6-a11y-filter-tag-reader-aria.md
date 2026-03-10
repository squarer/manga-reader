---
title: 修正 FilterTag、章節列表和閱讀器換頁區域的 ARIA 屬性
created: 2026-03-10
priority: medium
suggested_order: P6
---

# 修正 a11y ARIA 屬性

三個 a11y 問題：
1. MangaFilter FilterTag 使用 Badge+onClick 模擬按鈕，無 role/tabIndex/aria-pressed
2. MangaDetailContent 章節網格無 list/listitem role
3. Reader.tsx 換頁觸控區域（左右點擊切頁）無 aria-label

## User Stories

- As a user relying on assistive technology, I want filter controls, chapter lists, and page navigation to be properly announced and keyboard-operable, so that I can use the app without a mouse.

## 驗收條件

- Given FilterTag, when focused via Tab key, then it is focusable and togglable via Enter/Space
- Given chapter grid, when read by screen reader, then it announces as a list with items
- Given reader page navigation areas, when read by screen reader, then "previous page" / "next page" is announced
