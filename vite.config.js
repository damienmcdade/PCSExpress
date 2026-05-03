import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Single bundle — no code splitting prevents ES module cross-chunk
    // import failures in Capacitor's WKWebView custom URL scheme
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        manualChunks: undefined,
      }
    }
  }
})
