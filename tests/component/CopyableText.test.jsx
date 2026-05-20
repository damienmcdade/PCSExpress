/*
 * Component tests for CopyableText — the single-tap clipboard
 * affordance used across calculators and the shipment tracker.
 *
 * Focus areas:
 *   - Renders children verbatim and exposes an accessible label.
 *   - On click, writes the explicit `value` prop (not the children
 *     contents) to navigator.clipboard.writeText.
 *   - Surfaces the ✓ Copied indicator after a successful copy.
 *
 * The execCommand fallback path is not tested here — jsdom does not
 * implement document.execCommand and the path is for legacy WebViews
 * where Capacitor's Clipboard permission is deferred.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CopyableText from '../../src/components/CopyableText';

beforeEach(() => cleanup());

describe('CopyableText', () => {
  let originalClipboard;

  beforeEach(() => {
    originalClipboard = navigator.clipboard;
  });

  afterEach(() => {
    if (originalClipboard === undefined) {
      delete navigator.clipboard;
    } else {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
        writable: true,
      });
    }
  });

  it('renders the children and exposes a tap-to-copy aria-label', () => {
    render(<CopyableText value="ABC-123">ABC-123</CopyableText>);
    const btn = screen.getByRole('button', { name: /copy abc-123/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('ABC-123');
  });

  it('writes the explicit value to the clipboard on click and shows the ✓ Copied indicator', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    render(<CopyableText value="GBL-9988-001">Tracking number</CopyableText>);
    fireEvent.click(screen.getByRole('button'));

    expect(writeText).toHaveBeenCalledWith('GBL-9988-001');

    // findByText retries until the async setState after `await writeText`
    // flushes — Promise.resolve() alone was not enough microtasks.
    expect(await screen.findByText(/Copied/i)).toBeInTheDocument();
  });

  it('uses an aria-label override when supplied', () => {
    render(<CopyableText value="$1,234" ariaLabel="Copy BAH rate">$1,234</CopyableText>);
    expect(screen.getByRole('button', { name: /copy bah rate/i })).toBeInTheDocument();
  });
});
