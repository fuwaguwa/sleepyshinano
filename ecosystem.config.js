module.exports = {
  apps: [{
    name: 'your-app-name',
    script: 'bun',
    args: 'run prod',
    env_production: {
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '4G'
  }]
}