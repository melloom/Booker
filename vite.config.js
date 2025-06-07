import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  
  return {
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
      sourcemap: !isProduction,
      minify: isProduction,
      rollupOptions: {
        external: [
          'firebase/app',
          'firebase/auth',
          'firebase/firestore',
          'firebase/analytics'
        ]
      }
    },
    define: {
      __DEV__: !isProduction,
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  }
}) 