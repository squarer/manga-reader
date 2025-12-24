/**
 * Dean Edwards Packer 解密模組
 * 用於解密 manhuagui.com 的加密 JavaScript
 */

import LZString from 'lz-string';
import type { ImageData } from './types';

/**
 * 解壓縮 LZString 編碼的關鍵字
 */
function decompressKeywords(encoded: string): string[] {
  // 如果是單個 Base64 編碼的壓縮字串
  if (!encoded.includes('|') || encoded.length > 100) {
    try {
      const decompressed = LZString.decompressFromBase64(encoded);
      if (decompressed) {
        return decompressed.split('|');
      }
    } catch {
      // 如果解壓失敗，嘗試直接分割
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

  // 解壓縮關鍵字（可能是 LZString 壓縮的）
  const keywords = decompressKeywords(keywordsStr);

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

/**
 * 從 HTML 中提取加密的 JavaScript 代碼
 */
export function extractPackedScript(html: string): string | null {
  // 尋找 window["eval"] 或類似的加密區塊
  // 格式通常是: window["\x65\x76\x61\x6c"](function(p,a,c,k,e,d){...})

  const patterns = [
    // 十六進制編碼的 eval
    /window\[\\?"\\?x65\\?x76\\?x61\\?x6c\\?"\]\(function\(p,a,c,k,e,d\)\{[^}]+\}\([^)]+\)\)/,
    // 普通的 eval
    /eval\(function\(p,a,c,k,e,d\)\{[^}]+\}\([^)]+\)\)/,
    // SMH.reader 相關
    /\(function\(p,a,c,k,e,d\)\{[^}]+\}\('[^']+',\d+,\d+,'[^']+'/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[0];
    }
  }

  // 嘗試更寬鬆的匹配
  const looseMatch = html.match(/}\('([^']{100,})',\s*(\d+),\s*(\d+),\s*'([^']+)'/);
  if (looseMatch) {
    // 重建完整的 packed 字符串
    return `function(p,a,c,k,e,d){e=function(c){return(c<a?"":e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('${looseMatch[1]}',${looseMatch[2]},${looseMatch[3]},'${looseMatch[4]}'.split('|'))`;
  }

  return null;
}

/** SMH.reader 格式資料結構 */
interface ReaderFormatData {
  bookId: number;
  bookName: string;
  chapterId: number;
  chapterTitle: string;
  images: string[];
  nextId?: number;
  prevId?: number;
}

/**
 * 將 SMH.reader 格式轉換為 ImageData
 */
function convertReaderFormat(data: ReaderFormatData): ImageData {
  const firstImage = data.images[0] || '';
  const pathParts = firstImage.split('/');
  pathParts.pop();
  const path = pathParts.join('/') + '/';
  const files = data.images.map((img) => img.split('/').pop() || img);

  return {
    bid: data.bookId,
    cid: data.chapterId,
    bname: data.bookName,
    cname: data.chapterTitle,
    path,
    files,
    sl: { e: 0, m: '' },
    prevcid: data.prevId,
    nextcid: data.nextId,
  };
}

/**
 * 從解密後的 JavaScript 中提取圖片資料
 */
