module.exports = {
  apps: [
    {
      name: 'manga-reader',
      script: 'npm',
      args: 'run dev',
      cwd: __dirname,
      env: {
        PORT: 3500,
        USE_VERCEL_API: true
      },
    },
  ],
}
