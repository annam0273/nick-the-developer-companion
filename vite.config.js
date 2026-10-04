import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        'content': resolve(__dirname, 'src/content/content.jsx'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.js'),
        'offscreen': resolve(__dirname, 'src/background/offscreen.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
