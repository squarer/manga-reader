// 漫畫基本資訊
export interface MangaInfo {
  id: number;
  name: string;
  cover: string;
  author: string;
  status: string; // 連載中 / 已完結
  genres: string[];
  description: string;
  lastUpdate: string;
  chapters: ChapterGroup[];
}

// 章節分組 (單話、番外篇等)
export interface ChapterGroup {
  title: string;
  chapters: ChapterInfo[];
}

// 章節資訊
export interface ChapterInfo {
  id: number;
  name: string;
  url: string;
}

// 閱讀器圖片資料 (從加密 JS 解出)
export interface ImageData {
  bid: number;      // 漫畫 ID
  cid: number;      // 章節 ID
  bname: string;    // 漫畫名
  cname: string;    // 章節名
  files: string[];  // 圖片檔名列表
  path: string;     // 圖片路徑
  sl: {             // 簽名參數
    e: number;
    m: string;
  };
  prevcid?: number; // 上一章節 ID
  nextcid?: number; // 下一章節 ID
}

// 漫畫列表項目
export interface MangaListItem {
  id: number;
  name: string;
  cover: string;
  latestChapter: string;
  updateTime: string;
  score?: number;
}

// 排行榜趨勢
export enum RankTrend {
  UP = 'up',
  DOWN = 'down',
  SAME = 'same',
}

// 排行榜項目
export interface RankItem extends MangaListItem {
  /** 排名 */
  rank: number;
  /** 瀏覽數 */
  views?: number;
  /** 排名趨勢 */
  trend?: RankTrend;
  /** 作者 */
  author?: string;
}

// 列表頁分頁資訊
export interface PaginationInfo {
  current: number;
  total: number;
  totalItems: number;
}

// API 回應格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 地區分類
 */
export enum RegionType {
  Japan = 'japan',
  Korea = 'korea',
  HongKong = 'hongkong',
  China = 'china',
  Europe = 'europe',
  Other = 'other',
}

/**
 * 劇情分類
 */
export enum GenreType {
  Rexue = 'rexue',           // 熱血
  Maoxian = 'maoxian',       // 冒險
  Mohuan = 'mohuan',         // 魔幻
  Shengui = 'shengui',       // 神鬼
  Gaoxiao = 'gaoxiao',       // 搞笑
  Mengxi = 'mengxi',         // 萌系
  Aiqing = 'aiqing',         // 愛情
  Kehuan = 'kehuan',         // 科幻
  Mofa = 'mofa',             // 魔法
  Gedou = 'gedou',           // 格鬥
  Wuxia = 'wuxia',           // 武俠
  Jizhan = 'jizhan',         // 機戰
  Zhanzheng = 'zhanzheng',   // 戰爭
  Jingji = 'jingji',         // 競技
  Tiyu = 'tiyu',             // 體育
  Xiaoyuan = 'xiaoyuan',     // 校園
  Shenghuo = 'shenghuo',     // 生活
  Lizhi = 'lizhi',           // 勵志
  Lishi = 'lishi',           // 歷史
  Weiniang = 'weiniang',     // 偽娘
  Zhainan = 'zhainan',       // 宅男
  Funv = 'funv',             // 腐女
  Danmei = 'danmei',         // 耽美
  Baihe = 'baihe',           // 百合
  Hougong = 'hougong',       // 後宮
  Zhiyu = 'zhiyu',           // 治癒
  Meishi = 'meishi',         // 美食
  Tuili = 'tuili',           // 推理
  Xuanyi = 'xuanyi',         // 懸疑
  Kongbu = 'kongbu',         // 恐怖
  Sige = 'sige',             // 四格
  Zhichang = 'zhichang',     // 職場
  Zhentan = 'zhentan',       // 偵探
  Shehui = 'shehui',         // 社會
  Jieqi = 'jieqi',           // 節氣
  Guzhuang = 'guzhuang',     // 古裝
  Weinv = 'weinv',           // 偽女
  Qihuan = 'qihuan',         // 奇幻
  Chuanyue = 'chuanyue',     // 穿越
  Heidao = 'heidao',         // 黑道
  Zhenren = 'zhenren',       // 真人
  Jiangshi = 'jiangshi',     // 殭屍
  Gaozhihui = 'gaozhihui',   // 高智慧
  Egao = 'egao',             // 惡搞
  Qingchun = 'qingchun',     // 青春
}

/**
 * 劇情分類對照表（中文名稱）
 */
export const GENRE_LABELS: Record<GenreType, string> = {
  [GenreType.Rexue]: '熱血',
  [GenreType.Maoxian]: '冒險',
  [GenreType.Mohuan]: '魔幻',
  [GenreType.Shengui]: '神鬼',
  [GenreType.Gaoxiao]: '搞笑',
  [GenreType.Mengxi]: '萌系',
  [GenreType.Aiqing]: '愛情',
  [GenreType.Kehuan]: '科幻',
  [GenreType.Mofa]: '魔法',
  [GenreType.Gedou]: '格鬥',
  [GenreType.Wuxia]: '武俠',
  [GenreType.Jizhan]: '機戰',
  [GenreType.Zhanzheng]: '戰爭',
  [GenreType.Jingji]: '競技',
  [GenreType.Tiyu]: '體育',
  [GenreType.Xiaoyuan]: '校園',
  [GenreType.Shenghuo]: '生活',
  [GenreType.Lizhi]: '勵志',
  [GenreType.Lishi]: '歷史',
  [GenreType.Weiniang]: '偽娘',
  [GenreType.Zhainan]: '宅男',
  [GenreType.Funv]: '腐女',
  [GenreType.Danmei]: '耽美',
  [GenreType.Baihe]: '百合',
  [GenreType.Hougong]: '後宮',
  [GenreType.Zhiyu]: '治癒',
  [GenreType.Meishi]: '美食',
  [GenreType.Tuili]: '推理',
  [GenreType.Xuanyi]: '懸疑',
  [GenreType.Kongbu]: '恐怖',
  [GenreType.Sige]: '四格',
  [GenreType.Zhichang]: '職場',
  [GenreType.Zhentan]: '偵探',
  [GenreType.Shehui]: '社會',
  [GenreType.Jieqi]: '節氣',
  [GenreType.Guzhuang]: '古裝',
  [GenreType.Weinv]: '偽女',
  [GenreType.Qihuan]: '奇幻',
  [GenreType.Chuanyue]: '穿越',
  [GenreType.Heidao]: '黑道',
  [GenreType.Zhenren]: '真人',
  [GenreType.Jiangshi]: '殭屍',
  [GenreType.Gaozhihui]: '高智慧',
  [GenreType.Egao]: '惡搞',
  [GenreType.Qingchun]: '青春',
};

/**
 * 排序方式
 */
export enum SortType {
  Default = '',            // 預設
  Update = 'update',       // 最新更新
  View = 'view',           // 人氣最旺
  Rate = 'rate',           // 評分最高
}

/**
 * 連載狀態
 */
export enum MangaStatus {
  All = '',                // 全部
  Ongoing = 'lianzai',     // 連載中
  Completed = 'wanjie',    // 已完結
}

/**
 * 排行榜類型
 */
export enum RankTypeEnum {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Total = 'total',
}

/**
 * 篩選選項
 */
export interface FilterOptions {
  /** 地區 */
  region?: RegionType;
  /** 劇情分類 */
  genre?: GenreType;
  /** 年份 (e.g., "2024") */
  year?: string;
  /** 字母索引 (a-z) */
  letter?: string;
  /** 連載狀態 */
  status?: MangaStatus;
  /** 排序方式 */
  sort?: SortType;
  /** 頁碼 */
  page?: number;
}
