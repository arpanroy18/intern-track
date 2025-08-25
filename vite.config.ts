import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@cerebras/cerebras_cloud_sdk']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}) 