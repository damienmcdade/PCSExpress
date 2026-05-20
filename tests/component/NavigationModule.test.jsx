/*
 * Component tests for NavigationModule — the multi-tab navigation
 * surface (route planner, saved routes, base map). Guards the
 * regression that emerged after Phase 17's unreachable-code cleanup
 * in generateOnBaseRoute (the function used to mock-generate fake
 * routes; now it correctly tells the user to use public sources).
 *
 * Network calls (Nominatim, OSRM) are stubbed so the test never
 * touches the real internet.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import NavigationModule from '../../src/components/NavigationModule';

const theme = { primary: '#244247', secondary: '#1A3A5C', accent: '#C99A3D' };

beforeEach(() => {
  cleanup();
  try { window.localStorage?.clear?.(); } catch {}
  // Stub fetch so any unexpected geocode / route call returns empty.
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => ([]),
    text: async () => '[]',
    headers: { get: () => 'application/json' },
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NavigationModule', () => {
  it('renders the routes tab by default with the public route planner inputs', () => {
    render(<NavigationModule theme={theme} profile={{}} />);
    // Two text inputs (from / to) — at least these two must exist on the
    // routes tab. We avoid brittle label assertions because copy keeps
    // moving — but the inputs themselves are stable.
    const textInputs = document.querySelectorAll('input[type="text"], input:not([type])');
    expect(textInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('does not pre-populate any saved directions on mount', () => {
    // Regression for the Phase 17 unreachable-code cleanup: the
    // generateOnBaseRoute() path used to fabricate synthetic routes.
    // Mount with an empty profile and confirm nothing was stashed
    // through the security extensions on first render.
    render(<NavigationModule theme={theme} profile={{}} />);
    const stored = window.localStorage?.getItem?.('pcs_saved_directions');
    expect(stored).toBeFalsy();
  });
});
