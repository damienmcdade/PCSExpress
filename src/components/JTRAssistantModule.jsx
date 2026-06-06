/*
 * JTR Regulatory Assistant.
 *
 * Curated keyword-searchable Q&A over the Joint Travel Regulations
 * (JTR), Federal Travel Regulation (FTR), and DSSR — the three
 * authorities that govern almost every reimbursable PCS dollar. Each
 * answer cites the actual section so the user can verify before
 * claiming and so a finance auditor can trace the source.
 *
 * Search is local (no network call) — match by keyword tokens against
 * question, answer, tags, and citations. An optional "Ask anything"
 * field can route free-text to a backend AI gateway when one is
 * configured; without a configured backend it shows a non-answer with
 * a strong suggestion to escalate to the gaining finance office. The
 * OPSEC banner sits permanently above the free-text input so users
 * never paste classified material.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../config/apiConfig';
// Curated JTR/FTR/DSSR/IRS knowledge base + search live in a shared,
// React-free module so both this tab and the AI chip use one source of
// truth (and so the KB + search can be unit-tested directly).
import { JTR_KB as KB, searchJtrKb } from '../data/jtrKnowledgeBase';


export default function JTRAssistantModule({ theme }) {
  const [query, setQuery] = useState('');
  const [askText, setAskText] = useState('');
  const [askState, setAskState] = useState({ status: 'idle', answer: '', source: '' });
  const askAbort = useRef(null);

  const results = useMemo(() => searchJtrKb(query, KB), [query]);

  useEffect(() => () => { try { askAbort.current?.abort(); } catch {} }, []);

  const submitFreeText = async () => {
    const text = askText.trim();
    if (!text) return;
    if (text.length > 1000) {
      setAskState({ status: 'error', answer: 'Question is too long. Keep it under 1000 characters and try again.', source: '' });
      return;
    }
    setAskState({ status: 'loading', answer: '', source: '' });
    try {
      askAbort.current = new AbortController();
      const timer = setTimeout(() => askAbort.current?.abort(), 30000);
      // Request streaming so the answer renders progressively. Backend
      // falls back to JSON if streaming is unavailable (curated-KB
      // provider) and we handle both paths.
      const r = await fetch(apiUrl('/api/jtr-assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
        body: JSON.stringify({ q: text, stream: true }),
        signal: askAbort.current.signal,
      });
      clearTimeout(timer);
      if (r.status === 404 || r.status === 501) {
        setAskState({
          status: 'fallback',
          answer: 'Free-text JTR Q&A is not configured in this deployment. Use the curated knowledge base above, then escalate to your gaining installation Finance Office / DTMO travel team for cases not covered there. Authoritative sources: travel.dod.mil/Joint-Travel-Regulations and travel.dod.mil/Allowances/Overseas-Housing-Allowance/.',
          source: 'fallback',
        });
        return;
      }
      if (!r.ok) {
        setAskState({ status: 'error', answer: 'Could not reach the assistant. Try again in a minute.', source: '' });
        return;
      }
      const contentType = r.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && r.body) {
        const source = r.headers.get('x-source') || 'anthropic';
        const decoder = new TextDecoder('utf-8');
        const reader = r.body.getReader();
        let buffer = '';
        let acc = '';
        setAskState({ status: 'streaming', answer: '', source });
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nlIdx;
          while ((nlIdx = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, nlIdx);
            buffer = buffer.slice(nlIdx + 2);
            for (const line of frame.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const obj = JSON.parse(payload);
                if (obj?.type === 'content_block_delta' && obj?.delta?.text) {
                  acc += obj.delta.text;
                  setAskState({ status: 'streaming', answer: acc, source });
                }
              } catch { /* ignore malformed frames */ }
            }
          }
        }
        setAskState({ status: 'ready', answer: acc, source });
        return;
      }
      const data = await r.json();
      setAskState({ status: 'ready', answer: String(data?.answer || ''), source: String(data?.source || '') });
    } catch (err) {
      if (err?.name === 'AbortError') {
        setAskState({ status: 'error', answer: 'Request timed out. Try the curated knowledge base above.', source: '' });
      } else {
        setAskState({ status: 'error', answer: 'Network error contacting the assistant.', source: '' });
      }
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary, borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFF', border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>JTR ASSISTANT</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Joint Travel Regulations · ask the way the regs read</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' }}>
          Curated answers to the most-asked JTR / FTR / DSSR questions with the exact section citation. Verify every dollar amount against the latest DTMO / DCPAS / IRS publication before claiming — the regs change yearly and this knowledge base is a planning aid, not a finance authority.
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 12, marginBottom: 14 }}>
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#56697C', letterSpacing: '.08em', marginBottom: 6 }}>SEARCH THE KNOWLEDGE BASE</div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. ppm payout, tle days, pet allowance, oha"
            style={{ width: '100%', border: '1px solid #D8DEE7', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#111827', background: '#FFFFFF', boxSizing: 'border-box' }}
          />
        </label>
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        {results.length === 0 ? (
          <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: 14, fontSize: 12, color: '#7A4A00' }}>
            No curated answer matched. Try the “Ask anything” field below or open the official JTR.
          </div>
        ) : results.map(it => (
          <article key={it.id} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.accent}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 6 }}>{it.q}</div>
            <div style={{ fontSize: 12, color: '#1F2937', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 8 }}>{it.a}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#56697C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{it.citation}</div>
          </article>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: theme.primary, letterSpacing: '.06em', marginBottom: 8 }}>ASK ANYTHING</div>
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#7F0000', lineHeight: 1.5, marginBottom: 8 }}>
          OPSEC: never enter classified, FOUO, CUI, sponsor names, GBL numbers, exact dates, or any data that, if combined, could identify a unit, mission, or movement schedule. Treat this as an unclassified planning conversation.
        </div>
        <textarea
          aria-label="Ask the JTR assistant a question"
          value={askText}
          onChange={e => setAskText(e.target.value)}
          placeholder="e.g. I'm an O-3 PCSing from Fort Bliss to USAG Stuttgart, what allowances should I expect?"
          rows={3}
          maxLength={1000}
          style={{ width: '100%', border: '1px solid #D8DEE7', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#111827', background: '#FFFFFF', boxSizing: 'border-box', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={submitFreeText} disabled={askState.status === 'loading' || askState.status === 'streaming' || !askText.trim()} style={{ padding: '10px 14px', background: askText.trim() ? theme.primary : '#BDBDBD', color: '#FFF', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: askText.trim() ? 'pointer' : 'not-allowed' }}>
            {askState.status === 'loading' ? 'Asking…' : askState.status === 'streaming' ? 'Streaming…' : 'Ask the assistant'}
          </button>
          <span style={{ fontSize: 10, color: '#56697C', alignSelf: 'center' }}>{askText.length}/1000 chars</span>
        </div>
        {askState.status !== 'idle' && askState.answer && (
          <div style={{ marginTop: 10, padding: 12, background: '#F4F7F7', borderRadius: 10, border: '1px solid #E0E6EE' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', letterSpacing: '.06em', marginBottom: 6 }}>
              {askState.status === 'fallback' ? 'NOT CONFIGURED' : askState.status === 'error' ? 'ERROR' : `ASSISTANT · ${askState.source || 'unknown source'}`}
            </div>
            <div style={{ fontSize: 12, color: '#0D1821', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{askState.answer}</div>
            {(askState.status === 'streaming' || askState.status === 'ready') && (
              <div style={{ marginTop: 8, fontSize: 10.5, color: '#8A6D1A', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: '6px 8px', lineHeight: 1.5 }}>
                AI-generated planning summary — it may be incomplete, out of date, or wrong. This is not legal, tax, or financial advice. Verify against the cited JTR / FTR / DSSR / IRS section and your finance office before acting on it.
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, padding: '8px 10px', background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 8, fontSize: 10.5, color: '#56697C', lineHeight: 1.5 }}>
        Planning aid — informational only, not legal, tax, or financial advice. Entitlements are determined by your finance office based on your official orders. Verify every figure against the current JTR / FTR / DSSR / IRS publication.
      </div>

      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        <a href="https://www.travel.dod.mil/Policy-Regulations/Joint-Travel-Regulations/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>Official Joint Travel Regulations (JTR)</a>
        <a href="https://www.gsa.gov/policy-regulations/regulations/federal-travel-regulation" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">Federal Travel Regulation (FTR) — civilians</a>
        <a href="https://allowances.state.gov/Default.asp" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">DSSR — overseas allowance rules</a>
        <a href="https://www.irs.gov/forms-pubs/about-publication-3" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">IRS Publication 3 — Armed Forces Tax Guide</a>
      </div>
    </div>
  );
}
