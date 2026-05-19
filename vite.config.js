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
    // Source maps emitted alongside the minified bundle so production
    // TDZ / runtime errors can be traced to the original source file
    // and line. The map is a separate .js.map artifact; the main JS
    // is still minified the same way.
    sourcemap: true,
  },
})
