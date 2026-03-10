#!/usr/bin/env node
// PreToolUse hook (Bash): 指令安全檢查
// 1. rm → 建議用 trash（~/.claude/ 快取除外）
// 2. run_in_background + 驗證指令 → 攔截（禁併發驗證）
// 3. 禁併發 build/test

import { execSync } from 'child_process';

const chunks: Buffer[] = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const command: string = input?.tool_input?.command ?? '';
  const bg: boolean = input?.tool_input?.run_in_background ?? false;

  // Guard 1: rm → trash
  if (/^\s*rm\s/.test(command)) {
    // 允許 rm -rf ~/.claude/*（CLAUDE.md 明確例外）
    if (/rm\s+-rf\s+~\/\.claude\//.test(command)) {
      process.exit(0);
    }
    console.log(JSON.stringify({
      decision: 'block',
      reason: '刪檔用 trash 禁 rm（CLAUDE.md 規範）。例外：rm -rf ~/.claude/* 快取清理'
    }));
    process.exit(0);
  }

  // Guard 2: 禁 background 驗證
  if (bg === true) {
    if (/\b(test|build|typecheck|tsc|lint|eslint|jest|vitest|pytest|swift test|xcodebuild test)\b/i.test(command)) {
      console.log(JSON.stringify({
        decision: 'block',
        reason: '禁止 run_in_background 執行驗證指令（CLAUDE.md：Test/Build 禁止併發）'
      }));
      process.exit(0);
    }
  }

  // Guard 3: 禁併發 build/test（偵測已在執行的 process）
  if (/\b(xcodebuild|swift build|swift test|swift package)\b/.test(command)) {
    try {
      execSync('pgrep -qf "xcodebuild|swift-build|swift-test|swift-frontend"', { stdio: 'ignore' });
      // pgrep 成功表示有 process 在跑
      console.log(JSON.stringify({
        decision: 'block',
        reason: '已有 build/test 在執行中，禁止併發（CLAUDE.md：Test/Build 禁止併發）。請等前一個完成再試。'
      }));
    } catch {
      // pgrep 找不到 process → 允許
    }
  }

  process.exit(0);
});
