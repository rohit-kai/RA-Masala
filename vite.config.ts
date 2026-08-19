import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base URL for built assets. Default '/' works on Vercel & custom domains.
// For GitHub Pages (sub-path hosting) build with: VITE_BASE=/RA-Masala/ npm run build
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
