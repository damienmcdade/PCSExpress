/*
 * Component tests for the Apple 5.1.2(i) consent sheet.
 *
 * What matters for review compliance, and therefore what is asserted:
 *   - The sheet only appears when a call site asks for consent, and it is a
 *     real dialog (role + aria-modal) so it blocks and is announced.
 *   - It NAMES both providers. Anthropic is primary; OpenAI is the live
 *     failover, so a disclosure that omits it would be inaccurate.
 *   - Agree resolves the awaiting call site with true and records consent,
 *     so the retry can carry the consent header.
 *   - "Not now" and Escape both resolve false and leave consent unrecorded —
 *     the app must stay usable, not get stuck behind the sheet.
 *   - Revocation actually clears the recorded consent.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import AIConsentSheet from '../../src/components/AIConsentSheet';
import {
  aiConsentHeaders,
  hasAiConsent,
  requestAiConsent,
  revokeAiConsent,
} from '../../src/config/aiConsent';
import { AI_CONSENT_HEADER } from '../../shared/aiConsent.js';

beforeEach(() => {
  cleanup();
  try { window.localStorage.clear(); } catch { /* storage unavailable */ }
});

afterEach(() => {
  try { window.localStorage.clear(); } catch { /* storage unavailable */ }
});

describe('AIConsentSheet', () => {
  it('renders nothing until a call site requests consent', () => {
    render(<AIConsentSheet />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a dialog naming Anthropic (Claude) and the OpenAI failover', async () => {
    render(<AIConsentSheet />);
    requestAiConsent();
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.textContent).toMatch(/Anthropic \(Claude\)/);
    expect(dialog.textContent).toMatch(/OpenAI/);
    // The disclosure has to say WHAT is sent, not merely that something is.
    expect(dialog.textContent).toMatch(/your question/i);
  });

  it('Agree resolves the waiting caller true, records consent, and arms the header', async () => {
    render(<AIConsentSheet />);
    const decision = requestAiConsent();
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /agree and continue/i }));
    await expect(decision).resolves.toBe(true);
    expect(hasAiConsent()).toBe(true);
    expect(aiConsentHeaders()).toEqual({ [AI_CONSENT_HEADER]: '1' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('"Not now" resolves false and records nothing — the app stays usable', async () => {
    render(<AIConsentSheet />);
    const decision = requestAiConsent();
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /not now/i }));
    await expect(decision).resolves.toBe(false);
    expect(hasAiConsent()).toBe(false);
    expect(aiConsentHeaders()).toEqual({});
  });

  it('Escape declines rather than trapping a keyboard user', async () => {
    render(<AIConsentSheet />);
    const decision = requestAiConsent();
    await screen.findByRole('dialog');
    fireEvent.keyDown(window, { key: 'Escape' });
    await expect(decision).resolves.toBe(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('skips the sheet entirely once consent is on record', async () => {
    render(<AIConsentSheet />);
    const first = requestAiConsent();
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /agree and continue/i }));
    await first;

    const second = requestAiConsent();
    await expect(second).resolves.toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('revocation clears consent so the next request is refused again', async () => {
    render(<AIConsentSheet />);
    const decision = requestAiConsent();
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /agree and continue/i }));
    await decision;
    expect(hasAiConsent()).toBe(true);

    revokeAiConsent();
    expect(hasAiConsent()).toBe(false);
    expect(aiConsentHeaders()).toEqual({});

    // A later call site raises the sheet again rather than transmitting.
    const onRequest = vi.fn();
    window.addEventListener('pcs-ai-consent-request', onRequest);
    requestAiConsent();
    expect(onRequest).toHaveBeenCalled();
    window.removeEventListener('pcs-ai-consent-request', onRequest);
    fireEvent.click(await screen.findByRole('button', { name: /not now/i }));
  });
});
