import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// Best-effort embed of the current git SHA + a build timestamp so the
// app can display a deployment-version stamp. Falls back to empty
// strings if the build environment doesn't have git (Vercel etc. do).
let _sha = '';
try { _sha = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
const BUILD_SHA = _sha;
const BUILD_TIME = new Date().toISOString();

export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_SHA':  JSON.stringify(BUILD_SHA),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(BUILD_TIME),
  },
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
    // Sourcemaps disabled in prod — they expose full original source
    // (comments, security-helper internals, internal email addresses)
    // to anyone who curls /assets/*.js.map. Use 'hidden' if you ever
    // wire Sentry/Datadog stack-trace decoding out-of-band.
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }
          // Static data tables get their own chunk so updates to
          // the rate tables / checklist data don't bust the main
          // App chunk in the browser cache.
          if (id.includes('/src/data/')) {
            return 'app-data';
          }
        },
      },
    },
    // 750 KB minified covers the index chunk after the recent
    // landing + dashboard branch-theming work. Gzipped delivery is
    // ~170 KB which is well within budget for an SPA of this scope
    // (22 of 26 modules already React.lazy()'d; the remaining eager
    // weight is App.jsx + shell UI that must mount synchronously).
    // Raise to 750 to silence the cosmetic warning while keeping a
    // ceiling that flags future eager-import regressions.
    chunkSizeWarningLimit: 750,
  },
})
