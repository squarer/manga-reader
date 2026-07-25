/**
 * Dean Edwards Packer 通用解包模組
 * 供各 provider 共用（manhuagui、未來 dm5 等）
 */

import LZString from 'lz-string';

/**
 * 解壓縮 LZString 編碼的關鍵字。
 * 傳入 expectedCount 以驗證 LZ 解壓結果確實產生正確數量的關鍵字；
 * 若 LZ 結果 count 不符（如 dm5 純文字關鍵字被誤判為 LZ），直接 split('|')。
 */
function decompressKeywords(encoded: string, expectedCount: number): string[] {
  // 嘗試 LZString 解壓（manhuagui 使用 LZ 壓縮格式）
  if (!encoded.includes('|') || encoded.length > 100) {
    try {
      const decompressed = LZString.decompressFromBase64(encoded);
      if (decompressed) {
        const parts = decompressed.split('|');
        // 解壓結果必須符合預期數量才採用，否則視為誤判（dm5 等純文字格式）
        if (parts.length === expectedCount) {
          return parts;
        }
      }
    } catch {
      // 解壓失敗，直接分割
    }
  }
  return encoded.split('|');
}

/**
 * 將數字轉換為對應的基數表示
 */
function encodeBase(num: number, radix: number): string {
  if (num < radix) {
    if (num < 36) {
      return num.toString(36);
    } else {
      return String.fromCharCode(num + 29);
    }
  }
  return encodeBase(Math.floor(num / radix), radix) + encodeBase(num % radix, radix);
}

/** Payload 最大長度限制（防止 ReDoS） */
const MAX_PAYLOAD_LENGTH = 500000;

/**
 * 解密 Dean Edwards Packed JavaScript
 * 格式: eval(function(p,a,c,k,e,d){...}('packed_string',base,count,keywords,...))
 */
export function unpack(packed: string): string {
  // 長度檢查（防止 ReDoS）
  if (packed.length > MAX_PAYLOAD_LENGTH) {
    throw new Error('Packed string too large');
  }

  // 匹配 packed 格式的正則
  const packedRegex = /}\('(.+)',(\d+),(\d+),'([^']+)'\.split\('\|'\)/;
  const match = packed.match(packedRegex);

  if (!match) {
    throw new Error('Invalid packed format');
  }

  const [, payload, radixStr, countStr, keywordsStr] = match;
  const radix = parseInt(radixStr, 10);
  const count = parseInt(countStr, 10);

  // 解壓縮關鍵字（可能是 LZString 壓縮的），傳入 count 確保解壓結果數量正確
  const keywords = decompressKeywords(keywordsStr, count);

  // 構建解碼映射表
  const dictionary: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    const key = encodeBase(i, radix);
    dictionary[key] = keywords[i] || key;
  }

  // 替換所有編碼的標識符
  const result = payload.replace(/\b[a-zA-Z0-9]+\b/g, (match) => {
    return dictionary[match] || match;
  });

  return result;
}
