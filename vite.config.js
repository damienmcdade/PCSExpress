import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Capacitor's WKWebView custom scheme (capacitor://localhost) has issues with
// type="module" crossorigin scripts. Strip those attributes so the script loads
// as a classic script. The IIFE output format ensures all code is self-contained.
function capacitorHtmlFix() {
  return {
    name: 'capacitor-html-fix',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin/g, '<script defer')
        .replace(/<link rel="modulepreload" crossorigin/g, '<link rel="preload" as="script"')
        .replace(/ crossorigin(?=[ >])/g, '')
        // Ensure IIFE classic scripts in <head> also get defer so they wait for DOM
        .replace(/<script src="\.\/assets\//g, '<script defer src="./assets/')
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), capacitorHtmlFix()],
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
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  }
})
