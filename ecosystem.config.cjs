module.exports = {
  apps: [
    {
      name: 'janinv2-frontend',
      cwd: './frontend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        API_URL: 'http://127.0.0.1:8000',
      },
    },
    {
      name: 'janinv2-backend',
      cwd: './backend',
      script: 'dist/src/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
    },
  ],
};
