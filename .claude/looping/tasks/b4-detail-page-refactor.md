---
title: MangaDetailContent 拆分重構：提取子元件
created: 2026-03-10
priority: medium
suggested_order: B4
---

# MangaDetailContent 拆分重構：提取子元件

MangaDetailContent.tsx 488 行，包含漫畫資訊區、收藏按鈕、章節列表、繼續閱讀、心跳動畫等多種職責。同時包含 `<style jsx global>` 區塊（心跳動畫），應移至 globals.css 或 Tailwind plugin。

建議拆分：
1. MangaInfoHeader（封面、名稱、作者、評分）
2. MangaActions（收藏、繼續閱讀按鈕）
3. ChapterGroupDisplay 提取至單獨檔案
4. heartbeat keyframe 移至 CSS

## User Stories

- As a developer, I want the manga detail page to be composed of focused, single-responsibility components so that the code is easier to maintain and test.

## 驗收條件

- Given MangaDetailContent.tsx, when inspected, then it is under 200 lines
- Given heartbeat animation, when inspected, then it is defined in globals.css not inline style jsx
- Given the manga detail page, when loaded, then visual appearance is identical to before refactor
