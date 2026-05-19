/*
 * Move Budget Tracker — entitlement estimates vs. actual out-of-pocket spending.
 * Helps families track the avg $5,000 unreimbursed PCS cost gap.
 */
import { useState, useMemo } from 'react';

const fieldStyle = {
  border: '1px solid #D8DEE7',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  color: '#111827',
  background: '#FFFFFF',
  width: '100%',
  boxSizing: 'border-box',
};

const ENTITLEMENT_CATEGORIES = [
  { id: 'dislocation', label: 'Dislocation Allowance (DLA)', hint: 'Paid ~2 months of BAH at old station. Check LES.', defaultPct: 100 },
  { id: 'mileage', label: 'POV Mileage (TLE/MALT)', hint: '$.21/mi per DoD mileage rate for authorized POVs.', defaultPct: 100 },
  { id: 'perDiem', label: 'TLE / Per Diem', hint: 'Temporary lodging and daily per diem during travel.', defaultPct: 100 },
  { id: 'hhgCost', label: 'HHG Government Move Cost', hint: 'What it cost the Gov to move your household goods.', defaultPct: 100 },
  { id: 'ppm', label: 'PPM Incentive (if applicable)', hint: '95% of GCC if you did a personally procured move.', defaultPct: 0 },
];

const EXPENSE_CATEGORIES_BASE = [
  { id: 'lodging', label: 'Lodging / TLE out-of-pocket', icon: '🏨' },
  { id: 'meals', label: 'Meals during travel', icon: '🍽️' },
  { id: 'fuel', label: 'Fuel & tolls', icon: '⛽' },
  { id: 'childcare', label: 'Childcare & pet care', icon: '🐾' },
  { id: 'storage', label: 'Storage (overflow)', icon: '📦' },
  { id: 'cleaning', label: 'Cleaning / repairs', icon: '🧹' },
  { id: 'deposits', label: 'Security deposits', icon: '🔑' },
  { id: 'school', label: 'School enrollment / uniforms', icon: '🎒' },
  { id: 'medical', label: 'Medical / dental transition', icon: '🏥' },
  { id: 'repairs', label: 'Vehicle or HHG damage', icon: '🔧' },
  { id: 'misc', label: 'Other miscellaneous', icon: '📎' },
];

// OCONUS-only expense categories. These cost lines are systematically
// underestimated by families until they arrive — large security
// deposits in host-nation currency, utility connection-fee shock, FX
// loss between expense and reimbursement, and visa/work-permit fees
// for accompanying spouses are the four most common surprises.
const EXPENSE_CATEGORIES_OCONUS_EXTRA = [
  { id: 'miha_security',  label: 'MIHA Security / host-nation rental deposit (1-3 months)', icon: '🌐' },
  { id: 'utility_setup',  label: 'Host-nation utility connection fees',                      icon: '⚡' },
  { id: 'fx_loss',        label: 'Currency exchange / FX loss vs reimbursement rate',        icon: '💱' },
  { id: 'visa_workperm',  label: 'Spouse visa / work-permit / host-nation document fees',    icon: '🛂' },
  { id: 'voltage_adapt',  label: 'Voltage transformers / appliance replacement (110V→220V)', icon: '🔌' },
];
function buildExpenseCategories(profile) {
  return profile?.isOverseas
    ? [...EXPENSE_CATEGORIES_BASE, ...EXPENSE_CATEGORIES_OCONUS_EXTRA]
    : EXPENSE_CATEGORIES_BASE;
}

function CurrencyInput({ value, onChange, placeholder }) {
  return (
    <input
      inputMode="decimal"
      placeholder={placeholder || '0'}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={fieldStyle}
    />
  );
}

