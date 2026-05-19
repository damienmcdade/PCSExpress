/*
 * AI Assistant chip + modal.
 *
 * Replaces the older crisis-line chip with a live AI helper that can
 * answer PCS / JTR / FTR / DSSR questions. The chip floats on every
 * screen; tapping it opens a chat modal that posts to the existing
 * /api/jtr-assistant backend.
 *
 * Safety-critical decisions baked in:
 *
 *   1. The Military Crisis Line (988 then 1) and Military OneSource
 *      (1-800-342-9647) sit as a prominent safety header inside the
 *      modal so 988 is still one tap away. We are converting the SOS
 *      chip to an AI button — we are NOT removing the safety net.
 *
 *   2. The free-text input is OPSEC-banner-protected. Never paste
 *      classified, FOUO, CUI, GBL numbers, exact unit IDs, or specific
 *      operational dates.
 *
 *   3. The /api/jtr-assistant backend returns 501 unless an operator
 *      has configured JTR_ASSISTANT_PROVIDER. When unconfigured, the
 *      modal shows a graceful "AI not configured" message and steers
 *      the user to the JTR Assistant tab's curated knowledge base
 *      and the gaining installation Finance Office.
 *
 *   4. No conversation persistence. State is wiped when the modal
 *      closes. Nothing is written to the audit log beyond the
 *      "ai_assistant_opened" metadata event.
 *
 *   5. Input length capped at 1000 chars matching the backend
 *      validator; submit button is disabled when the field is empty
 *      or while a request is in flight.
 */

import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../config/apiConfig';
import { AuditLogger } from '../security/SecurityExtensions';

const COLLAPSE_KEY = 'pcs_ai_chip_collapsed';

