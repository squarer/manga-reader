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

## 專案結構

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── manga/         # 漫畫列表/詳情 API
│   │   ├── chapter/       # 章節內容 API
│   │   └── image/         # 圖片代理 API
│   ├── manga/[id]/        # 漫畫詳情頁
│   └── read/[bid]/[cid]/  # 閱讀器頁面
├── components/            # React 元件
│   ├── ui/                # shadcn/ui 元件
│   ├── MangaCard.tsx      # 漫畫卡片
│   ├── Reader.tsx         # 閱讀器
│   ├── FavoritesSection.tsx
│   └── HistorySection.tsx
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

## API 路由

| 路由                       | 用途                   |
| -------------------------- | ---------------------- |
| `/api/manga`               | 漫畫列表、搜尋         |
| `/api/manga/[id]`          | 漫畫詳情               |
| `/api/chapter/[bid]/[cid]` | 章節圖片               |
| `/api/image`               | 圖片代理（繞過防盜鏈） |

## 注意事項

- 圖片需透過代理 API 載入（防盜鏈）
- 章節圖片資料需解密處理
- localStorage 儲存收藏和閱讀紀錄
