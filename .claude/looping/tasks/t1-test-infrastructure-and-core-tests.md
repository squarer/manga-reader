---
title: 測試基礎建設與 scraper 核心模組測試覆蓋
created: 2026-03-10
priority: critical
suggested_order: T1
---

# 測試基礎建設與 scraper 核心模組測試覆蓋

專案零測試覆蓋，無測試框架設定。需要：

1. 安裝 Vitest（與 Next.js 16 相容）並配置 tsconfig paths 解析
2. 為最脆弱的 decrypt.ts 撰寫 unit test（unpack、extractPackedScript、parseImageData、buildImageUrl）
3. 為 detail-parser.ts 的 parseMangaDetail 和 naturalSort 撰寫 unit test（使用真實 HTML fixture）
4. 為 computePrevNextCid 撰寫 unit test（邊界：空列表、單元素、首尾章節、ID 不存在）

這些純函數不依賴 DOM/網路，適合作為測試起點。

## User Stories

- As a developer, I want automated tests for the scraper and decrypt modules so that upstream HTML structure changes are caught immediately.

## 驗收條件

- Given `npm run test`, when executed, then Vitest runs successfully
- Given decrypt.ts test suite, when run with HTML fixture, then all decrypt functions return expected image data
- Given naturalSort, when called with ["話10","話9","話1"], then returns ["話1","話9","話10"]
- Given computePrevNextCid with first chapter, when called, then prevCid is null and nextCid is correct
