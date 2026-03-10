---
title: useFetch 加入 res.ok 檢查，修正靜默吞錯行為
created: 2026-03-10
priority: high
suggested_order: P5
---

# useFetch 加入 res.ok 檢查

useFetch 在 fetch 成功後直接 `res.json()` 而不檢查 res.ok。HTTP 404/500 回傳 HTML 時 res.json() 拋 SyntaxError，被 catch 後只顯示「網路錯誤」。違反 Fail-Fast 原則。

修正：
- res.json() 前檢查 res.ok
- 非 ok 先嘗試解析 JSON 取 error message
- 失敗則使用 HTTP status text
- useLazyFetch 同步修正

## User Stories

- As a user, I want to see a meaningful error message when an API fails, so that I can understand what went wrong instead of seeing a generic 'network error'.

## 驗收條件

- Given API returns 500, when useFetch processes response, then error message includes status code or server error message
- Given API returns 404 HTML, when useFetch processes response, then error is "Not Found" not SyntaxError
- Given API returns 200 with valid JSON, when useFetch processes, then data is parsed normally
