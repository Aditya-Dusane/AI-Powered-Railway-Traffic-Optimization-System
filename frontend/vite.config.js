import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],

  // Always resolve from this file's directory (frontend/)
  // so `vite build --config frontend/vite.config.js` works from the project root
  root: __dirname,

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },

  // Dev-only proxy — ignored during `vite build`
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
