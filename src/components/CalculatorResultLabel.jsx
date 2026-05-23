/*
 * Two-tier honest-output label for calculator results.
 *
 * Tier 1 ("official") — the dollar figure is sourced directly from an
 *   authoritative published table (DTMO BAH row, DSSR LQA ceiling,
 *   JTR-mandated PPM incentive rate). The user should still cross-check
 *   the result against their orders / finance office, but the number is
 *   intended to match the official source.
 *
 * Tier 2 ("estimate") — the dollar figure includes at least one input that
 *   is genuinely estimated: a BAH MHA in ESTIMATED_MHA_KEYS, a PPM market
 *   constant flagged "TODO: verify source" (fuel / truck / labor), an OHA
 *   or LQA post not yet confirmed against the current table, or a budget
 *   range derived from CPI / industry averages.
 *
 * When a single output blends both tiers (PPM uses the official 95% JTR
 *   incentive rate but estimated market costs), label it Tier 2 overall
 *   and pass a `note` like "uses official JTR incentive rate with
 *   estimated market costs."
 *
 * PLANNING_AID_DISCLAIMER is the canonical short sentence rendered by
 * <PlanningAidDisclaimer /> on every calculator. Single source of truth so
 * the wording cannot drift across files.
 */

export const PLANNING_AID_DISCLAIMER =
  'This is a planning aid. Your actual entitlement is determined by your finance office based on your official orders.';

const TIER_STYLES = {
  official: {
    background: '#E8F5E9',
    color: '#1B5E20',
    border: '1px solid #A5D6A7',
    icon: '✓',
    label: 'Official rate — verify with your finance office',
    aria: 'Official rate — verify with your finance office',
  },
  estimate: {
    background: '#FFE0B2',
    color: '#6D4C00',
    border: '1px solid #FFB74D',
    icon: '⚠',
    label: 'Planning estimate — not an official figure',
    aria: 'Planning estimate — not an official figure',
  },
};

export function CalculatorResultLabel({ tier, note, style = {} }) {
  const s = TIER_STYLES[tier] || TIER_STYLES.estimate;
  return (
    <div style={{ marginTop: 10, ...style }}>
      <div
        role="status"
        aria-label={s.aria}
        style={{
          display: 'inline-block',
          background: s.background,
          color: s.color,
          border: s.border,
          borderRadius: 999,
          padding: '4px 10px',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.06em',
        }}
      >
        {s.icon} {s.label}
      </div>
      {note && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            lineHeight: 1.5,
            color: s.color,
            opacity: 0.9,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

export function PlanningAidDisclaimer({ style = {} }) {
  return (
    <div
      role="note"
      aria-label="Planning aid disclaimer"
      style={{
        marginTop: 12,
        padding: '10px 12px',
        background: '#F0F4FF',
        border: '1px solid #C7D7F5',
        borderRadius: 10,
        fontSize: 11,
        lineHeight: 1.55,
        color: '#1A3A5C',
        ...style,
      }}
    >
      <strong style={{ color: '#0D3B66' }}>Heads up:</strong> {PLANNING_AID_DISCLAIMER}
    </div>
  );
}
