import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['undici'],

  /**
   * 舊路徑永久 redirect（相容舊書籤／舊分享連結）
   * /manga/:id → /manga/manhuagui/:id
   * /read/:bid/:cid → /read/manhuagui/:bid/:cid
   *
   * 注意：必須使用 permanent: false（307）才能讓 search engine 跟進
   * 未來若確定所有舊連結已過期可改 permanent: true（308）
   */
  async redirects() {
    return [
      {
        source: '/manga/:id(\\d+)',
        destination: '/manga/manhuagui/:id',
        permanent: false,
      },
      {
        source: '/read/:bid(\\d+)/:cid(\\d+)',
        destination: '/read/manhuagui/:bid/:cid',
        permanent: false,
      },
    ];
  },

  // 開發環境代理 API 請求到 Vercel（避免 CORS 問題）
  async rewrites() {
    if (process.env.NODE_ENV === 'development' && process.env.USE_VERCEL_API === 'true') {
      return {
        beforeFiles: [
          {
            source: '/api/:path*',
            destination: 'https://manga-reader-gamma.vercel.app/api/:path*',
          },
        ],
      };
    }
    return {
      beforeFiles: [],
    };
  },
};

export default nextConfig;
