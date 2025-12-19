const fs = require('fs');
const path = require('path');

/** 從 .env.local 讀取環境變數 */
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return {};

  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key) env[key] = rest.join('=');
  });
  return env;
}

module.exports = {
  apps: [
    {
      name: 'manga-reader',
      script: 'npm',
      args: 'run dev',
      cwd: __dirname,
      env: loadEnvFile(),
    },
  ],
};
