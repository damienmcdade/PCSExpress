/*
 * PCS2026ChangesCard — a compact, collapsible "what changed in 2026" card
 * for the Command Center dashboard. Surfaces the structural PCS policy
 * shifts (GHC/HomeSafe termination, the new Personal Property Activity,
 * 210-day orders, discretionary-move reductions, FY2026 rate bumps) so
 * families are not blindsided.
 *
 * Data + sources live in src/data/pcs2026Changes.js. This component is
 * presentation-only: no network, no PII, no persistence beyond a local
 * expand/collapse UI state. Each item links to its public source.
 */
import { useState } from 'react';
import { PCS_2026_CHANGES } from '../data/pcs2026Changes';

export default function PCS2026ChangesCard({ theme }) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const primary = theme?.primary || '#0D3B66';
  const accent = theme?.accent || '#C99A3D';

  if (!PCS_2026_CHANGES || PCS_2026_CHANGES.length === 0) return null;

  return (
    <section
      aria-label="2026 PCS policy changes"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E0E6EE',
        borderLeft: `4px solid ${accent}`,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        boxShadow: '0 12px 28px rgba(38,53,31,0.10)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="pcs-2026-changes-list"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>🆕</span>
          <span style={{ fontSize: 13, fontWeight: 950, color: primary, letterSpacing: '.04em' }}>
            What changed for PCS moves in 2026
          </span>
          <span
            style={{
              fontSize: 10, fontWeight: 800, color: '#6D4C00', background: '#FFF8E1',
              border: '1px solid #FFE082', borderRadius: 999, padding: '1px 8px',
            }}
          >
            {PCS_2026_CHANGES.length} updates
          </span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 13, color: accent, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
      </button>

      {open && (
        <ul id="pcs-2026-changes-list" style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
          {PCS_2026_CHANGES.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <li key={c.id} style={{ borderTop: '1px solid #EEF1F6', padding: '10px 0 4px' }}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  aria-expanded={isExpanded}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%',
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span aria-hidden="true" style={{ color: accent, fontWeight: 900, lineHeight: 1.5 }}>
                    {isExpanded ? '−' : '+'}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0D1821', lineHeight: 1.45 }}>
                    {c.title}
                  </span>
                </button>
                {isExpanded && (
                  <div style={{ margin: '6px 0 6px 18px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, lineHeight: 1.6, color: '#56697C' }}>{c.summary}</p>
                    <p style={{ margin: '0 0 6px', fontSize: 12, lineHeight: 1.6, color: '#0D1821' }}>
                      <strong style={{ color: primary }}>What it means: </strong>{c.impact}
                    </p>
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11.5, fontWeight: 700, color: primary }}
                    >
                      Source ↗
                    </a>
                  </div>
                )}
              </li>
            );
          })}
          <li style={{ borderTop: '1px solid #EEF1F6', paddingTop: 8 }}>
            <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.5, color: '#8696A7' }}>
              Planning-awareness summaries of public DoD / DTMO reporting as of 2026 — not official guidance.
              Confirm with your Personal Property Office, your orders, and the linked sources before acting.
            </p>
          </li>
        </ul>
      )}
    </section>
  );
}
