#!/usr/bin/env node
// Stop hook: session 結束前檢查是否跑過驗證
// 若有 Write/Edit 但未執行任何驗證指令，提醒

import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const chunks: Buffer[] = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const sessionId: string = input?.session_id ?? '';

  if (sessionId) {
    const flagFile = join(tmpdir(), `claude-${sessionId}-needs-verify`);
    if (existsSync(flagFile)) {
      try { unlinkSync(flagFile); } catch {}
      console.log('⚠️ 本次 session 有程式碼變更但未執行驗證（lint/typecheck/build/test）。建議先驗證再結束。');
    }
  }

  process.exit(0);
});
