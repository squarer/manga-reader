---
title: 為 generateMetadata 加入 OpenGraph 和 Twitter Card 元資料
created: 2026-03-10
priority: low
suggested_order: P9
---

# 加入 OpenGraph 和 Twitter Card metadata

manga/[id] 和 read/[bid]/[cid] 的 generateMetadata 只有 title/description，無 OpenGraph 或 Twitter Card。社群分享不顯示封面預覽。

應加入：
- openGraph: title、description、images（指向代理封面 URL）
- twitter: card: 'summary_large_image'

## User Stories

- As a user sharing a manga link on social media, I want the shared link to show a rich preview with the manga cover and title, so that my friends can see what I am recommending.

## 驗收條件

- Given a manga detail URL shared on Discord, when previewed, then cover image and title are shown
- Given page source, when inspected, then og:image and twitter:card meta tags are present
