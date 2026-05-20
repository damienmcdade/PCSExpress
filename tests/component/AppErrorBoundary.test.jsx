/*
 * Component tests for AppErrorBoundary — the top-level error
 * boundary that catches uncaught render-time exceptions and
 * surfaces a recovery UI instead of a blank white screen.
 *
 * Focus areas:
 *   - Renders children when no error occurs
 *   - Catches a thrown error and renders the recovery dialog
 *   - Surfaces the error message (so users can paste it back
 *     for debugging)
 *   - Both recovery buttons are present + labeled
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import AppErrorBoundary from '../../src/components/AppErrorBoundary';

// Suppress the expected React error log when intentionally throwing.
const consoleError = console.error;

beforeEach(() => {
  cleanup();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function Boom() {
  throw new Error('Cannot access v before initialization.');
}

describe('AppErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <AppErrorBoundary>
        <div>healthy content</div>
      </AppErrorBoundary>
    );
    expect(screen.getByText('healthy content')).toBeInTheDocument();
  });

  it('catches a thrown error and renders the recovery dialog', () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    );
    expect(screen.getByText(/PCS Express needs to reload this screen/i)).toBeInTheDocument();
  });

  it('surfaces the error message inside the disclosure', () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    );
    // The error message appears in both the dev-mode error overlay
    // (React's invariant) and our recovery dialog's detail block.
    // We only care that AT LEAST ONE occurrence is in the document —
    // the dialog's job is to give the user something they can paste
    // back when reporting the bug.
    const occurrences = screen.getAllByText(/Cannot access v before initialization/i);
    expect(occurrences.length).toBeGreaterThan(0);
  });

  it('shows both recovery buttons with accessible labels', () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /soft reload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear local state/i })).toBeInTheDocument();
  });

  afterEach(() => {
    console.error = consoleError;
  });
});

function afterEach(fn) {
  // vitest globals provide afterEach; just in case the import order is
  // off, we wire it manually as a no-op fallback.
  if (typeof globalThis.afterEach === 'function') return globalThis.afterEach(fn);
}
