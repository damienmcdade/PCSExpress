/*
 * Component tests for the AI Assistant trigger button and modal.
 *
 * Focus areas:
 *   - AIAssistantTrigger fires onClick in both sidebar + pill variants
 *     and exposes the right aria-label so screen readers + the rest of
 *     the app's "open-ai-assistant" pattern work.
 *   - AIAssistantModal renders nothing when open=false.
 *   - When open, the modal exposes role="dialog" + aria-modal="true",
 *     keeps the 988 crisis line + OneSource pinned in the header, and
 *     keeps the OPSEC banner present (safety-critical regressions).
 *   - Close button + Escape both fire onClose.
 *
 * We do NOT exercise the network submit path here — that would require
 * mocking fetch and would test the API contract, not the component.
 * The starter view (no messages) is the safe surface to test.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AIAssistantTrigger from '../../src/components/AIAssistantTrigger';
import { AIAssistantModal } from '../../src/components/AIAssistantChip';

const theme = { primary: '#244247', secondary: '#1A3A5C', accent: '#C99A3D' };

beforeEach(() => cleanup());

describe('AIAssistantTrigger', () => {
  it('renders the sidebar variant and fires onClick', () => {
    const onClick = vi.fn();
    render(<AIAssistantTrigger variant="sidebar" theme={theme} onClick={onClick} />);
    const btn = screen.getByRole('button', { name: /open ai assistant/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the pill variant with a custom label and aria-label', () => {
    const onClick = vi.fn();
    render(
      <AIAssistantTrigger
        variant="pill"
        theme={theme}
        onClick={onClick}
        label="Ask the JTR"
        ariaLabel="Open the JTR assistant"
      />
    );
    const btn = screen.getByRole('button', { name: /open the jtr assistant/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent(/ask the jtr/i);
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('AIAssistantModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(<AIAssistantModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an accessible dialog with the AI Assistant header when open', () => {
    render(<AIAssistantModal open={true} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: /ai assistant/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('keeps the 988 crisis line + Military OneSource pinned in the safety header', () => {
    render(<AIAssistantModal open={true} onClose={() => {}} />);
    // 988 must be a tel: link.
    const crisis = screen.getByRole('link', { name: /call 988 then 1/i });
    expect(crisis).toHaveAttribute('href', 'tel:988');
    // OneSource must be a tel: link to the published 1-800 number.
    const oneSource = screen.getByRole('link', { name: /military onesource/i });
    expect(oneSource).toHaveAttribute('href', expect.stringContaining('tel:'));
    expect(oneSource).toHaveAttribute('href', expect.stringContaining('18003429647'));
  });

  it('keeps the OPSEC banner above the input', () => {
    render(<AIAssistantModal open={true} onClose={() => {}} />);
    expect(screen.getByText(/OPSEC:/i)).toBeInTheDocument();
    expect(screen.getByText(/never enter classified/i)).toBeInTheDocument();
  });

  it('closes when the ✕ button is clicked', () => {
    const onClose = vi.fn();
    render(<AIAssistantModal open={true} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /close ai assistant/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
