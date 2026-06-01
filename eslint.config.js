/*
 * ESLint flat config for PCS Express.
 *
 * Scope is intentionally narrow:
 *   - JS recommended rules (catch undefined refs, unused vars, etc.)
 *   - react-hooks rules (the TDZ-style bugs that drove the Phase 16/17
 *     hotfixes start as react-hooks/exhaustive-deps violations; the
 *     rules-of-hooks check catches calls outside hooks too).
 *   - Soft disables for stylistic noise we don't want to chase.
 *
 * Vitest globals (describe/it/expect/vi) are enabled for test files.
 */
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/',
      'node_modules/',
      'android/',
      'ios/',
      'build/',
      'coverage/',
      'test-results/',
      // Dated backup directories — kept as point-in-time snapshots while
      // the language-coverage / action-repetition fixes settled. Not
      // production code; should not gate the lint pass.
      'language-action-repetition-backup-*/',
      'language-coverage-backup-*/',
      'icon-backups/',
      'deployment-logs/',
      'build-sync-reports/',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: { react: { version: '19' } },
    rules: {
      // JSX tracks variable usage so React + the named component
      // imports aren't reported as unused. Without these two rules the
      // automatic-JSX-runtime config still triggers no-unused-vars on
      // every imported component referenced only in markup.
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      // Classic react-hooks rules — keep these strict. They catch the
      // real category of bug that drove the Phase 16/17 TDZ hotfixes.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // eslint-plugin-react-hooks v7 added React-Compiler-strict rules
      // (set-state-in-effect, preserve-manual-memoization, etc.) that
      // assume a compiler migration this codebase has not done. They
      // flag patterns that are valid React 18 manual-memoization
      // idioms (useMemo + narrow dep arrays, setState() in an effect
      // for derived-state mirroring). Disable until the codebase
      // migrates to the React Compiler — at which point flip these
      // back to 'warn' or 'error' as the migration's gating signal.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/error-boundaries': 'off',
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-prototype-builtins': 'off',
      'no-useless-escape': 'warn',
      'no-control-regex': 'off',
      'no-constant-binary-expression': 'warn',
    },
  },

  {
    files: ['tests/**/*.{js,jsx,mjs}', '**/*.test.{js,jsx,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },

  {
    files: ['server/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    files: ['public/**/*.js', 'public/**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
];
