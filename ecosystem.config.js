module.exports = {
  apps: [
    {
      name: 'asset-management',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/asset-management',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: '/var/log/pm2/asset-management.log',
      out_file: '/var/log/pm2/asset-management-out.log',
      error_file: '/var/log/pm2/asset-management-error.log',
      time: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    }
  ]
};