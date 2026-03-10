#!/usr/bin/env node
// PostToolUse hook (Write|Edit): 語言特定 lint 規則自動偵測
// Top 10 高頻違反規則，依檔案類型觸發

import { existsSync, readFileSync } from 'fs';
import { extname, basename } from 'path';

const chunks: Buffer[] = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const filePath: string = input?.tool_input?.file_path ?? '';

  if (!filePath || !existsSync(filePath)) process.exit(0);

  const messages: string[] = [];
  const ext = extname(filePath).replace('.', '');
  const base = basename(filePath);

  let content = '';
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    process.exit(0);
  }

  // ─── Check 1: JSDoc/Docstring 缺失 ───
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
    if (/^\s*export\s+(function|class|const)\s/m.test(content)) {
      if (!content.includes('/**')) {
        messages.push(`⚠️ ${filePath} 有 export 但無任何 JSDoc 註解`);
      }
    }
  } else if (ext === 'py') {
    if (/^\s*(def |class )/m.test(content)) {
      if (!content.includes('"""') && !content.includes("'''")) {
        messages.push(`⚠️ ${filePath} 有 def/class 但無任何 docstring`);
      }
    }
  } else if (ext === 'swift') {
    if (/^\s*(func |class |struct |protocol )/m.test(content)) {
      if (!content.includes('///') && !content.includes('/**')) {
        messages.push(`⚠️ ${filePath} 有 func/class 但無任何 doc comment`);
      }
    }
  } else if (ext === 'kt') {
    if (/^\s*(fun |class |interface )/m.test(content)) {
      if (!content.includes('/**')) {
        messages.push(`⚠️ ${filePath} 有 fun/class 但無任何 KDoc`);
      }
    }
  }

  // ─── Check 2: 禁深層相對路徑 ../../.. ───
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
    if (/from ['"]\.\.\/\.\.\/\.\./.test(content)) {
      messages.push(`⚠️ ${filePath} 含深層相對路徑 (../../..)，應使用 path alias（typescript rule）`);
    }
  }

  // ─── Check 3: Dockerfile FROM 禁 :latest 或無 tag ───
  if (/^Dockerfile/i.test(base)) {
    if (/^FROM\s+\S+:latest\b/m.test(content)) {
      messages.push(`⚠️ ${filePath} FROM 使用 :latest tag（docker rule: 指定版本）`);
    } else {
      const fromLines = content.split('\n').filter(l => /^FROM\s+/.test(l));
      const noTagLines = fromLines.filter(l => !/:/.test(l));
      if (noTagLines.length > 0) {
        messages.push(`⚠️ ${filePath} FROM 未指定版本 tag（docker rule: 指定版本）`);
      }
    }
  }

  // ─── Check 4: UI Component 禁直接 fetch ───
  if (['tsx', 'jsx'].includes(ext)) {
    if (/(components|views|pages|app)\//i.test(filePath)) {
      if (/\bfetch\s*\(/.test(content)) {
        if (!/(api|hook|util|service|lib)\//i.test(filePath)) {
          messages.push(`⚠️ ${filePath} UI 元件內直接 fetch()，應透過 API 層（ui-tsx rule）`);
        }
      }
    }
  }

  // ─── Check 5: useEffect 內禁 fetch ───
  if (['tsx', 'jsx'].includes(ext)) {
    if (/useEffect\s*\(\s*(async\s*)?\(\)\s*=>/.test(content) && /\bfetch\s*\(/.test(content)) {
      messages.push(`⚠️ ${filePath} 疑似 useEffect 內 fetch()，應用 TanStack Query/SWR（ui-tsx rule）`);
    }
  }

  // ─── Check 6: 限制 emoji（僅 ✅❌🚨⚠ 允許）───
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'swift', 'kt', 'java', 'go', 'rs'].includes(ext)) {
    const allowedCodepoints = new Set([0x2705, 0x274C, 0x1F6A8, 0x26A0]);
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu;
    let match;
    let hasDisallowed = false;
    while ((match = emojiRegex.exec(content)) !== null) {
      const cp = match[0].codePointAt(0) ?? 0;
      if (!allowedCodepoints.has(cp)) {
        hasDisallowed = true;
        break;
      }
    }
    if (hasDisallowed) {
      messages.push(`⚠️ ${filePath} 含裝飾性 emoji，僅允許 ✅❌🚨⚠️`);
    }
  }

  // ─── Check 7: Fail-Fast 禁 catch { return defaultValue } ───
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
    if (/catch\s*\(/.test(content) && /return\s+(null|undefined|\[\]|\{\}|""|''|0|false|NaN)\s*;/.test(content)) {
      messages.push(`⚠️ ${filePath} 偵測到 catch + return default value（Fail-Fast: 禁 catch return defaultValue）`);
    }
  } else if (ext === 'py') {
    if (/^\s*except/m.test(content) && /^\s*return\s+(None|\[\]|\{\}|""|0|False)\s*$/m.test(content)) {
      messages.push(`⚠️ ${filePath} 偵測到 except + return default value（Fail-Fast: 禁 catch return defaultValue）`);
    }
  }

  // ─── Check 8: .gitignore 必含 .env 等 ───
  if (base === '.gitignore') {
    const required = ['.env', '.env.local', '.env.production'];
    const missing = required.filter(p => !content.includes(p));
    if (missing.length > 0) {
      messages.push(`⚠️ ${filePath} .gitignore 缺少: ${missing.join(' ')}`);
    }
  }

  // ─── Check 9: SQL ADD COLUMN NOT NULL 缺 DEFAULT ───
  if (ext === 'sql') {
    if (/ADD\s+(COLUMN\s+)?\w+.*NOT\s+NULL/i.test(content) && !/ADD\s+(COLUMN\s+)?\w+.*DEFAULT/i.test(content)) {
      messages.push(`⚠️ ${filePath} ADD COLUMN NOT NULL 缺少 DEFAULT（sql rule: 新增欄位必須有預設值）`);
    }
  }

  // ─── Check 10: Swift 檔名禁縮寫 VC/VM/Coord ───
  if (ext === 'swift') {
    if (/(VC|VM|Coord)\b/.test(base)) {
      messages.push(`⚠️ ${filePath} Swift 檔名使用縮寫（VC/VM/Coord），應使用完整名稱（swift rule）`);
    }
  }

  if (messages.length > 0) {
    console.log(messages.join('\n'));
  }

  process.exit(0);
});
