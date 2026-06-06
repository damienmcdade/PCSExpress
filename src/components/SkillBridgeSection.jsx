/*
 * SkillBridgeSection — the SkillBridge tab body for the veteran Career Center.
 * A job-category filter PLUS a "Remote only" toggle (so remote/virtual
 * SkillBridge opportunities populate within the same tab), and auto-populated
 * result cards (official DoD locator + location/category-targeted searches +
 * curated partner programs). Reuses the Career Center's shared location for
 * non-remote results — no separate location input.
 *
 * Third-party dependencies: React only.
 */

import { useState } from 'react';
import TabBar from './TabBar';
import { SKILLBRIDGE_CATEGORIES, skillbridgeResults } from '../data/skillbridge';

export default function SkillBridgeSection({ theme, location = '' }) {
  const [cat, setCat] = useState('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const loc = String(location || '').trim();
  const cards = skillbridgeResults({ catId: cat, location: loc, remote: remoteOnly });

  return (
    <div>
      <div style={{ background: '#EDF4FA', border: '1px solid #D7E0EA', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#0D3B66', letterSpacing: '.08em', marginBottom: 3 }}>SKILLBRIDGE ELIGIBILITY</div>
        <div style={{ fontSize: 12, color: '#43526B', lineHeight: 1.55 }}>
          DoD SkillBridge places you in a civilian-employer internship during your <strong>last up-to-180 days</strong> of service while you keep military pay and benefits. It requires <strong>unit commander approval</strong> — start early.
        </div>
      </div>

      {/* Remote-only filter — populate only remote/virtual opportunities. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          role="switch"
          aria-checked={remoteOnly}
          onClick={() => setRemoteOnly(v => !v)}
          aria-label="Show remote SkillBridge opportunities only"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
            fontSize: 12, fontWeight: 800,
            border: `1.5px solid ${remoteOnly ? '#065F46' : '#D4DCE8'}`,
            background: remoteOnly ? '#065F46' : '#FFF',
            color: remoteOnly ? '#FFF' : '#43526B',
          }}
        >
          <span aria-hidden="true">{remoteOnly ? '🌐' : '📍'}</span>
          {remoteOnly ? 'Remote only — ON' : 'Remote only'}
        </button>
        <span style={{ fontSize: 11, color: '#56697C' }}>
          {remoteOnly ? 'Showing remote/virtual programs (location ignored).' : (loc ? `Including local programs near ${loc}.` : 'Enter a location above to add local results.')}
        </span>
      </div>

      {/* Job-category filter. */}
      <TabBar ariaLabel="SkillBridge job category filter">
        {SKILLBRIDGE_CATEGORIES.map(c => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-active={active || undefined}
              onClick={() => setCat(c.id)}
              className={`pcs-tab ${active ? 'is-active' : ''}`}
              style={{ borderRadius: 999, padding: '6px 13px', border: `1.5px solid ${active ? theme.primary : '#D4DCE8'}`, background: active ? theme.primary : '#FFF', color: active ? '#FFF' : '#43526B', fontSize: 11.5, fontWeight: 700 }}
            >
              {c.label}
            </button>
          );
        })}
      </TabBar>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {cards.map((card, i) => (
          <a
            key={`${card.name}-${i}`}
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${card.name} (opens in a new tab)`}
            style={{ display: 'block', textDecoration: 'none', background: '#FFFFFF', border: '1px solid #E2E8F1', borderRadius: 12, padding: 13 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: theme.primary }}>{card.name} →</span>
              {card.official && <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '.06em', color: '#1B5E20', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 5, padding: '1px 6px' }}>OFFICIAL</span>}
              {card.partner && <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '.06em', color: '#0D3B66', background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 5, padding: '1px 6px' }}>PARTNER</span>}
            </div>
            <div style={{ fontSize: 12, color: '#43526B', lineHeight: 1.5 }}>{card.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