function parseNum(v) {
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function MoveBudgetTracker({ theme, profile }) {
  const EXPENSE_CATEGORIES = useMemo(() => buildExpenseCategories(profile), [profile?.isOverseas]);
  const [entitlements, setEntitlements] = useState(() =>
    Object.fromEntries(ENTITLEMENT_CATEGORIES.map(c => [c.id, '']))
  );
  const [expenses, setExpenses] = useState(() =>
    Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.id, '']))
  );

  const totalEntitlements = useMemo(() =>
    ENTITLEMENT_CATEGORIES.reduce((sum, c) => sum + parseNum(entitlements[c.id]), 0),
    [entitlements]
  );

  const totalExpenses = useMemo(() =>
    EXPENSE_CATEGORIES.reduce((sum, c) => sum + parseNum(expenses[c.id]), 0),
    [expenses, EXPENSE_CATEGORIES]
  );

  const netPosition = totalEntitlements - totalExpenses;
  const isPositive = netPosition >= 0;

  const pctCovered = totalExpenses > 0
    ? Math.min(100, Math.round((totalEntitlements / totalExpenses) * 100))
    : 100;

  const updateEntitlement = (id, val) => setEntitlements(prev => ({ ...prev, [id]: val }));
  const updateExpense = (id, val) => setExpenses(prev => ({ ...prev, [id]: val }));

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ background: theme.secondary, borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFF', border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>MOVE BUDGET TRACKER</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Entitlements vs. Out-of-Pocket Spending</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          Military families average <strong style={{ color: theme.accent }}>$5,000 unreimbursed</strong> per PCS move. Track your entitlements and actual costs side-by-side to close the gap.
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ background: isPositive ? '#E8F5E9' : '#FFEBEE', border: `2px solid ${isPositive ? '#A5D6A7' : '#FFCDD2'}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em' }}>NET POSITION</div>
            <div style={{ fontSize: 28, fontWeight: 950, color: isPositive ? '#2E7D32' : '#C62828', lineHeight: 1.1 }}>{fmt(Math.abs(netPosition))}</div>
            <div style={{ fontSize: 12, color: isPositive ? '#388E3C' : '#D32F2F', fontWeight: 700 }}>{isPositive ? '✓ Entitlements cover expenses' : '⚠ Unreimbursed gap'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#56697C', marginBottom: 4 }}>{pctCovered}% covered</div>
            <div style={{ width: 80, height: 8, background: '#E0E0E0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${pctCovered}%`, height: '100%', background: isPositive ? '#4CAF50' : '#EF5350', borderRadius: 99 }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#56697C', fontWeight: 900 }}>TOTAL ENTITLEMENTS</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20' }}>{fmt(totalEntitlements)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#56697C', fontWeight: 900 }}>TOTAL EXPENSES</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#B71C1C' }}>{fmt(totalExpenses)}</div>
          </div>
        </div>
      </div>

      {/* Entitlements Section */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: theme.primary, letterSpacing: '.06em', marginBottom: 10 }}>ENTITLEMENTS RECEIVED</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {ENTITLEMENT_CATEGORIES.map(cat => (
            <div key={cat.id} style={{ background: '#F0FFF4', border: '1px solid #C3E6CB', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1B5E20', marginBottom: 2 }}>{cat.label}</div>
                  <div style={{ fontSize: 10, color: '#388E3C', lineHeight: 1.4 }}>{cat.hint}</div>
                </div>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <CurrencyInput
                    value={entitlements[cat.id]}
                    onChange={v => updateEntitlement(cat.id, v)}
                    placeholder="Amount $"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses Section */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: theme.primary, letterSpacing: '.06em', marginBottom: 10 }}>ACTUAL OUT-OF-POCKET EXPENSES</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {EXPENSE_CATEGORIES.map(cat => (
            <div key={cat.id} style={{ background: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#B71C1C', flex: 1 }}>
                  {cat.icon} {cat.label}
                </div>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <CurrencyInput
                    value={expenses[cat.id]}
                    onChange={v => updateExpense(cat.id, v)}
                    placeholder="Amount $"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 14, padding: 14, fontSize: 11, color: '#6D4C00', lineHeight: 1.7, marginBottom: 12 }}>
        <strong>Cost-saving tips:</strong>
        <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
          <li>File a DPS damage claim within 9 months for HHG loss or damage</li>
          <li>Keep ALL receipts — lodging, meals, fuel — to reconcile with DLA/per diem</li>
          <li>TLE (Temporary Lodging Expense) covers up to 10 days at old/new station — use it</li>
          <li>Non-temporary storage (NTS) is authorized for OCONUS moves — request it early</li>
          <li>MYCAA, Army Emergency Relief, NMCRS, AFAS can offset transition costs</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <a href="https://www.defensetravel.dod.mil/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>Defense Travel Management Office</a>
        <a href="https://dps.move.mil/cust/standard/user/home.xhtml" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">DPS / Move.mil — HHG & Claims</a>
      </div>
    </div>
  );
}
