/*
 * Component tests for LQACalculatorTab — the DoD-civilian Living
 * Quarters Allowance + TQSA reference calculator. Guards that the
 * post auto-detection, grade-group inference, and family-size
 * mapping all flow through to the rendered estimate.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import LQACalculatorTab from '../../src/components/LQACalculatorTab';

const theme = { primary: '#244247', secondary: '#1A3A5C', accent: '#C99A3D' };

beforeEach(() => cleanup());

describe('LQACalculatorTab', () => {
  it('renders the LQA / TQSA header and the explainer panel', () => {
    render(<LQACalculatorTab theme={theme} profile={{}} />);
    expect(screen.getByText(/LQA \/ TQSA REFERENCE CALCULATOR/i)).toBeInTheDocument();
    expect(screen.getByText(/How LQA \/ TQSA Work/i)).toBeInTheDocument();
    expect(screen.getByText(/ESTIMATED ANNUAL LQA CEILING/i)).toBeInTheDocument();
  });

  it('auto-detects the overseas post from the gaining installation', () => {
    render(
      <LQACalculatorTab
        theme={theme}
        profile={{ gainingInstallation: 'Ramstein AB', paygrade: 'GS-13' }}
      />
    );
    expect(screen.getByText(/Post auto-detected from your profile/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Germany \(Kaiserslautern \/ Ramstein\)/i)).toBeInTheDocument();
  });

  it('auto-fills family size when the profile carries spouse + children', () => {
    render(
      <LQACalculatorTab
        theme={theme}
        profile={{
          gainingInstallation: 'Yokota AB',
          paygrade: 'GS-13',
          hasDependents: true,
          childAges: ['4', '7'],
        }}
      />
    );
    // 1 sponsor + 1 spouse + 2 kids = 4 persons -> 3-4 bucket
    expect(screen.getByText(/✓ Auto-filled from profile \(4 persons\)/i)).toBeInTheDocument();
  });

  it('renders a different annual ceiling for Stuttgart than for Grafenwoehr', () => {
    // useState initializers only fire on mount, so each profile needs its
    // own fresh tree. cleanup() between renders unmounts the previous one.
    const { container } = render(
      <LQACalculatorTab
        theme={theme}
        profile={{ gainingInstallation: 'Grafenwoehr', paygrade: 'GS-13' }}
      />
    );
    const ceilingA = container.querySelector('[style*="font-size: 42"]')?.textContent || '';
    cleanup();

    const { container: container2 } = render(
      <LQACalculatorTab
        theme={theme}
        profile={{ gainingInstallation: 'Patch Barracks', paygrade: 'GS-13' }}
      />
    );
    const ceilingB = container2.querySelector('[style*="font-size: 42"]')?.textContent || '';

    expect(ceilingA).toMatch(/^\$/);
    expect(ceilingB).toMatch(/^\$/);
    expect(ceilingA).not.toBe(ceilingB);
  });
});