export default function AIAssistantChip({ isNative, isDesktop }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  const offsetBottom = isNative && !isDesktop
    ? 'calc(64px + env(safe-area-inset-bottom) + 10px)'
    : 'calc(20px + env(safe-area-inset-bottom))';

  const baseStyle = {
    position: 'fixed',
    bottom: offsetBottom,
    left: isDesktop ? 246 : 12, // sits clear of the desktop sidebar
    zIndex: 320,
    fontFamily: 'system-ui',
  };

  const handleOpen = () => {
    AuditLogger.record('ai_assistant_opened', {});
    setOpen(true);
  };

  return (
    <>
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand AI Assistant"
          style={{
            ...baseStyle,
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.7)',
            background: '#0D3B66',
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(13, 59, 102, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🤖
        </button>
      ) : (
        <button
          onClick={handleOpen}
          aria-label="Open AI Assistant"
          style={{
            ...baseStyle,
            background: '#0D3B66',
            color: '#FFFFFF',
            border: '1.5px solid rgba(255,255,255,0.7)',
            borderRadius: 999,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(13, 59, 102, 0.4)',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '.03em',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 16 }}>🤖</span>
          <span>AI Assistant</span>
          <span
            role="button"
            aria-label="Collapse AI Assistant"
            onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.85)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 900,
              marginLeft: 4,
            }}
          >
            ✕
          </span>
        </button>
      )}

      {open && (
        <AIAssistantModal
          isDesktop={isDesktop}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AIAssistantModal({ isDesktop, onClose }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => () => { try { abortRef.current?.abort(); } catch {} }, []);
  useEffect(() => {
    // Auto-scroll the conversation to the latest message.
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const submit = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setBusy(true);
    try {
      abortRef.current = new AbortController();
      const timer = setTimeout(() => abortRef.current?.abort(), 20_000);
      const r = await fetch(apiUrl('/api/jtr-assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ q }),
        signal: abortRef.current.signal,
      });
      clearTimeout(timer);
      if (r.status === 501) {
        const data = await r.json().catch(() => ({}));
        setMessages(prev => [...prev, {
          role: 'system',
          text: data?.answer || 'The AI Assistant is not configured for this deployment. For now, use the JTR Assistant tab inside Movement & Logistics for curated answers, and escalate anything time-sensitive to your gaining installation Finance Office.',
        }]);
      } else if (!r.ok) {
        setMessages(prev => [...prev, { role: 'system', text: 'Could not reach the assistant. Try again in a minute or use the JTR Assistant tab.' }]);
      } else {
        const data = await r.json();
        const answer = String(data?.answer || '').trim();
        const src = data?.source ? ` · ${data.source}` : '';
        setMessages(prev => [...prev, { role: 'assistant', text: answer || 'No answer returned.', source: src }]);
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        setMessages(prev => [...prev, { role: 'system', text: 'Request timed out. Try a shorter question or check your connection.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'system', text: 'Network error. Check your connection and try again.' }]);
      }
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13, 24, 33, 0.65)',
        zIndex: 400,
        display: 'flex',
        alignItems: isDesktop ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: isDesktop ? 32 : 0,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: isDesktop ? 640 : 480,
          maxHeight: isDesktop ? '85vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isDesktop ? 18 : '18px 18px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #E0E6EE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden="true" style={{ fontSize: 18 }}>🤖</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821' }}>AI Assistant</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#56697C', letterSpacing: '.06em', textTransform: 'uppercase' }}>JTR / FTR / DSSR helper</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close AI Assistant" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', color: '#56697C', fontSize: 13, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>✕</button>
        </div>

        {/* Crisis-line safety header — converting SOS chip to AI button
            does NOT remove safety access. The Military Crisis Line +
            Military OneSource stay one tap away at the top of every
            AI session. */}
        <div style={{ background: '#7F1D1D', color: '#FFFFFF', padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#FECACA', letterSpacing: '.10em', textTransform: 'uppercase' }}>In crisis?</div>
          <a href="tel:988" style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 900, textDecoration: 'underline' }}>988 then 1</a>
          <a href="tel:18003429647" style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, textDecoration: 'underline', opacity: 0.95 }}>OneSource 1-800-342-9647</a>
        </div>

        {/* OPSEC banner */}
        <div style={{ background: '#FFF8E1', color: '#7A4A00', padding: '8px 14px', fontSize: 11, lineHeight: 1.5, borderBottom: '1px solid #FFE082' }}>
          <strong>OPSEC:</strong> never enter classified, FOUO, CUI, sponsor names, GBL numbers, exact unit IDs, or specific operational dates. Treat this as an unclassified planning conversation.
        </div>

        {/* Conversation */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#F8FAFC' }}>
          {messages.length === 0 && (
            <div style={{ color: '#56697C', fontSize: 12, lineHeight: 1.6 }}>
              <p style={{ marginTop: 0 }}>Ask anything about the PCS process. I draw on the Joint Travel Regulations (JTR), the Federal Travel Regulation (FTR), and the Department of State Standardized Regulations (DSSR) — and I'll cite the section every time.</p>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0D1821', marginTop: 8, marginBottom: 4 }}>Try:</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>How do I maximize my PPM payout?</li>
                <li>What pet shipment allowance can I claim for an OCONUS PCS?</li>
                <li>What's the TLE cap for a CONUS move?</li>
                <li>Do I get BAH overseas?</li>
              </ul>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{
                maxWidth: '85%',
                background: m.role === 'user' ? '#0D3B66' : m.role === 'system' ? '#FFF8E1' : '#FFFFFF',
                color: m.role === 'user' ? '#FFFFFF' : '#0D1821',
                padding: '10px 12px',
                borderRadius: 12,
                border: m.role === 'user' ? 'none' : `1px solid ${m.role === 'system' ? '#FFE082' : '#E0E6EE'}`,
                fontSize: 12,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {m.text}
                {m.source && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#56697C', marginTop: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>source: {m.source.replace(/^\s*·\s*/, '')}</div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
              <div className="pcs-skeleton" style={{ background: 'linear-gradient(90deg, #F0F4F8 25%, #FAFBFC 50%, #F0F4F8 75%)', backgroundSize: '200% 100%', animation: 'pcs-skeleton-shimmer 1.4s ease-in-out infinite', borderRadius: 12, padding: '10px 12px', minWidth: 180, height: 40 }} />
            </div>
          )}
        </div>

        {/* Input row */}
        <div style={{ padding: 10, borderTop: '1px solid #E0E6EE', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a JTR / FTR / DSSR question…"
              rows={2}
              maxLength={1000}
              style={{ flex: 1, border: '1px solid #D8DEE7', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#111827', background: '#FFFFFF', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button
              onClick={submit}
              disabled={busy || !question.trim()}
              style={{ padding: '10px 14px', background: busy || !question.trim() ? '#BDBDBD' : '#0D3B66', color: '#FFF', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: busy || !question.trim() ? 'not-allowed' : 'pointer', flexShrink: 0 }}
            >
              {busy ? '…' : 'Send'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#56697C' }}>
            <span>{question.length}/1000 chars · Enter to send · Shift+Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
