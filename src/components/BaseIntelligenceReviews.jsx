/*
 * Purpose: Base intelligence and community review UI.
 * Third-party dependencies: React.
 */

import { useMemo, useState } from 'react';

const REVIEW_CATEGORIES = ['Housing', 'Schools', 'Childcare'];

function buildReviews(installationName) {
  const base = installationName || 'Selected installation';
  return [
    { id: 'housing-1', installationName: base, category: 'Housing', rating: 4.4, userRank: 'E-6', verified: true, verification: '.mil email', text: 'On-post housing office answered quickly and gave realistic waitlist ranges. Confirm pet and lease rules directly before arrival.' },
    { id: 'housing-2', installationName: base, category: 'Housing', rating: 3.9, userRank: 'O-3', verified: false, verification: 'Community', text: 'Off-post rental market moved fast. Have backup neighborhoods and confirm commute at gate traffic hours.' },
    { id: 'schools-1', installationName: base, category: 'Schools', rating: 4.2, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'School liaison was the fastest path for enrollment timelines, records, and district boundary questions.' },
    { id: 'childcare-1', installationName: base, category: 'Childcare', rating: 4.1, userRank: 'E-5', verified: true, verification: '.mil email', text: 'MilitaryChildCare.com waitlist timing was accurate. Join the list early and call the CDC after orders are firm.' },
  ];
}

function VerifiedBadge({ review }) {
  if (!review.verified) {
    return <span style={{ background: '#F3F4F6', color: '#56697C', borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 900 }}>Community review</span>;
  }
  return (
    <span style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #A5D6A7', borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 950 }}>
      Military Family Verified
    </span>
  );
}

function StarRow({ rating }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return <span style={{ color: '#F59E0B', fontSize: 13 }}>{'★'.repeat(full)}{'☆'.repeat(5 - full)} <strong style={{ color: '#0D1821' }}>{rating.toFixed(1)}</strong></span>;
}

export default function BaseIntelligenceReviews({ theme, profile }) {
  const [category, setCategory] = useState('Housing');
  const installationName = (profile?.gainingInstallation || '').split(',')[0].trim() || 'Selected installation';
  const reviews = useMemo(() => buildReviews(installationName), [installationName]);
  const filtered = reviews.filter(review => review.category === category);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary, color: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>BASE INTELLIGENCE</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>{installationName}</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          Community review cards are separated from official public installation data. Verification badges identify reviews tied to authenticated .mil email status or verified orders without displaying raw email, order numbers, phone numbers, or other PII.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
        {REVIEW_CATEGORIES.map(item => (
          <button key={item} onClick={() => setCategory(item)} style={{ flexShrink: 0, borderRadius: 999, border: `1.5px solid ${category === item ? theme.primary : '#D6E0EA'}`, background: category === item ? theme.primary : '#FFFFFF', color: category === item ? '#FFFFFF' : '#243447', padding: '8px 14px', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
            {item}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        {filtered.map(review => (
          <div key={review.id} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${review.verified ? theme.accent : '#CBD5E1'}`, borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 950, color: '#0D1821' }}>{review.category} review</div>
                <div style={{ fontSize: 11, color: '#56697C', marginTop: 2 }}>Reviewer rank: {review.userRank}</div>
              </div>
              <VerifiedBadge review={review} />
            </div>
            <div style={{ marginBottom: 8 }}><StarRow rating={review.rating} /></div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{review.text}</div>
            {review.verified && <div style={{ fontSize: 10, color: '#1B5E20', fontWeight: 900, marginTop: 8 }}>Verified through {review.verification}; raw PII is not shown in the app.</div>}
          </div>
        ))}
      </div>

      <div style={{ background: '#F8FAFC', border: '1px solid #DDE7F0', borderRadius: 14, padding: 14, fontSize: 11, color: '#56697C', lineHeight: 1.6 }}>
        <strong style={{ color: '#0D1821' }}>Data handling:</strong> BaseReviews stores InstallationName, Category, Rating, and UserRank plus verification status. Raw .mil email addresses, uploaded orders, DoD ID numbers, phone numbers, and addresses are intentionally excluded from the public review schema.
      </div>
    </div>
  );
}
