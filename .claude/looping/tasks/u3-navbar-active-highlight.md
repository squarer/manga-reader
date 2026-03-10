---
title: Navbar 導航項目 active 狀態視覺高亮
created: 2026-03-10
priority: low
suggested_order: U3
---

# Navbar 導航項目 active 狀態視覺高亮

Navbar 的 HoverExpandButton 已有 `isActive` prop 判斷邏輯和 active 樣式分支，但視覺區分度不足。需增強 active 視覺區分度：加入底部指示線或更明顯的背景色差異，確保使用者在任何頁面都能一眼辨識當前位置。

## User Stories

- As a user, I want to clearly see which page I am on from the navigation bar so that I always know my current location in the app.

## 驗收條件

- Given the user is on /favorites, when looking at Navbar, then the favorites button has a clearly visible active indicator
- Given the user navigates from /favorites to /history, when Navbar updates, then active indicator moves to history button
