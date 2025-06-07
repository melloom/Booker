import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://firestore.googleapis.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/analytics'
      ]
    }
  }
}) 