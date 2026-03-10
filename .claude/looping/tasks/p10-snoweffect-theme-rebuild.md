---
title: 修正 SnowEffect 主題切換時重建整個 Canvas 的效能問題
created: 2026-03-10
priority: low
suggested_order: P10
---

# 修正 SnowEffect 主題切換效能

SnowEffect 的 useEffect deps 含 resolvedTheme，每次切換主題都銷毀整個動畫循環、重建 300 個粒子。實際只需更新繪製顏色。

修正：resolvedTheme 存入 ref，animate 函數讀 ref 值決定顏色，不列入 effect deps。getPrimaryColor 改用 getComputedStyle(document.documentElement)。

## User Stories

- As a user toggling between light and dark themes, I want the snow effect to transition smoothly without visible flicker or re-initialization.

## 驗收條件

- Given theme toggle, when switching, then snow particles maintain position and velocity
- Given SnowEffect useEffect, when inspected, then resolvedTheme is not in deps array
