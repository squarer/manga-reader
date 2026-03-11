#!/usr/bin/env node
// PostToolUse hook (Write|Edit): 寫入後品質檢查
// 1. 檔案超 800 行警告
// 2. 非測試檔含 mock data 警告
// 3. 標記 session 需要驗證

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const chunks: Buffer[] = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const filePath: string = input?.tool_input?.file_path ?? '';
  const sessionId: string = input?.session_id ?? '';

  if (!filePath || !existsSync(filePath)) process.exit(0);

  const messages: string[] = [];

  // Check 1: 檔案超 800 行
  try {
    const lines = readFileSync(filePath, 'utf8').split('\n').length;
    if (lines > 800) {
      messages.push(`⚠️ ${filePath} 已達 ${lines} 行，超過 800 行上限。應拆分檔案。`);
    }
  } catch {}

  // Check 2: 非測試檔含 mock/dummy/faker
  if (!/(\btest\b|\bspec\b|\bmock\b|\bfixture\b|\bseed\b|__tests__|__mocks__)/i.test(filePath)) {
    try {
      const content = readFileSync(filePath, 'utf8');
      if (/\b(mockData|dummyData|faker\.|seedData|testData)\b/.test(content)) {
        messages.push(`⚠️ ${filePath} 疑似含 mock data（非測試檔禁 mock data）`);
      }
    } catch {}
  }

  // Check 3: 標記需要驗證（供 Stop hook 檢查）
  if (sessionId) {
    try {
      writeFileSync(join(tmpdir(), `claude-${sessionId}-needs-verify`), '');
    } catch {}
  }

  if (messages.length > 0) {
    console.log(messages.join('\n'));
  }

  process.exit(0);
});
