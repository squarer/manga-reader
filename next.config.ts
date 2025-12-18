import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
