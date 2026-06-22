import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// This config is used both locally (run from frontend/) and on Railway/Render
// (run from project root via: vite build --config frontend/vite.config.js).
// All paths are resolved relative to this file's directory (frontend/) so they
// work correctly regardless of the working directory.
export default defineConfig({
  plugins: [react()],

  // Root is the frontend directory (where index.html lives)
  root: __dirname,

  // Output goes to frontend/dist — Express serves this in production
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },

  // Dev-only proxy — has no effect in production builds
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
