import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Capacitor WKWebView fix:
// 1. Remove type="module" and crossorigin (WKWebView's custom scheme blocks them)
// 2. Move all bundle scripts from wherever Vite injects them to end of <body>
//    so the DOM is always ready when they execute — most reliable across all
//    WKWebView versions without relying on `defer` support for custom schemes.
function capacitorHtmlFix() {
  return {
    name: 'capacitor-html-fix',
    transformIndexHtml(html) {
      // Strip module type, crossorigin, and modulepreload hints
      html = html
        .replace(/ type="module"/g, '')
        .replace(/ crossorigin(?=[ >])/g, '')
        .replace(/<link rel="modulepreload"[^>]*>\n?/g, '')

      // Pull every assets bundle script out of wherever Vite put it
      const scriptTags = []
      html = html.replace(/<script[^>]+src="\.\/assets\/[^"]+\.js"[^>]*><\/script>/g, (match) => {
        scriptTags.push(match)
        return ''
      })

      // Re-inject at end of body so DOM is always parsed first
      if (scriptTags.length > 0) {
        html = html.replace('</body>', `  ${scriptTags.join('\n  ')}\n</body>`)
      }

      return html
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), capacitorHtmlFix()],
  server: {
    // Development server on port 3000
    port: 3000,
    host: '0.0.0.0',
    // Proxy /api requests to Express backend running on 3001
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
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  }
})
