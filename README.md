# Manga Reader

漫畫閱讀器 Web 應用，從漫畫網站爬取內容，提供閱讀器、收藏、閱讀紀錄與排行榜功能。

## 快速開始

```bash
npm install
npm run dev
```

預設在 [http://localhost:3000](http://localhost:3000) 啟動。可透過 `PORT` 環境變數指定埠號：

```bash
PORT=3500 npm run dev
```

## 可用指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 開發模式（支援 PORT 環境變數） |
| `npm run build` | 建置 |
| `npm run start` | 啟動（支援 PORT 環境變數） |
| `npm run test` | 執行測試（Vitest） |
| `npm run lint` | ESLint 檢查 |
| `npm run pm2` | PM2 部署（見 ecosystem.config.js） |

## 功能

- **漫畫列表** — 搜尋、篩選（地區/劇情/年份/進度）、排序
- **漫畫詳情** — 章節列表、收藏管理
- **閱讀器** — 單頁 / 捲動模式，觸控滑動翻頁，鍵盤快捷鍵
- **收藏** — 新章節自動偵測提示
- **閱讀紀錄** — 自動記錄，支援繼續閱讀
- **最新更新** — 近期更新漫畫列表
- **排行榜** — 多類型排行

## 環境變數

| 變數 | 說明 | 預設值 |
| --- | --- | --- |
| `PORT` | 服務埠號 | `3000` |
| `NEXT_PUBLIC_BASE_URL` | 用於 OpenGraph 封面圖 URL | `http://localhost:3000` |
