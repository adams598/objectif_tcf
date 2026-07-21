/** PM2 — Hostinger VPS
 *  Usage : pm2 start ecosystem.config.js
 *  Doc   : docs/deploiement-hostinger.md
 */
module.exports = {
  apps: [
    {
      name: "objectif-tcf",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
