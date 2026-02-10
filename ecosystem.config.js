module.exports = {
  apps: [
    {
      name: "shadcn-app-turbo",
      script: "npm",
      args: "run dev:turbo", // Memanggil script yang ada di package.json
      cwd: "./",             // Pastikan berjalan di root project
      instances: 1,
      autorestart: true,
      watch: false,          // Set ke true jika ingin PM2 me-restart saat file berubah
      max_memory_restart: '1G',
      env: {
        NODE_ENV: "development",
        PORT: 3000
      }
    }
  ]
};
