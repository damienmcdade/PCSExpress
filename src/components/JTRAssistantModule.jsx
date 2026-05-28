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

const KB = [
  {
    id: 'ppm-max',
    q: 'How do I maximize my PPM (Personally Procured Move) payout?',
    a: `PPM (formerly DITY) reimburses 100 % of the Best Value Cost the government would have paid for the same shipment, up to your weight allowance, when you move yourself. To maximize the payout:
1) Weigh empty, then weigh fully loaded — keep both certified weight tickets. Without them you do not get paid.
2) Stay at or below your authorized weight allowance for your grade and dependency status — overweight pounds are not reimbursed.
3) Track every direct moving expense (rental truck, fuel, packing materials, tolls, hired labor, tow dolly). These reduce your taxable income on the PPM payment via IRS Form 3903.
4) Submit through DPS within 45 days of arrival.`,
    tags: ['ppm','dity','max','payout','reimbursement','weight','hhg'],
    citation: 'JTR §050302 / DTMO PPM Worksheet / IRS Form 3903',
  },
  {
    id: 'tle-cap',
    q: 'How many days of TLE / TLA am I entitled to?',
    a: `Temporary Lodging Expense (TLE) covers up to 14 days for CONUS PCS — combined between losing and gaining duty stations.
TLA (Temporary Lodging Allowance) covers up to 60 days OCONUS (extensible to 100). Both reimburse the lodging cost up to the locality per-diem ceiling plus a percentage of M&IE based on family size.`,
    tags: ['tle','tla','temporary lodging','per diem','m&ie','allowance'],
    citation: 'JTR §050501 (TLE) / §050502 (TLA)',
  },
  {
    id: 'dla',
    q: 'What is Dislocation Allowance (DLA) and how much will I get?',
    a: `DLA is a one-time payment that partially reimburses miscellaneous PCS expenses (utility deposits, cleaning, supplies). It is paid automatically on PCS to/from any duty station. The amount equals approximately 2 months of the With-Dependents BAH at the rank of the sponsor (or rank E-4 if without dependents at the old station). DTMO publishes the exact dollar figures each year.`,
    tags: ['dla','dislocation','allowance','reimbursement','miscellaneous'],
    citation: 'JTR §050601',
  },
  {
    id: 'pov-ship',
    q: 'When can I ship my POV at government expense?',
    a: `One POV may be shipped at government expense on OCONUS PCS (e.g., Korea, Japan, Germany). CONUS-to-CONUS PCS does not authorize POV shipment — you drive or pay yourself. Use DD Form 788 and the Vehicle Processing Center (VPC) network at vpcus.com to schedule the drop. Second-POV shipment may be authorized at specific overseas locations with prior approval.`,
    tags: ['pov','vehicle','ship','vpc','dd 788','oconus'],
    citation: 'JTR §053201 / 32 CFR 102.2',
  },
  {
    id: 'oconus-bah',
    q: 'Do I get BAH overseas?',
    a: `No — BAH does not apply OCONUS. Service members assigned overseas receive Overseas Housing Allowance (OHA) at the locality rent ceiling, plus the Utility/Recurring Maintenance Allowance and a one-time Move-In Housing Allowance (MIHA-Rent / MIHA-Security / MIHA-Miscellaneous). DoD civilians receive Living Quarters Allowance (LQA) under DSSR §130. Look up the OHA rate at travel.dod.mil.`,
    tags: ['bah','oha','miha','lqa','overseas','oconus','housing'],
    citation: 'JTR §100301 (OHA) / DSSR §130 (LQA)',
  },
  {
    id: 'pet-allowance',
    q: 'Is there a pet shipment allowance?',
    a: `Yes. For OCONUS PCS the JTR authorizes reimbursement up to $2,000 per family ($550 CONUS) for pet shipment when the move qualifies — boarding fees, transit, quarantine, mandatory health certificates, and approved pet transport. Reimbursement is per family, not per pet, so consolidate receipts. Submit through your travel voucher (DD 1351-2).`,
    tags: ['pet','animal','shipment','allowance','reimbursement','quarantine'],
    citation: 'JTR §053703',
  },
  {
    id: 'hht-civilian',
    q: 'Can I take a House Hunting Trip (HHT) before PCS?',
    a: `Civilian-only entitlement under the Federal Travel Regulation §302-5. HHT is a CONUS-only round trip for the employee and one accompanying family member to search for housing at the gaining locality, up to 10 days. Military service members do NOT get HHT — they use the regular DLA + TLE package instead. OCONUS DoD civilians do not get HHT; coordinate with the gaining Housing Office (HOMES.mil) for off-base reconnaissance.`,
    tags: ['hht','house hunting','civilian','ftr','conus'],
    citation: 'FTR §302-5',
  },
  {
    id: 'real-estate-allowance',
    q: 'Is selling / buying a home reimbursable on a civilian PCS?',
    a: `Yes — DoD civilians may claim the Real Estate Expense Allowance under FTR §302-11 for selling a primary residence at the losing locality and buying at the gaining locality. Reimbursable: broker commissions, closing costs, title insurance, attorney fees. Caps and percentages apply. Service members do NOT have a comparable benefit; military RE costs are out-of-pocket.`,
    tags: ['real estate','civilian','reimbursement','closing','broker','ftr'],
    citation: 'FTR §302-11',
  },
  {
    id: 'czte',
    q: 'How does the Combat Zone Tax Exclusion work?',
    a: `Active-duty pay earned while serving in a designated Combat Zone is excluded from federal income tax under IRC §112. Enlisted members exclude all pay; officers exclude up to the maximum enlisted pay + Imminent Danger Pay. The exclusion is automatic on the W-2 (Box 12 code Q) and extends to bonuses, leave, and re-enlistment payments earned in-zone. State income tax treatment varies; verify with the installation Tax Center.`,
    tags: ['czte','combat zone','tax','exclusion','irc 112','irs'],
    citation: 'IRC §112 / IRS Pub 3 / 26 USC §112',
  },
  {
    id: 'feie-civilian',
    q: 'Can OCONUS DoD civilians claim the Foreign Earned Income Exclusion (FEIE)?',
    a: `Potentially. IRS Form 2555 lets U.S. citizens working abroad exclude up to ~$120,000 of foreign earned income if they meet the bona fide residence or physical presence test. The interaction with LQA, the Foreign Tax Credit, and the bona fide residence requirement is non-trivial — consult the installation Tax Center or VITA volunteer. LQA itself is not taxable. Wages may or may not qualify depending on whether you’re paid as a U.S. employee.`,
    tags: ['feie','foreign earned income','form 2555','civilian','oconus','tax'],
    citation: 'IRS Pub 54 / IRS Form 2555 / 26 USC §911',
  },
  {
    id: 'weight-allowance',
    q: 'How is my HHG weight allowance calculated?',
    a: `Weight allowance is set by rank and dependency status, per JTR Table 5-37. Examples: E-5 with dependents = 9,000 lbs; E-9 with dependents = 15,000 lbs; O-1 with dependents = 12,000 lbs; O-6 with dependents = 18,000 lbs. DoD civilians get a flat 18,000 lbs regardless of grade under FTR §302-7. Pro-gear (books, instruments, tools of trade) is exempt up to 2,000 lbs sponsor + 500 lbs spouse and does NOT count against the allowance.`,
    tags: ['weight','allowance','hhg','rank','dependents','pro-gear'],
    citation: 'JTR Table 5-37 / FTR §302-7',
  },
  {
    id: 'malt-mileage',
    q: 'What is the POV mileage rate (MALT) for PCS travel?',
    a: `MALT (Monetary Allowance in Lieu of Transportation) reimburses POV travel during a PCS at the published JTR rate per authorized mile. The rate is set annually by DTMO and is significantly lower than the IRS business rate — verify the current figure on the DTMO mileage page. Distance is calculated on the Defense Table of Official Distances (DTOD), not your odometer.`,
    tags: ['malt','mileage','pov','reimbursement','dtod','travel'],
    citation: 'JTR §020205 / DTMO mileage page',
  },
  {
    id: 'tle-vs-tla',
    q: 'TLE vs TLA — what is the difference?',
    a: `TLE = Temporary Lodging Expense (CONUS). Up to 14 days combined across losing and gaining. Lodging up to per-diem + percentage of M&IE based on family. TLA = Temporary Lodging Allowance (OCONUS). Up to 60 days at the gaining station (extensible to 100). Same flavor, different scope.`,
    tags: ['tle','tla','difference','temporary lodging','conus','oconus'],
    citation: 'JTR §050501 (TLE) / §050502 (TLA)',
  },
  {
    id: 'claim-window',
    q: 'How long do I have to file a damage claim against the TSP?',
    a: `Soft target: 75 days from delivery to file an itemized claim via DPS for full Best Replacement Value (FRV) coverage. Hard deadline: 9 months from delivery, after which the TSP only owes Depreciated Replacement Value. Annotate damage on the DD 1840R at delivery, then supplement via DPS within the window.`,
    tags: ['claim','damage','dps','tsp','dd 1840','frv','window'],
    citation: 'JTR §054305 / DTR Part IV Chapter 401',
  },
];

