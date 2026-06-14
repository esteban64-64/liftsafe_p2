import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['..', path.resolve(__dirname, '../.cursor')],
    },
    proxy: {
      '/auth': 'http://localhost:8000',
      '/vistas': 'http://localhost:8000',
      '/dashboard': 'http://localhost:8000',
    },
  },
})
