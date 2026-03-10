---
title: 圖片代理 API SSRF 防護：protocol 白名單驗證
created: 2026-03-10
priority: critical
suggested_order: A1
---

# 圖片代理 API SSRF 防護：protocol 白名單驗證

/api/image route 僅驗證 hostname 是否在允許清單內，但未驗證 URL protocol。攻擊者可構造 `file:///etc/passwd` 或 `ftp://i.hamreus.com/...` 等 URL，hostname 檢查通過但 protocol 不安全。需在 `new URL(url)` 後加入 `urlObj.protocol` 白名單檢查（僅允許 `https:`），並對 URL 做進一步正規化防止繞過（如 `javascript:` scheme、CRLF injection 等）。

## User Stories

- As a system operator, I want the image proxy to reject non-HTTPS protocols so that the server is protected from SSRF attacks.

## 驗收條件

- Given a URL with `file://` protocol, when requesting /api/image, then return 400 error
- Given a URL with `https://` and valid hostname, when requesting /api/image, then proxy the image normally
- Given a URL with `javascript:` scheme, when requesting /api/image, then return 400 error
