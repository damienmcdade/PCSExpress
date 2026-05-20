/*
 * Component tests for BAHCalculatorTab — the 2026 DoD BAH rate
 * calculator. These guard the highest-blast-radius UI:
 * a service member making a housing decision based on a wrong
 * rendered rate is exactly the kind of bug Phase 18 needs to catch.
 *
 * Focus:
 *   - Renders without a duty station and surfaces the "select one" prompt.
 *   - Renders rate cards when a known CONUS station is picked from the profile.
 *   - Shows the OCONUS banner (OHA, not BAH) when the gaining is overseas.
 *   - Auto-fills the dependents dropdown from the onboarding profile.
 *   - Renders the official DTMO links so users can always escape to source.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import BAHCalculatorTab from '../../src/components/BAHCalculatorTab';

const theme = { primary: '#244247', secondary: '#1A3A5C', accent: '#C99A3D' };

beforeEach(() => cleanup());

describe('BAHCalculatorTab', () => {
  it('renders the header and prompts to pick a duty station when profile is empty', () => {
    render(<BAHCalculatorTab theme={theme} profile={{}} />);
    expect(screen.getByText(/BAH ENTITLEMENT CALCULATOR/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a duty station above to calculate/i)).toBeInTheDocument();
  });

  it('renders a known CONUS rate when gaining installation maps to a covered MHA', () => {
    render(
      <BAHCalculatorTab
        theme={theme}
        profile={{ gainingInstallation: 'Fort Liberty', paygrade: 'E-5', hasDependents: true }}
      />
    );
    expect(screen.getByText(/YOUR ESTIMATED MONTHLY BAH/i)).toBeInTheDocument();
    expect(screen.getByText(/ANNUAL PROJECTION/i)).toBeInTheDocument();
    expect(screen.getByText(/BAH Key Facts/i)).toBeInTheDocument();
  });

  it('shows the OCONUS / OHA banner when the gaining is overseas', () => {
    render(
      <BAHCalculatorTab
        theme={theme}
        profile={{ gainingInstallation: 'USAG Humphreys', paygrade: 'E-5' }}
      />
    );
    expect(screen.getByText(/OCONUS Assignment — OHA Applies/i)).toBeInTheDocument();
    // The BAH "your rate" card must NOT render when OCONUS — confirm by absence.
    expect(screen.queryByText(/YOUR ESTIMATED MONTHLY BAH/i)).toBeNull();
  });

  it('auto-fills the dependents dropdown from the onboarding profile', () => {
    render(
      <BAHCalculatorTab
        theme={theme}
        profile={{
          gainingInstallation: 'Fort Liberty',
          paygrade: 'E-5',
          hasDependents: true,
          childAges: ['8', '12'],
        }}
      />
    );
    // spouse (1) + 2 kids = 3 dependents -> dropdown bucket "3"
    const depsSelect = screen.getByDisplayValue(/3 dependents/i);
    expect(depsSelect).toBeInTheDocument();
    expect(screen.getByText(/Auto-filled from profile/i)).toBeInTheDocument();
  });

  it('always renders the official DTMO escape hatches', () => {
    render(<BAHCalculatorTab theme={theme} profile={{}} />);
    const dtmoLookup = screen.getByText(/Official DTMO BAH Rate Lookup/i).closest('a');
    expect(dtmoLookup).toHaveAttribute('href', expect.stringContaining('travel.dod.mil'));
    expect(dtmoLookup).toHaveAttribute('target', '_blank');
    expect(dtmoLookup).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
