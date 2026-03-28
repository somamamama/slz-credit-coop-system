/**
 * PM2 Ecosystem Configuration for Credit Cooperative System
 * 
 * This configuration manages all three portals and their backend servers.
 * Deploy this file to your VPS at /var/www/credit-coop/
 * 
 * Usage:
 *   Start all apps:     pm2 start ecosystem.config.js
 *   Stop all apps:      pm2 stop ecosystem.config.js
 *   Restart all apps:   pm2 restart ecosystem.config.js
 *   Monitor:            pm2 monit
 *   View logs:          pm2 logs
 *   Save config:        pm2 save
 *   Auto-start on boot: pm2 startup
 */

module.exports = {
  apps: [
    // Landing Page Server
    {
      name: 'landing-server',
      script: './landing-page/server/index.js',
      cwd: '/var/www/credit-coop',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5002
      },
      error_file: '/var/www/credit-coop/logs/landing-server-error.log',
      out_file: '/var/www/credit-coop/logs/landing-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },

    // Member Portal Server
    {
      name: 'member-server',
      script: './member-portal/server/index.js',
      cwd: '/var/www/credit-coop',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: '/var/www/credit-coop/logs/member-server-error.log',
      out_file: '/var/www/credit-coop/logs/member-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },

    // Staff Portal Server
    {
      name: 'staff-server',
      script: './staff-portal/server/index.js',
      cwd: '/var/www/credit-coop',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/credit-coop/logs/staff-server-error.log',
      out_file: '/var/www/credit-coop/logs/staff-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