function tokenize(s) {
  return String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function scoreItem(item, qTokens) {
  const haystack = `${item.q} ${item.a} ${item.tags.join(' ')} ${item.citation}`.toLowerCase();
  let s = 0;
  for (const t of qTokens) {
    if (haystack.includes(t)) s += 2;
    if (item.tags.includes(t)) s += 3;
  }
  return s;
}

export default function JTRAssistantModule({ theme }) {
  const [query, setQuery] = useState('');
  const [askText, setAskText] = useState('');
  const [askState, setAskState] = useState({ status: 'idle', answer: '', source: '' });
  const askAbort = useRef(null);

  const results = useMemo(() => {
    const qTokens = tokenize(query);
    if (!qTokens.length) return KB;
    return KB
      .map(it => ({ ...it, _score: scoreItem(it, qTokens) }))
      .filter(it => it._score > 0)
      .sort((a, b) => b._score - a._score);
  }, [query]);

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
          answer: 'Free-text JTR Q&A is not configured in this deployment. Use the curated knowledge base above, then escalate to your gaining installation Finance Office / DTMO travel team for cases not covered there. Authoritative sources: travel.dod.mil/Joint-Travel-Regulations and travel.dod.mil/site/oha.cfm.',
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
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <a href="https://www.travel.dod.mil/Policy-Regulations/Joint-Travel-Regulations/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>Official Joint Travel Regulations (JTR)</a>
        <a href="https://www.gsa.gov/policy-regulations/regulations/federal-travel-regulation" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">Federal Travel Regulation (FTR) — civilians</a>
        <a href="https://allowances.state.gov/Default.asp" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">DSSR — overseas allowance rules</a>
        <a href="https://www.irs.gov/forms-pubs/about-publication-3" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">IRS Publication 3 — Armed Forces Tax Guide</a>
      </div>
    </div>
  );
}
