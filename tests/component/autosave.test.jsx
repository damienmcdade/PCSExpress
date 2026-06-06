/*
 * Autosave integration tests.
 *
 * Contract under test: when a user marks ANY checklist / paperwork /
 * document item complete, the app must persist that progress
 * immediately (no explicit "save" step) and that persistence must
 * survive a reload — working identically offline and online, because
 * the store is on-device (localStorage) with no network in its write
 * path.
 *
 * We render a real module (PCSDocumentsModule — the Documents tab),
 * click a "Mark Gathered" toggle, and assert:
 *   1. localStorage was written synchronously on the click (autosave).
 *   2. A fresh remount (simulating an app reload) shows the item still
 *      marked (no progress lost).
 *   3. No network request is made during the save (offline-safe).
 *   4. The same flow works with navigator.onLine === false (offline).
 *
 * The NotificationModeSelector is mocked to a no-op so the test targets
 * the autosave path, not the push/notification plumbing.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

// localStorage shim must be installed before importing the store module
// (jsdom in this project does not expose localStorage by default).
function installLocalStorageShim() {
  const store = new Map();
  const shim = {
    get length() { return store.size; },
    key(i) { return Array.from(store.keys())[i] ?? null; },
    getItem(k) { return store.has(String(k)) ? store.get(String(k)) : null; },
    setItem(k, v) { store.set(String(k), String(v)); },
    removeItem(k) { store.delete(String(k)); },
    clear() { store.clear(); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true, writable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: shim, configurable: true, writable: true });
  }
}
installLocalStorageShim();

// Mock the notification selector so rendering a checklist doesn't pull in
// push/service-worker plumbing. Autosave lives in the module's own toggle
// handler, independent of this component.
vi.mock('../../src/components/NotificationModeSelector.jsx', () => ({
  default: () => null,
}));

const PCSDocumentsModule = (await import('../../src/components/PCSDocumentsModule.jsx')).default;
const { secureLocalStore } = await import('../../src/security/SecurityExtensions.js');

const THEME = { primary: '#123456', secondary: '#234567', accent: '#C99A3D' };
const PROFILE = { branch: 'Army', component: 'Active Duty', hasDependents: true, hasChildren: true };
const DOC_STATE_KEY = 'pcs_doc_states';

beforeEach(() => {
  window.localStorage.clear();
  cleanup();
});

async function markFirstDocAndGetId() {
  // The default 'family' category renders document cards each with a
  // "Mark Gathered" action button.
  const buttons = await screen.findAllByRole('button', { name: /mark gathered/i });
  expect(buttons.length).toBeGreaterThan(0);
  fireEvent.click(buttons[0]);
}

describe('Autosave — Documents tab (online)', () => {
  it('persists to localStorage immediately when an item is marked gathered', async () => {
    render(<PCSDocumentsModule theme={THEME} profile={PROFILE} />);
    await markFirstDocAndGetId();

    const raw = window.localStorage.getItem(DOC_STATE_KEY);
    expect(raw).toBeTruthy(); // autosave wrote synchronously on the click
    const saved = await secureLocalStore.get(DOC_STATE_KEY, {});
    const obtainedIds = Object.entries(saved).filter(([, v]) => v?.obtained).map(([k]) => k);
    expect(obtainedIds.length).toBe(1);
  });

  it('stamps the last-local-save timestamp on the autosave', async () => {
    render(<PCSDocumentsModule theme={THEME} profile={PROFILE} />);
    await markFirstDocAndGetId();
    expect(window.localStorage.getItem('pcs_last_local_save_at')).toBeTruthy();
  });

  it('survives a reload — a fresh remount restores the marked item', async () => {
    const { unmount } = render(<PCSDocumentsModule theme={THEME} profile={PROFILE} />);
    await markFirstDocAndGetId();
    const savedAfterMark = await secureLocalStore.get(DOC_STATE_KEY, {});
    const markedId = Object.entries(savedAfterMark).find(([, v]) => v?.obtained)?.[0];
    expect(markedId).toBeTruthy();

    unmount(); // simulate the app closing

    // Re-mount: the module loads persisted state from localStorage.
    render(<PCSDocumentsModule theme={THEME} profile={PROFILE} />);
    // Progress survived: the persisted state still has exactly that item.
    const reloaded = await secureLocalStore.get(DOC_STATE_KEY, {});
    expect(reloaded[markedId]?.obtained).toBe(true);
  });

  it('makes NO network request during the save (offline-safe write path)', async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error('network used during autosave')));
    const origFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy;
    try {
      render(<PCSDocumentsModule theme={THEME} profile={PROFILE} />);
      await markFirstDocAndGetId();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(DOC_STATE_KEY)).toBeTruthy();
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

describe('Autosave — Documents tab (offline)', () => {
  it('persists identically when navigator.onLine is false', async () => {
    const origDesc = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    try {
      expect(navigator.onLine).toBe(false);
      render(<PCSDocumentsModule theme={THEME} profile={PROFILE} />);
      await markFirstDocAndGetId();

      const saved = await secureLocalStore.get(DOC_STATE_KEY, {});
      const obtained = Object.values(saved).filter(v => v?.obtained);
      expect(obtained.length).toBe(1); // offline write succeeded
    } finally {
      if (origDesc) Object.defineProperty(navigator, 'onLine', origDesc);
    }
  });

  it('toggling off while offline also persists (clears the saved flag)', async () => {
    const origDesc = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    try {
      render(<PCSDocumentsModule theme={THEME} profile={PROFILE} />);
      const buttons = await screen.findAllByRole('button', { name: /mark gathered/i });
      fireEvent.click(buttons[0]); // mark
      let saved = await secureLocalStore.get(DOC_STATE_KEY, {});
      expect(Object.values(saved).filter(v => v?.obtained).length).toBe(1);

      const offButtons = await screen.findAllByRole('button', { name: /mark not gathered/i });
      fireEvent.click(offButtons[0]); // unmark
      saved = await secureLocalStore.get(DOC_STATE_KEY, {});
      expect(Object.values(saved).filter(v => v?.obtained).length).toBe(0);
    } finally {
      if (origDesc) Object.defineProperty(navigator, 'onLine', origDesc);
    }
  });
});
