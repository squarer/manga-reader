---
title: 閱讀紀錄已讀章節標記修復：保留多章節記錄
created: 2026-03-10
priority: critical
suggested_order: A2
---

# 閱讀紀錄已讀章節標記修復：保留多章節記錄

useHistory.addHistory 以 `mangaId` 為 key 過濾舊記錄（`prev.filter((h) => h.mangaId !== item.mangaId)`），導致同一漫畫只保留最後一筆。MangaDetailContent 的 readChapterIds 依賴 history 來計算已讀集合，因此讀了新章節後舊的已讀標記消失。

修改方案：將 history 結構分為「閱讀進度」（每部漫畫一筆，記錄最後讀到哪）和「已讀章節列表」（每部漫畫可有多個 chapterId），或改為 addHistory 以 `mangaId + chapterId` 組合為唯一 key。需同時處理 MAX_HISTORY 限制邏輯及 localStorage 遷移。

## User Stories

- As a reader, I want previously read chapters to remain marked as read when I start a new chapter so that I can track my reading progress across all chapters.

## 驗收條件

- Given a manga with chapters 1-5, when I read chapter 1 then chapter 3, then both chapters show as read on the detail page
- Given existing localStorage data in old format, when the app loads, then data is migrated to new format without loss
- Given MAX_HISTORY limit reached, when adding new history, then oldest entries are evicted correctly
