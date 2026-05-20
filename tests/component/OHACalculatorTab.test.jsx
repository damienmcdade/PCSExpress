/*
 * Component tests for OHACalculatorTab — the Overseas Housing
 * Allowance reference calculator. Guards the rent-cap rendering and
 * the with/without-dependents toggle path.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import OHACalculatorTab from '../../src/components/OHACalculatorTab';

const theme = { primary: '#244247', secondary: '#1A3A5C', accent: '#C99A3D' };

beforeEach(() => cleanup());

describe('OHACalculatorTab', () => {
  it('renders the OHA header, How-OHA-Works panel, and a default rent cap', () => {
    render(<OHACalculatorTab theme={theme} profile={{}} />);
    expect(screen.getByText(/OHA REFERENCE CALCULATOR/i)).toBeInTheDocument();
    expect(screen.getByText(/How OHA Works/i)).toBeInTheDocument();
    expect(screen.getByText(/ESTIMATED MONTHLY OHA RENT CAP/i)).toBeInTheDocument();
  });

  it('auto-detects the region from the gaining installation', () => {
    render(
      <OHACalculatorTab
        theme={theme}
        profile={{ gainingInstallation: 'USAG Humphreys', paygrade: 'E-7' }}
      />
    );
    expect(screen.getByText(/Auto-detected from your profile/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/South Korea \(Camp Humphreys\)/i)).toBeInTheDocument();
  });

  it('shows a higher rent cap with dependents than without (positive delta for E-7 Humphreys)', () => {
    const { container } = render(
      <OHACalculatorTab
        theme={theme}
        profile={{ gainingInstallation: 'USAG Humphreys', paygrade: 'E-7', hasDependents: true }}
      />
    );
    const capNodeWith = container.querySelector('[style*="font-size: 42"]');
    const withDeps = capNodeWith?.textContent || '';

    // Toggle to without-deps via the select.
    const depsSelect = screen.getByDisplayValue(/With Dependents/i);
    fireEvent.change(depsSelect, { target: { value: '0' } });

    const capNodeWithout = container.querySelector('[style*="font-size: 42"]');
    const withoutDeps = capNodeWithout?.textContent || '';

    // Both should be currency strings, and with-deps > without-deps.
    const num = (s) => Number(s.replace(/[^0-9]/g, ''));
    expect(num(withDeps)).toBeGreaterThan(0);
    expect(num(withoutDeps)).toBeGreaterThan(0);
    expect(num(withDeps)).toBeGreaterThan(num(withoutDeps));
  });

  it('renders the pay-grade and region selectors with the expected option set', () => {
    render(<OHACalculatorTab theme={theme} profile={{}} />);
    expect(screen.getByRole('option', { name: 'E-1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'O-10' })).toBeInTheDocument();
    // At least one region with the Germany flag should be selectable.
    const germanyOption = screen.getAllByRole('option').find(o => /Germany/i.test(o.textContent));
    expect(germanyOption).toBeTruthy();
  });
});
