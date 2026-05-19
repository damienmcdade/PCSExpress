import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Source maps emitted alongside the minified bundle so production
    // TDZ / runtime errors can be traced to the original source file
    // and line. The map is a separate .js.map artifact; the main JS
    // is still minified the same way.
    sourcemap: true,
  },
})
