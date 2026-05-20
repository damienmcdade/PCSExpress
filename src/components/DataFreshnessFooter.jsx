/*
 * DataFreshnessFooter — small inline footer rendered at the bottom of
 * every calculator that uses a hardcoded rate table. Tells the user
 * the "as of" date and links to the live official source so they can
 * cross-check before relying on a number for a real financial
 * decision.
 *
 * Why a separate component: keeps the calculator JSX clean, gives a
 * single visual style we can tune, and the data-version map is the
 * one place to edit when the official tables get a new effective
 * date. Avoids the "I bumped the rate but forgot to update the
 * label" footgun.
 */
import { DATA_VERSIONS } from '../config/dataVersions';

export default function DataFreshnessFooter({ versionKey, style = {} }) {
  const v = DATA_VERSIONS[versionKey];
  if (!v) return null;
  return (
    <div
      role="contentinfo"
      aria-label={`Data freshness for ${v.label}`}
      style={{
        marginTop: 14,
        padding: '10px 12px',
        background: '#F7FAFC',
        border: '1px dashed #D1DAE5',
        borderRadius: 8,
        fontSize: 10,
        lineHeight: 1.55,
        color: '#56697C',
        ...style,
      }}
    >
      <span style={{ fontWeight: 800, color: '#0D1821' }}>{v.label}</span>{' '}
      effective <strong>{v.effective}</strong> · sourced from {v.source}.{' '}
      <a
        href={v.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1565C0', fontWeight: 700, textDecoration: 'underline' }}
      >
        Verify at official source
      </a>
      .
    </div>
  );
}
