#!/usr/bin/env node
// PostToolUse hook: Write/Edit 後自動格式化被修改的檔案
// 依副檔名選擇對應 linter/formatter，只處理單一檔案

import { existsSync } from 'fs';
import { extname, dirname } from 'path';
import { execSync } from 'child_process';
import os from 'os';

const chunks: Buffer[] = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const filePath: string = input?.tool_input?.file_path ?? '';

  if (!filePath || !existsSync(filePath)) process.exit(0);

  // 跳過 ~/.claude/ 目錄
  const claudeDir = os.homedir() + '/.claude';
  if (filePath.startsWith(claudeDir)) process.exit(0);

  const ext = extname(filePath).replace('.', '');

  // 從檔案位置向上找 git root
  let projRoot = '';
  try {
    projRoot = execSync('git rev-parse --show-toplevel', {
      cwd: dirname(filePath),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {}

  const hasConfig = (...configs: string[]): boolean => {
    if (!projRoot) return false;
    return configs.some(c => existsSync(`${projRoot}/${c}`));
  };

  try {
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        if (hasConfig('eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', '.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml')) {
          execSync(`npx eslint --fix "${filePath}"`, { stdio: 'ignore' });
        }
        break;
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        if (hasConfig('.stylelintrc', '.stylelintrc.js', '.stylelintrc.json', 'stylelint.config.js', 'stylelint.config.mjs')) {
          execSync(`npx stylelint --fix "${filePath}"`, { stdio: 'ignore' });
        }
        break;
      case 'py':
        execSync(`uvx ruff format "${filePath}"`, { stdio: 'ignore' });
        execSync(`uvx ruff check --fix "${filePath}"`, { stdio: 'ignore' });
        break;
      case 'md':
        if (hasConfig('.prettierrc', '.prettierrc.js', '.prettierrc.json', '.prettierrc.yml', 'prettier.config.js', 'prettier.config.mjs')) {
          execSync(`npx prettier --write "${filePath}"`, { stdio: 'ignore' });
        }
        if (hasConfig('.markdownlint.json', '.markdownlint.jsonc', '.markdownlint.yml', '.markdownlint-cli2.jsonc')) {
          execSync(`npx markdownlint-cli2 --fix "${filePath}"`, { stdio: 'ignore' });
        }
        break;
      case 'sql':
        execSync(`npx sql-formatter -l postgresql -u "${filePath}"`, { stdio: 'ignore' });
        break;
    }
  } catch {}

  process.exit(0);
});
