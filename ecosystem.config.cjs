module.exports = {
  apps: [{
    name: "Shinano",
    script: "bun",
    args: "run prod",
    env_production: {
      NODE_ENV: "production"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "3G"
  }]
}