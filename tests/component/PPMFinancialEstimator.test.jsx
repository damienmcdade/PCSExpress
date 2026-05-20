/*
 * Component tests for PPMFinancialEstimator — the PPM cash-flow
 * planner. The dollar figures users see here drive real financial
 * decisions, so the tests focus on the regression-worthy surfaces:
 * banners that gate authorization, defaulted weight by component
 * type, and the official JTR / DPS escape hatches.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PPMFinancialEstimator from '../../src/components/PPMFinancialEstimator';

const theme = { primary: '#244247', secondary: '#1A3A5C', accent: '#C99A3D' };

beforeEach(() => cleanup());

describe('PPMFinancialEstimator', () => {
  it('renders the header, profit meter, and all four metric cards', () => {
    render(<PPMFinancialEstimator theme={theme} profile={{ paygrade: 'E-5' }} />);
    expect(screen.getByText(/PPM FINANCIAL ESTIMATOR/i)).toBeInTheDocument();
    expect(screen.getByText(/PROFIT METER/i)).toBeInTheDocument();
    // Exact-case match to dodge the lowercase mention in the header copy.
    expect(screen.getByText('95% GCC estimate')).toBeInTheDocument();
    expect(screen.getByText('Tax withholding')).toBeInTheDocument();
    expect(screen.getByText('Truck and fuel')).toBeInTheDocument();
    expect(screen.getByText('Official weight cap')).toBeInTheDocument();
  });

  it('hides the DoD Civilian planning banner for active-duty profiles', () => {
    render(
      <PPMFinancialEstimator theme={theme} profile={{ paygrade: 'E-5', component: 'Active Duty' }} />
    );
    expect(screen.queryByText(/DoD Civilian planning estimate/i)).toBeNull();
  });

  it('shows the DoD Civilian planning banner for civilian profiles', () => {
    render(
      <PPMFinancialEstimator theme={theme} profile={{ paygrade: 'E-5', component: 'DoD Civilian' }} />
    );
    expect(screen.getByText(/DoD Civilian planning estimate/i)).toBeInTheDocument();
  });

  it('shows the OCONUS PPM-restricted banner when gaining is overseas and not in the allowlist', () => {
    render(
      <PPMFinancialEstimator
        theme={theme}
        profile={{ paygrade: 'E-5', isOverseas: true, gainingInstallation: 'Ramstein AB' }}
      />
    );
    expect(screen.getByText(/OCONUS PPM is generally not authorized/i)).toBeInTheDocument();
  });

  it('does NOT show the OCONUS restriction banner for allowed Pacific/Alaska bases', () => {
    render(
      <PPMFinancialEstimator
        theme={theme}
        profile={{ paygrade: 'E-5', isOverseas: true, gainingInstallation: 'JBPHH Hawaii' }}
      />
    );
    expect(screen.queryByText(/OCONUS PPM is generally not authorized/i)).toBeNull();
  });

  it('defaults the weight field to 7,500 lbs for military', () => {
    const { container } = render(
      <PPMFinancialEstimator theme={theme} profile={{ paygrade: 'E-5' }} />
    );
    const weightInput = container.querySelectorAll('input[inputmode="numeric"]')[2];
    expect(weightInput.value).toBe('7500');
  });

  it('defaults the weight field to 18,000 lbs for DoD Civilians', () => {
    const { container } = render(
      <PPMFinancialEstimator theme={theme} profile={{ paygrade: 'E-5', component: 'DoD Civilian' }} />
    );
    const weightInput = container.querySelectorAll('input[inputmode="numeric"]')[2];
    expect(weightInput.value).toBe('18000');
  });

  it('renders the JTR and DPS escape hatches', () => {
    render(<PPMFinancialEstimator theme={theme} profile={{ paygrade: 'E-5' }} />);
    const jtr = screen.getByText(/Open Joint Travel Regulations/i).closest('a');
    const dps = screen.getByText(/Open DPS \/ Move.mil/i).closest('a');
    expect(jtr).toHaveAttribute('href', expect.stringContaining('travel.dod.mil'));
    expect(dps).toHaveAttribute('href', expect.stringContaining('dps.move.mil'));
  });
});
