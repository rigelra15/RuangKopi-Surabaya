import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Exclude api folder from being processed by Vite
    // These are Vercel serverless functions, not client-side code
    watch: {
      ignored: ['**/api/**'],
    },
  },
  build: {
    // Exclude api folder from build
    rollupOptions: {
      external: ['@vercel/node'],
    },
  },
})
