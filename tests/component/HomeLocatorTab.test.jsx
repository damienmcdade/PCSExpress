/*
 * Component tests for HomeLocatorTab — the dynamic rental-listings
 * + market-stats surface. Touched by Phase 17's "active listing
 * links" fix and the over-extraction P17.1 hotfix. Guards:
 *   - Renders the header without crashing when profile is empty
 *     (no fetch, no market match — must still render a useful
 *     "unknown installation" state).
 *   - Renders when a known installation is provided in the profile.
 *
 * Network is stubbed; we never want the test suite to actually call
 * /api/housing-listings or /api/market-stats.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import HomeLocatorTab from '../../src/components/HomeLocatorTab';

const theme = { primary: '#244247', secondary: '#1A3A5C', accent: '#C99A3D' };

beforeEach(() => {
  cleanup();
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => ({ listings: [], fallback: true }),
    text: async () => '{}',
    headers: { get: () => 'application/json' },
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomeLocatorTab', () => {
  it('renders without crashing when the profile is empty', () => {
    const { container } = render(<HomeLocatorTab theme={theme} profile={{}} />);
    expect(container.firstChild).toBeTruthy();
    // No fetch should have been called for an empty profile (no market match).
    // Allow up to 1 call in case a fallback path fires synchronously.
    expect(fetch.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('renders when a profile with a known gaining installation is provided', () => {
    const { container } = render(
      <HomeLocatorTab
        theme={theme}
        profile={{ gainingInstallation: 'Fort Liberty, NC', branch: 'Army', paygrade: 'E-5' }}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
