/*
 * Shared Career-Center card primitives.
 *
 * Extracted from EmploymentModule so the SkillBridge tab can render with the
 * IDENTICAL card style + structure (left-accent color bar, colored badge pill,
 * "Open" CTA) — the only difference being the content. Kept dependency-free
 * (React only) and importable by both EmploymentModule and SkillBridgeSection
 * without a circular import.
 *
 * `copy` is optional: when omitted (or for SkillBridge's English content), the
 * card shows item.desc verbatim and English badge / CTA fallbacks.
 */

function linkStyle(color) {
  return {
    flexShrink: 0,
    alignSelf: 'center',
    padding: '9px 14px',
    borderRadius: 8,
    background: color,
    color: '#FFFFFF',
    textDecoration: 'none',
    fontWeight: 900,
    fontSize: 11,
    border: 0,
  };
}

// A single resource card. item: { name, url, desc, official, color, badgeKey,
// badgeLabel }. Mirrors the Employment Center exactly.
function Card({ item, copy }) {
  const description = (!copy || copy.lang === 'en')
    ? item.desc
    : (item.official ? copy.text('resourceText') : copy.text('externalText'));
  // An explicit badgeLabel always wins (e.g. SkillBridge partner cards);
  // otherwise translate the badgeKey, falling back to English.
  const badgeText = item.badgeLabel
    || (copy ? copy.text(item.badgeKey || (item.official ? 'official' : 'external')) : (item.badgeKey || (item.official ? 'Official' : 'External')));
  const openText = copy ? copy.text('open') : 'Open';

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: '#FFFFFF', border: '1px solid #D7E0EA', borderLeft: `4px solid ${item.color || '#334155'}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821' }}>{item.name}</div>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#FFFFFF', background: item.color || '#334155', padding: '3px 7px', borderRadius: 999, textTransform: 'uppercase' }}>{badgeText}</span>
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.55, color: '#46586B' }}>{description}</div>
        </div>
        <span style={linkStyle(item.color || '#334155')}>{openText}</span>
      </div>
    </a>
  );
}

function SectionIntro({ title, lead, children }) {
  return (
    <div style={{ background: '#F7FAFC', border: '1px solid #D7E0EA', borderRadius: 8, padding: 14, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#46586B', lineHeight: 1.55 }}>{lead}</div>
      {children}
    </div>
  );
}

export { Card, SectionIntro, linkStyle };