export function parseImageData(decrypted: string): ImageData | null {
  // 尋找 SMH.imgData({...}) 或 SMH.reader({...}) 結構
  const patterns = [
    /SMH\.imgData\((\{[\s\S]+?\})\)/,
    /SMH\.reader\((\{[\s\S]+?\})\)/,
    /\{[^{}]*"bid"\s*:\s*\d+[^{}]*"files"\s*:\s*\[[^\]]+\][^{}]*\}/,
    /\{[^{}]*"bookId"\s*:\s*\d+[^{}]*"images"\s*:\s*\[[^\]]+\][^{}]*\}/,
  ];

  for (const pattern of patterns) {
    const match = decrypted.match(pattern);
    if (match) {
      try {
        // 清理 JSON 字符串
        let jsonStr = match[1] || match[0];
        // 處理單引號
        jsonStr = jsonStr.replace(/'/g, '"');
        // 處理沒有引號的 key
        jsonStr = jsonStr.replace(/(\w+):/g, '"$1":');
        // 修復重複引號
        jsonStr = jsonStr.replace(/""+/g, '"');

        const parsed = JSON.parse(jsonStr);

        // 判斷是 reader 格式還是 imgData 格式
        if ('bookId' in parsed && 'images' in parsed) {
          return convertReaderFormat(parsed as ReaderFormatData);
        }

        // imgData 格式
        const imageData = parsed as ImageData;
        if (imageData.prevcid === undefined || imageData.nextcid === undefined) {
          const prevcidMatch = decrypted.match(/prevcid['":\s=]+(\d+)/i);
          const nextcidMatch = decrypted.match(/nextcid['":\s=]+(\d+)/i);
          if (prevcidMatch) imageData.prevcid = parseInt(prevcidMatch[1], 10);
          if (nextcidMatch) imageData.nextcid = parseInt(nextcidMatch[1], 10);
        }

        return imageData;
      } catch {
        // 嘗試另一種解析方式
        continue;
      }
    }
  }

  // 手動提取各個欄位
  const result = extractFieldsManually(decrypted);
  return result;
}

/**
 * 手動提取欄位 (備用方案)
 * 支援 imgData 格式 (bid/cid/files) 和 reader 格式 (bookId/chapterId/images)
 */
function extractFieldsManually(decrypted: string): ImageData | null {
  // imgData 格式欄位
  const bidMatch = decrypted.match(/bid['":\s]+(\d+)/);
  const cidMatch = decrypted.match(/cid['":\s]+(\d+)/);
  const pathMatch = decrypted.match(/path['":\s]+['"]([^'"]+)['"]/);
  const filesMatch = decrypted.match(/files['":\s]+\[([^\]]+)\]/);

  // reader 格式欄位
  const bookIdMatch = decrypted.match(/bookId['":\s]+(\d+)/);
  const chapterIdMatch = decrypted.match(/chapterId['":\s]+(\d+)/);
  const bookNameMatch = decrypted.match(/bookName['":\s]+['"]([^'"]+)['"]/);
  const chapterTitleMatch = decrypted.match(/chapterTitle['":\s]+['"]([^'"]+)['"]/);
  const imagesMatch = decrypted.match(/images['":\s]+\[([^\]]+)\]/);
  const nextIdMatch = decrypted.match(/nextId['":\s]+(\d+)/);
  const prevIdMatch = decrypted.match(/prevId['":\s]+(\d+)/);

  // reader 格式：images 包含完整路徑
  if (bookIdMatch && chapterIdMatch && imagesMatch) {
    const imagesStr = imagesMatch[1];
    const images = imagesStr
      .split(',')
      .map((f) => f.trim().replace(/['"]/g, ''))
      .filter(Boolean);

    // 從第一張圖片路徑提取 path
    const firstImage = images[0] || '';
    const pathParts = firstImage.split('/');
    pathParts.pop(); // 移除檔名
    const path = pathParts.join('/') + '/';

    // 提取檔名
    const files = images.map((img) => img.split('/').pop() || img);

    return {
      bid: parseInt(bookIdMatch[1], 10),
      cid: parseInt(chapterIdMatch[1], 10),
      bname: bookNameMatch?.[1] || '',
      cname: chapterTitleMatch?.[1] || '',
      path,
      files,
      sl: { e: 0, m: '' },
      prevcid: prevIdMatch ? parseInt(prevIdMatch[1], 10) : undefined,
      nextcid: nextIdMatch ? parseInt(nextIdMatch[1], 10) : undefined,
    };
  }

  // imgData 格式
  if (bidMatch && cidMatch && filesMatch && pathMatch) {
    const bnameMatch = decrypted.match(/bname['":\s]+['"]([^'"]+)['"]/);
    const cnameMatch = decrypted.match(/cname['":\s]+['"]([^'"]+)['"]/);
    const slMatch = decrypted.match(/sl['":\s]+\{([^}]+)\}/);
    const prevcidMatch = decrypted.match(/prevcid['":\s=]+(\d+)/i);
    const nextcidMatch = decrypted.match(/nextcid['":\s=]+(\d+)/i);

    const filesStr = filesMatch[1];
    const files = filesStr
      .split(',')
      .map((f) => f.trim().replace(/['"]/g, ''))
      .filter(Boolean);

    const sl = { e: 0, m: '' };
    if (slMatch) {
      const eMatch = slMatch[1].match(/e['":\s]+(\d+)/);
      const mMatch = slMatch[1].match(/m['":\s]+['"]([^'"]+)['"]/);
      if (eMatch) sl.e = parseInt(eMatch[1], 10);
      if (mMatch) sl.m = mMatch[1];
    }

    return {
      bid: parseInt(bidMatch[1], 10),
      cid: parseInt(cidMatch[1], 10),
      bname: bnameMatch?.[1] || '',
      cname: cnameMatch?.[1] || '',
      path: pathMatch[1],
      files,
      sl,
      prevcid: prevcidMatch ? parseInt(prevcidMatch[1], 10) : undefined,
      nextcid: nextcidMatch ? parseInt(nextcidMatch[1], 10) : undefined,
    };
  }

  return null;
}

/**
 * 完整的解密流程：HTML → ImageData
 */
export function decryptChapterPage(html: string): ImageData | null {
  // 檢查是否為錯誤頁面
  if (html.includes('404') && html.includes('找不到')) {
    return null;
  }
  if (html.includes('403') || html.includes('禁止訪問')) {
    return null;
  }

  const packed = extractPackedScript(html);
  if (!packed) {
    return null;
  }

  try {
    const decrypted = unpack(packed);
    return parseImageData(decrypted);
  } catch {
    return null;
  }
}

/**
 * 構建完整的圖片 URL
 */
export function buildImageUrl(
  path: string,
  filename: string,
  sl?: { e: number; m: string }
): string {
  const baseUrl = 'https://i.hamreus.com';
  let url = `${baseUrl}${path}${filename}`;

  if (sl && sl.e && sl.m) {
    url += `?e=${sl.e}&m=${encodeURIComponent(sl.m)}`;
  }

  return url;
}
