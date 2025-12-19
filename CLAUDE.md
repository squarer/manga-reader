# Manga Reader 專案規範

## 專案概述

漫畫閱讀器 Web 應用，從漫畫網站爬取內容並提供閱讀介面。

## 技術棧

| 類型 | 技術                                 |
| ---- | ------------------------------------ |
| 框架 | Next.js 16 (App Router)              |
| 前端 | React 19, TypeScript                 |
| 樣式 | Tailwind CSS 4, shadcn/ui (new-york) |
| 圖標 | Lucide React                         |
| 爬蟲 | cheerio, axios                       |
| 解密 | lz-string                            |
| 主題 | next-themes                          |

## 專案結構

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── manga/         # 漫畫列表/詳情 API
│   │   ├── chapter/       # 章節內容 API
│   │   ├── image/         # 圖片代理 API
│   │   └── rank/          # 排行榜 API
│   ├── manga/[id]/        # 漫畫詳情頁
│   ├── rank/              # 排行榜頁面
│   ├── read/[bid]/[cid]/  # 閱讀器頁面
│   └── update/            # 最新更新頁面
├── components/            # React 元件
│   ├── ui/                # shadcn/ui 元件
│   ├── FavoritesSection.tsx
│   ├── HistorySection.tsx
│   ├── MangaCard.tsx      # 漫畫卡片
│   ├── MangaFilter.tsx    # 篩選器
│   ├── Navbar.tsx         # 導航列
│   ├── Reader.tsx         # 閱讀器
│   ├── ThemeProvider.tsx  # 主題提供者
│   ├── ThemeToggle.tsx    # 主題切換
│   └── TiltCard.tsx       # 傾斜卡片效果
└── lib/
    ├── hooks/             # 自定義 Hooks
    │   ├── useFavorites.ts
    │   └── useHistory.ts
    └── scraper/           # 爬蟲模組
        ├── index.ts       # 主入口
        ├── fetcher.ts     # HTTP 請求
        ├── parser.ts      # HTML 解析
        ├── decrypt.ts     # 圖片解密
        └── types.ts       # 型別定義
```

## 開發指令

```bash
# 開發
npm run dev

# 建置
npm run build

# 檢查
npm run lint

# 新增 shadcn 元件
npx shadcn@latest add <component>

# 切換 shadcn 主題（會覆蓋 globals.css）
npx shadcn@latest init -f -b <base-color>
# base-color: neutral | gray | zinc | stone | slate

# 套用 tinte.dev 主題（如 Claude 主題）
npx shadcn@latest add https://www.tinte.dev/r/claude
```

## 核心型別

- `MangaInfo` - 漫畫詳細資訊
- `MangaListItem` - 列表項目
- `ChapterInfo` - 章節資訊
- `ImageData` - 閱讀器圖片資料
- `RankItem` - 排行項目
- `FilterOptions` - 篩選選項
- `PaginationInfo` - 分頁資訊

## API 路由

| 路由                       | 用途                   |
| -------------------------- | ---------------------- |
| `/api/manga`               | 漫畫列表、搜尋         |
| `/api/manga/[id]`          | 漫畫詳情               |
| `/api/manga/update`        | 最新更新 API           |
| `/api/chapter/[bid]/[cid]` | 章節圖片               |
| `/api/image`               | 圖片代理（繞過防盜鏈） |
| `/api/rank`                | 排行榜 API             |

## 開發流程

### Fix Issue 流程

1. 修改程式碼
2. 驗證修復
3. Commit
4. Push

## UI 元件規範

### Fixed Header 漸層背景

需要漸層背景延伸到 Navbar 區域的 fixed header 必須：

```tsx
<header className="fixed top-0 ... pt-[4.5rem] pb-3 bg-gradient-to-b from-background/90 to-transparent">
  {/* 內容 */}
</header>
```

| 屬性 | 值 | 說明 |
| --- | --- | --- |
| `top-0` | 從頁面最上方開始 | 讓漸層延伸到 Navbar 後方 |
| `pt-[4.5rem]` | 72px | 內容在 Navbar 下方 |
| `z-50` | 低於 Navbar (z-[60]) | 確保 Navbar 在上層 |

## 注意事項

- 圖片需透過代理 API 載入（防盜鏈）
- 章節圖片資料需解密處理
- localStorage 儲存收藏和閱讀紀錄
