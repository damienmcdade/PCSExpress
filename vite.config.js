import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Best-effort embed of the current git SHA + a build timestamp so the
// app can display a deployment-version stamp. Prefer Vercel's injected
// env var (no .git in the build sandbox); fall back to local git.
let _sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7);
if (!_sha) {
  try { _sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
}
const BUILD_SHA = _sha;
const BUILD_TIME = new Date().toISOString();

// Stamp the service worker's CACHE_VERSION with the build SHA after each
// build so every deploy automatically evicts the prior SW caches — no more
// manual `pcs-vN` bumps (which previously had to be remembered per release).
// Falls back silently to the in-file version when no SHA is available.
function stampServiceWorkerVersion() {
  return {
    name: 'stamp-sw-cache-version',
    apply: 'build',
    closeBundle() {
      if (!BUILD_SHA) return;
      const swPath = path.resolve('dist/pcs-sw.js');
      try {
        const src = fs.readFileSync(swPath, 'utf8');
        const next = src.replace(/const CACHE_VERSION = '[^']*'/, `const CACHE_VERSION = 'pcs-${BUILD_SHA}'`);
        if (next !== src) fs.writeFileSync(swPath, next);
      } catch { /* SW absent — nothing to stamp */ }
    },
  };
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_SHA':  JSON.stringify(BUILD_SHA),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(BUILD_TIME),
  },
  plugins: [react(), stampServiceWorkerVersion()],
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
          // The three biggest data tables are loaded dynamically by
          // src/data/lazyHeavy.js so the browser can defer their
          // download past first paint. Keep them in their own chunk
          // so they don't get pulled into eager modulepreload hints
          // via the smaller eager data files.
          if (
            id.includes('/src/data/branchChecklists') ||
            id.includes('/src/data/militaryDutyStations') ||
            id.includes('/src/data/installationSchools')
          ) {
            return 'app-data-lazy';
          }
          // Smaller data tables (vet biz cities, DoD civilian
          // checklist, installation markets) stay eager — they're
          // referenced by helper functions at module-top level.
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
