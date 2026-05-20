/*
 * Vitest configuration for React component tests. Pairs with the
 * node:test runner that already drives unit tests under
 * tests/unit/. Vitest covers the cases that need a DOM (jsdom) +
 * @testing-library/react.
 *
 *   npm run test           → node:test unit tests
 *   npm run test:component → vitest component tests
 *   npm run test:all       → both, in series
 *
 * Coverage focus: security-critical flows (AI assistant fallback,
 * command palette keyboard nav, modal focus traps). Not every
 * component — Vitest is the right tool for behavioural regressions,
 * not pixel snapshots.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/component/**/*.test.{js,jsx,mjs}'],
    setupFiles: ['./tests/component/setup.js'],
  },
});
