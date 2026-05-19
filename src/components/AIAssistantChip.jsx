/*
 * AI Assistant — modal + trigger components.
 *
 * The Modal hosts the chat UI: safety header (988 + OneSource),
 * OPSEC banner, conversation pane, free-text input. Routes through
 * /api/jtr-assistant. When the backend returns 501 (no provider
 * configured), the modal falls back to a local curated JTR / FTR /
 * DSSR knowledge base so users get a useful citation-backed answer
 * even when the LLM is offline.
 *
 * The Trigger is just a button. Render it wherever the user expects
 * to find help (sidebar footer above Security, home-page footer
 * above Security, etc.).
 *
 * Multi-turn memory: every request sends the prior conversation as
 * a `history` array so a configured LLM provider can reason about
 * context. The curated-KB fallback ignores history (it's a
 * keyword-search responder, not a chat model).
 *
 * Safety-critical decisions baked in:
 *   1. Crisis line (988 then 1) + OneSource pinned as a header in
 *      every AI conversation. We swap the SOS button for an AI
 *      button; we do not remove safety access.
 *   2. OPSEC banner permanent above the input.
 *   3. Input length capped at 1000 chars matching backend validator.
 *   4. Submit disabled while a request is in flight or input empty.
 *   5. Conversation state is wiped on modal close; nothing is
 *      persisted beyond an audit metadata event.
 */

import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../config/apiConfig';
import { AuditLogger } from '../security/SecurityExtensions';

