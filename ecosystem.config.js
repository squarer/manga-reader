module.exports = {
  apps: [
    {
      name: 'manga-reader',
      script: 'npm',
      args: 'run dev',
      cwd: __dirname,
      env: {
        PORT: process.env.PORT || 3500,
      },
    },
  ],
}
