import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Dev server: proxy API calls to avoid CORS issues during development
  server: {
    port: 5173,
    proxy: {
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/process': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/history': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  // Production build settings
  build: {
    outDir: 'dist',
    sourcemap: false,         // Disable source maps in production (security)
    minify: 'esbuild',
  },
})