// Curated knowledge base — same content as JTRAssistantModule's KB but
// kept inline here so the modal works fully offline / without the LLM
// provider being configured. When this list grows, refactor both
// callers to import a shared module.
const CURATED_KB = [
  { tags: ['ppm','dity','max','payout','reimbursement','weight','hhg'], citation: 'JTR §050302 / DTMO PPM Worksheet / IRS Form 3903',
    q: 'How do I maximize my PPM (Personally Procured Move) payout?',
    a: 'PPM reimburses 100% of the Best Value Cost the government would have paid for the same shipment, up to your weight allowance, when you move yourself. To maximize:\n1) Weigh empty, then fully loaded — keep both certified weight tickets.\n2) Stay at or below your authorized weight allowance.\n3) Track every direct moving expense (rental truck, fuel, packing materials, tolls, hired labor).\n4) Submit through DPS within 45 days of arrival.' },
  { tags: ['tle','tla','temporary lodging','per diem','m&ie','allowance'], citation: 'JTR §050501 (TLE) / §050502 (TLA)',
    q: 'How many days of TLE / TLA am I entitled to?',
    a: 'TLE covers up to 14 days for CONUS PCS combined between losing and gaining duty stations. TLA covers up to 60 days OCONUS (extensible to 100). Both reimburse lodging cost up to the locality per-diem ceiling plus a percentage of M&IE based on family size.' },
  { tags: ['dla','dislocation','allowance','reimbursement','miscellaneous'], citation: 'JTR §050601',
    q: 'What is Dislocation Allowance (DLA) and how much will I get?',
    a: 'DLA is a one-time payment that partially reimburses miscellaneous PCS expenses. Paid automatically on PCS. Amount equals roughly 2 months of the With-Dependents BAH at sponsor rank (or E-4 if without dependents). DTMO publishes exact figures yearly.' },
  { tags: ['pov','vehicle','ship','vpc','dd 788','oconus'], citation: 'JTR §053201 / 32 CFR 102.2',
    q: 'When can I ship my POV at government expense?',
    a: 'One POV may be shipped at government expense on OCONUS PCS (Korea, Japan, Germany, etc.). CONUS-to-CONUS PCS does NOT authorize POV shipment. Use DD Form 788 and the Vehicle Processing Center (VPC) network at vpcus.com.' },
  { tags: ['bah','oha','miha','lqa','overseas','oconus','housing'], citation: 'JTR §100301 (OHA) / DSSR §130 (LQA)',
    q: 'Do I get BAH overseas?',
    a: 'No — BAH does not apply OCONUS. Service members receive Overseas Housing Allowance (OHA), Utility/Recurring Maintenance Allowance, and a one-time Move-In Housing Allowance (MIHA). DoD civilians get Living Quarters Allowance (LQA) under DSSR §130. Look up OHA at travel.dod.mil.' },
  { tags: ['pet','animal','shipment','allowance','reimbursement','quarantine'], citation: 'JTR §053703',
    q: 'Is there a pet shipment allowance?',
    a: 'Yes. For OCONUS PCS, reimbursement up to $2,000 per family ($550 CONUS) for pet shipment — boarding, transit, quarantine, mandatory health certificates, approved pet transport. Submit via the travel voucher (DD 1351-2).' },
  { tags: ['hht','house hunting','civilian','ftr','conus'], citation: 'FTR §302-5',
    q: 'Can I take a House Hunting Trip (HHT) before PCS?',
    a: 'Civilian-only entitlement under FTR §302-5. HHT is CONUS-only — a round trip for employee and one accompanying family member, up to 10 days. Military members do NOT get HHT; they use DLA + TLE. OCONUS DoD civilians do not get HHT.' },
  { tags: ['real estate','civilian','reimbursement','closing','broker','ftr'], citation: 'FTR §302-11',
    q: 'Is selling / buying a home reimbursable on a civilian PCS?',
    a: 'Yes — DoD civilians may claim the Real Estate Expense Allowance under FTR §302-11 for selling the losing primary residence and buying at the gaining locality. Reimbursable: broker commissions, closing costs, title insurance, attorney fees. Caps apply. Military do NOT have a comparable benefit.' },
  { tags: ['czte','combat zone','tax','exclusion','irc 112','irs'], citation: 'IRC §112 / IRS Pub 3 / 26 USC §112',
    q: 'How does the Combat Zone Tax Exclusion work?',
    a: 'Active-duty pay earned in a designated Combat Zone is excluded from federal income tax under IRC §112. Enlisted members exclude all pay; officers exclude up to the maximum enlisted pay + Imminent Danger Pay. Automatic on the W-2 (Box 12 code Q).' },
  { tags: ['feie','foreign earned income','form 2555','civilian','oconus','tax'], citation: 'IRS Pub 54 / IRS Form 2555 / 26 USC §911',
    q: 'Can OCONUS DoD civilians claim the Foreign Earned Income Exclusion (FEIE)?',
    a: 'Potentially. IRS Form 2555 lets U.S. citizens working abroad exclude up to ~$120,000 of foreign earned income if they meet the bona fide residence or physical presence test. Interaction with LQA is non-trivial — consult the installation Tax Center or VITA volunteer.' },
  { tags: ['weight','allowance','hhg','rank','dependents','pro-gear'], citation: 'JTR Table 5-37 / FTR §302-7',
    q: 'How is my HHG weight allowance calculated?',
    a: 'Set by rank and dependency status per JTR Table 5-37. E-5 with deps = 9,000 lbs; E-9 with deps = 15,000; O-1 with deps = 12,000; O-6 with deps = 18,000. Civilians get a flat 18,000 lbs under FTR §302-7. Pro-gear (books, instruments, tools of trade) exempt up to 2,000 lbs sponsor + 500 spouse.' },
  { tags: ['malt','mileage','pov','reimbursement','dtod','travel'], citation: 'JTR §020205 / DTMO mileage page',
    q: 'What is the POV mileage rate (MALT) for PCS travel?',
    a: 'MALT reimburses POV travel at the published JTR rate per authorized mile. Set annually by DTMO. Significantly lower than IRS business rate. Distance is from the Defense Table of Official Distances (DTOD), not your odometer.' },
  { tags: ['claim','damage','dps','tsp','dd 1840','frv','window'], citation: 'JTR §054305 / DTR Part IV Chapter 401',
    q: 'How long do I have to file a damage claim against the TSP?',
    a: 'Soft target: 75 days from delivery to file via DPS for full Best Replacement Value (FRV) coverage. Hard deadline: 9 months from delivery (TSP only owes Depreciated Replacement Value after that). Annotate damage on DD 1840R at delivery, supplement via DPS within the window.' },
];

