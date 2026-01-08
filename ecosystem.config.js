module.exports = {
  apps: [
    {
      name: 'msc-backend-node',
      exec_mode: 'cluster',
      instances: 2,
      script: './app.js',
      args: 'prod'
    }
  ]
}