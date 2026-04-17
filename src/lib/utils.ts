import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 解析頁碼參數，clamp 到合法範圍
 */
export function parsePage(raw: string | null, maxPage = 500): number {
  const n = parseInt(raw || '1', 10);
  return isNaN(n) ? 1 : Math.min(Math.max(1, n), maxPage);
}
