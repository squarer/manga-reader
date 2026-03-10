#!/usr/bin/env node
// PostToolUse hook: 套件管理檔變更後自動安裝/驗證
// 依檔名偵測套件管理器，在檔案所在目錄執行對應指令

import { existsSync } from 'fs';
import { basename, dirname } from 'path';
import { execSync } from 'child_process';

const chunks: Buffer[] = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const filePath: string = input?.tool_input?.file_path ?? '';

  if (!filePath) process.exit(0);

  const base = basename(filePath);
  const dir = dirname(filePath);

  try {
    switch (base) {
      case 'package.json':
        if (existsSync(`${dir}/pnpm-lock.yaml`)) {
          try {
            execSync('pnpm install --frozen-lockfile', { cwd: dir, stdio: 'ignore' });
          } catch {
            execSync('pnpm install', { cwd: dir, stdio: 'ignore' });
          }
        } else if (existsSync(`${dir}/package-lock.json`)) {
          execSync('npm install', { cwd: dir, stdio: 'ignore' });
        }
        break;
      case 'Package.swift':
        execSync('swift build', { cwd: dir, stdio: 'ignore' });
        break;
      case 'Project.swift':
        execSync('tuist generate', { cwd: dir, stdio: 'ignore' });
        break;
    }
  } catch {}

  process.exit(0);
});