function searchKB(query) {
  const tokens = String(query || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length === 0) return null;
  let best = null;
  let bestScore = 0;
  for (const item of CURATED_KB) {
    const haystack = `${item.q} ${item.a} ${item.tags.join(' ')} ${item.citation}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (haystack.includes(t)) score += 2;
      if (item.tags.includes(t)) score += 3;
    }
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore >= 4 ? best : null; // require at least one tag hit + one body hit
}

// ── Trigger button. Two stylistic variants, both branch-aware.
export function AIAssistantTrigger({ onClick, variant = 'sidebar', theme, label = 'AI Assistant', ariaLabel = 'Open AI Assistant' }) {
  if (variant === 'sidebar') {
    // Sidebar footer button — sits above the Security button.
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

// ── Modal. Renders only when `open` is true. Controlled by parent.
export function AIAssistantModal({ open, onClose, isDesktop }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Reset conversation every time the modal opens so nothing persists
  // across user sessions or chip toggles.
  useEffect(() => {
    if (open) {
      setMessages([]);
      setQuestion('');
      AuditLogger.record('ai_assistant_opened', {});
      // Focus the input so keyboard users land in the right place.
      setTimeout(() => { try { inputRef.current?.focus(); } catch {} }, 50);
    }
  }, [open]);

  useEffect(() => () => { try { abortRef.current?.abort(); } catch {} }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const submit = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setQuestion('');
    const nextHistory = [...messages, { role: 'user', text: q }];
    setMessages(nextHistory);
    setBusy(true);

    try {
      abortRef.current = new AbortController();
      const timer = setTimeout(() => abortRef.current?.abort(), 20_000);
      // Multi-turn memory: send the full conversation history (capped
      // at the last 12 messages) so a configured LLM provider can
      // reason about context. The backend may ignore `history` until
      // the operator wires in a real provider that supports it.
      const history = nextHistory.slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', text: m.text }));
      const r = await fetch(apiUrl('/api/jtr-assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ q, history }),
        signal: abortRef.current.signal,
      });
      clearTimeout(timer);

      if (r.status === 501) {
        // Provider not configured. Try the local curated KB before
        // giving up. This makes the AI button useful immediately
        // out of the box, with citations, while the operator wires
        // up the LLM provider on their own timeline.
        const hit = searchKB(q);
        if (hit) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: `${hit.a}\n\n[Citation: ${hit.citation}]\n\nNote: live AI is not configured in this deployment yet. This answer was matched from the curated JTR / FTR / DSSR knowledge base.`,
            source: 'curated-kb',
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'system',
            text: 'Live AI is not configured in this deployment, and the curated knowledge base did not have a matching entry. Open the JTR Assistant tab inside Movement & Logistics for the full curated library, or escalate this question to your gaining installation Finance Office.',
          }]);
        }
      } else if (!r.ok) {
        setMessages(prev => [...prev, { role: 'system', text: 'Could not reach the assistant. Try again in a minute or use the JTR Assistant tab.' }]);
      } else {
        const data = await r.json();
        const answer = String(data?.answer || '').trim();
        const src = data?.source ? String(data.source) : '';
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
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

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

        {/* Crisis-line safety header — preserved on every AI session.
            The chip changed from SOS to AI; the safety net did not. */}
        <div style={{ background: '#7F1D1D', color: '#FFFFFF', padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#FECACA', letterSpacing: '.10em', textTransform: 'uppercase' }}>In crisis?</div>
          <a href="tel:988" aria-label="Call 988 then 1, Military Crisis Line" style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 900, textDecoration: 'underline' }}>988 then 1</a>
          <a href="tel:18003429647" aria-label="Call 1-800-342-9647, Military OneSource" style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, textDecoration: 'underline', opacity: 0.95 }}>OneSource 1-800-342-9647</a>
        </div>

        <div style={{ background: '#FFF8E1', color: '#7A4A00', padding: '8px 14px', fontSize: 11, lineHeight: 1.5, borderBottom: '1px solid #FFE082' }}>
          <strong>OPSEC:</strong> never enter classified, FOUO, CUI, sponsor names, GBL numbers, exact unit IDs, or specific operational dates. Treat this as an unclassified planning conversation.
        </div>

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
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#56697C', marginTop: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>source: {m.source}</div>
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

        <div style={{ padding: 10, borderTop: '1px solid #E0E6EE', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a JTR / FTR / DSSR question…"
              aria-label="Type your question to the AI Assistant"
              rows={2}
              maxLength={1000}
              style={{ flex: 1, border: '1px solid #D8DEE7', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#111827', background: '#FFFFFF', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button
              onClick={submit}
              disabled={busy || !question.trim()}
              aria-label="Send question to AI Assistant"
              style={{ padding: '10px 14px', background: busy || !question.trim() ? '#BDBDBD' : '#0D3B66', color: '#FFF', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: busy || !question.trim() ? 'not-allowed' : 'pointer', flexShrink: 0 }}
            >
              {busy ? '…' : 'Send'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#56697C' }}>
            <span>{question.length}/1000 chars · Enter to send · Shift+Enter for newline · Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default export keeps the old single-component import working for
// callers that still wrap chip + modal together (none today, but
// guards against future imports breaking).
export default AIAssistantModal;
