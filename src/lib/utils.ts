import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Round-robin 交錯合併多個列表：各列表輪流取一項，直到全部取完。
 * 例：interleave([[a1,a2,a3],[b1,b2]]) → [a1,b1,a2,b2,a3]
 * 空列表自動跳過，不產生 undefined 空洞。
 */
export function interleave<T>(lists: T[][]): T[] {
  const out: T[] = []
  const maxLen = Math.max(0, ...lists.map((l) => l.length))
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i])
    }
  }
  return out
}
