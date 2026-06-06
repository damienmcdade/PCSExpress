/*
 * SkillBridgeSection — the DoD SkillBridge tab body for the veteran Career
 * Center. Mirrors the Employment Center's card style + structure EXACTLY
 * (shared SectionIntro + Card primitives), the only difference being that it
 * populates vetted SkillBridge information: the official DoD locator + program
 * overview, a location/category-targeted live search, and curated, verified
 * SkillBridge-authorized partner programs.
 *
 * A job-category filter plus a "Remote only" toggle narrow the results. Local
 * results reuse the Career Center's shared location (no separate input).
 *
 * Third-party dependencies: React only.
 */

import { useState } from 'react';
import TabBar from './TabBar';
import { Card, SectionIntro } from './careerCards';
import { SKILLBRIDGE_CATEGORIES, SKILLBRIDGE_FACTS, skillbridgeResults } from '../data/skillbridge';

export default function SkillBridgeSection({ theme, location = '', copy }) {
  const [cat, setCat] = useState('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const loc = String(location || '').trim();
  const cards = skillbridgeResults({ catId: cat, location: loc, remote: remoteOnly });

  return (
    <div>
      <SectionIntro
        title="DoD SkillBridge"
        lead={`${SKILLBRIDGE_FACTS.summary} Use the Remote-only filter and job categories below to narrow the vetted programs; local results tailor to ${loc || 'your destination above'}.`}
      />

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

      {/* Job-category filter — bubble pills matching the rest of the app. */}
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

      <div style={{ marginTop: 14 }}>
        {cards.map((card) => (
          <Card key={`${card.name}-${card.url}`} item={card} copy={copy} />
        ))}
      </div>

      <p style={{ fontSize: 10, color: '#66788A', lineHeight: 1.5, marginTop: 6 }}>
        SkillBridge participation requires unit commander approval and is offered at the company’s discretion. Confirm current openings, eligibility, and dates on each program’s official page before applying.
      </p>
    </div>
  );
}
