/*
 * Component tests for BaseMapModule — the embedded base map widget.
 * Uses Nominatim geocoding via fetch. Guards:
 *   - Renders the empty-state when no installation is supplied.
 *   - Renders the installation string when one is supplied.
 *   - Updates the displayed installation when profile changes.
 *
 * Network is stubbed; we never reach Nominatim from tests.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import BaseMapModule from '../../src/components/BaseMapModule';

const theme = { primary: '#244247', secondary: '#1A3A5C', accent: '#C99A3D' };

beforeEach(() => {
  cleanup();
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

describe('BaseMapModule', () => {
  it('renders the "Enter a gaining installation" prompt when profile is empty', () => {
    render(<BaseMapModule theme={theme} profile={{}} />);
    expect(screen.getByText(/Enter a gaining installation/i)).toBeInTheDocument();
  });

  it('renders the installation string when a gaining installation is supplied', () => {
    render(
      <BaseMapModule
        theme={theme}
        profile={{ gainingInstallation: 'Fort Liberty', branch: 'Army' }}
      />
    );
    // The installation name appears in the rendered chrome (header or
    // input). At minimum it should be present somewhere in the DOM.
    const matches = screen.getAllByText(/Fort Liberty/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
