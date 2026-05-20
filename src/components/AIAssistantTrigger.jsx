/*
 * AIAssistantTrigger — the small button that opens the AI Assistant
 * modal.
 *
 * Extracted from AIAssistantChip.jsx so the eager main bundle no
 * longer pulls in the 900+ line modal and its embedded curated
 * knowledge base. The Modal itself is lazy-loaded by App.jsx and
 * mounts only after the user taps this trigger.
 */

export default function AIAssistantTrigger({
  onClick,
  variant = 'sidebar',
  theme: _theme,
  label = 'AI Assistant',
  ariaLabel = 'Open AI Assistant',
}) {
  if (variant === 'sidebar') {
    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(13, 59, 102, 0.20)',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          color: '#FFFFFF',
          fontSize: 11,
          cursor: 'pointer',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textAlign: 'left',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 14 }}>🤖</span>
        {label}
      </button>
    );
  }
  // 'pill' variant — used inline on the home page above the Security
  // & data handling button.
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 999,
        border: '1px solid rgba(13, 59, 102, 0.35)',
        background: '#0D3B66',
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 6px 16px rgba(13, 59, 102, 0.28)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 14 }}>🤖</span>
      {label}
    </button>
  );
}
