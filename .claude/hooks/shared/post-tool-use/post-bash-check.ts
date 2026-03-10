#!/usr/bin/env node
// PostToolUse hook (Bash): 執行後檢查
// 1. mv/git mv → 提醒更新引用
// 2. 驗證指令執行後清除 needs-verify 標記

import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const chunks: Buffer[] = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const command: string = input?.tool_input?.command ?? '';
  const sessionId: string = input?.session_id ?? '';

  // Check 1: rename/move 提醒搜尋更新引用
  if (/^\s*(mv|git mv)\s/.test(command)) {
    console.log('⚠️ rename/move 後記得搜尋更新所有引用（CLAUDE.md/.claude/CLAUDE.md 規範）');
  }

  // Check 2: 驗證指令執行 → 清除 needs-verify 標記
  if (sessionId && /\b(lint|typecheck|tsc|build|test|jest|vitest|pytest|swift test|xcodebuild)\b/i.test(command)) {
    const flagFile = join(tmpdir(), `claude-${sessionId}-needs-verify`);
    try {
      if (existsSync(flagFile)) unlinkSync(flagFile);
    } catch {}
  }

  process.exit(0);
});
