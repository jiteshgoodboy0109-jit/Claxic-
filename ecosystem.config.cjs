// PM2 Ecosystem File for Claxic Self-Hosting
// Usage:
//   npm run build:prod
//   pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup

module.exports = {
  apps: [
    {
      name: 'claxic-platform',
      script: './backend/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        SERVE_FRONTEND: 'true',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
        SERVE_FRONTEND: 'false',
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
    },
  ],
};
