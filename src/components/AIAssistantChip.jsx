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
  // ── App-feature entries — answer "where do I find X in the app"
  // style questions. Citations point to the in-app surface, not
  // to a regulation. Keeps the AI Assistant useful for product
  // navigation, not just travel-reg lookup.
  { tags: ['ship','shipment','tracker','track','hhg','gbl','dps','movement','logistics'], citation: 'In-app: Movement & Logistics → Shipment Tracker',
    q: 'Where do I track my HHG shipment in the app?',
    a: 'Movement & Logistics → Shipment Tracker. The 10-stage milestone ladder mirrors the JTR DPS lifecycle (counseling → TSP assigned → pre-move survey → packing → loaded → in transit → arrival call → delivered → claim filed → claim settled). Enter your GBL/TCN, TSP, and spread windows. Overdue stages flash amber. Optional browser-push alerts.' },
  { tags: ['inventory','worksheet','dd 1840','claim','items','rooms','add item'], citation: 'In-app: Movement & Logistics → Inventory & Claims',
    q: 'How do I record an HHG inventory in the app?',
    a: 'Movement & Logistics → Inventory & Claims. Walk every room before pack-out, add each item (name, room, declared value, condition, notes). Switch to "post-delivery" phase at arrival and re-walk. Export the DD 1840R-ready PDF for DPS damage claims. Text-only — PCS Express does not accept uploads.' },
  { tags: ['binder','paperwork','documents','export','pdf','checklist'], citation: 'In-app: PCS Operations → Paperwork',
    q: 'How do I export the PCS Binder?',
    a: 'PCS Operations → Paperwork. Check each document off as you collect the physical paperwork yourself. Tap "Export PCS Binder Checklist (PDF)" to generate a printable list for your gaining S1 / HR / VA. PCS Express never accepts, stores, or transmits document uploads.' },
  { tags: ['budget','inflation','cost','expense','tracker','money','fuel','lodging'], citation: 'In-app: Movement & Logistics → Budget',
    q: 'Where is the inflation-adjusted PCS budget?',
    a: 'Movement & Logistics → Budget. Each expense row shows a 2026 planning range built from BLS CPI (gasoline, lodging, food) and GSA per-diem ceilings. Enter your actual cost; if it exceeds the high estimate, a callout suggests coordinating supplemental reimbursement with finance.' },
  { tags: ['chaplain','spiritual','faith','worship','installation chaplain'], citation: 'In-app: Family Readiness → Faith & Chaplains',
    q: 'Where do I find the chaplain at my gaining installation?',
    a: 'Family Readiness → Faith & Chaplains. Lists every on-base chapel office at the gaining installation with denomination, address, service times, and a tap-to-call number. Branch Chaplain Corps reference card sits below in case the installation isn\'t curated yet.' },
  { tags: ['oha','rate','overseas housing','lookup','dtmo'], citation: 'In-app: Movement & Logistics → BAH / OHA Calculator',
    q: 'How do I look up the OHA rate for my OCONUS base?',
    a: 'Movement & Logistics → BAH / OHA Calculator. If your profile is OCONUS the calculator switches to OHA mode and surfaces DTMO/OHA rate lookup, MIHA, COLA, DSSR §130 LQA, DSSR §240 TQSA, HOMES.mil, and AHRN as a single resource grid.' },
  { tags: ['translation','language','interpreter','free','onesource','dlfilc','jko'], citation: 'In-app: Family Readiness → Translation → Free Resources',
    q: 'Where do I find free translation help for OCONUS?',
    a: 'Family Readiness → Translation → Free Resources tab. Lists DoD-funded translation resources gated to your component: Military OneSource interpreter referrals, DLIFLC public modules, JKO language courses, JLU, Rosetta Stone via branch portal, Yellow Ribbon (Reserve/Guard), Federal EAP (Civilians), DSSR §240 language reimbursement (OCONUS Civilians), TRICARE/TOP/FEHB interpreter lines.' },
  { tags: ['mission lanes','today','this week','before you report','tasks'], citation: 'In-app: Command Center → Mission Lanes',
    q: 'What are the Mission Lanes on the Command Center?',
    a: 'The Today / This Week / Before You Report card on the home dashboard pulls UNCHECKED items from your tailored PCS checklist and buckets them by current phase / next phase / future phases. Checking an item in PCS Operations → Checklist removes it from the lanes automatically.' },
  { tags: ['compliance','security','encryption','data','privacy','aes','lock'], citation: 'In-app: Command Center → 🔒 Security & data handling',
    q: 'How do I open the Compliance / Security page?',
    a: 'Tap the 🔒 "Security & data handling" button at the bottom of Command Center (or in the desktop sidebar footer). The modal shows where your data lives (on your phone), how it\'s protected (AES-256), what we never collect, and the public-standard alignments (NIST, DISA, OWASP).' },
  { tags: ['ai','assistant','jtr assistant','help','chat','question'], citation: 'In-app: AI Assistant button',
    q: 'How does the AI Assistant work?',
    a: 'Tap the 🤖 AI Assistant button (above Security in the sidebar or home footer). Ask any PCS, JTR/FTR/DSSR, or PCS Express navigation question. If the live AI provider isn\'t configured, the assistant falls back to a curated knowledge base. The crisis line (988 then 1) and Military OneSource (1-800-342-9647) stay pinned at the top of every conversation.' },
  { tags: ['pcs operations','checklist','phases','tasks'], citation: 'In-app: PCS Operations',
    q: 'Where is the PCS Checklist?',
    a: 'PCS Operations is the mission group that hosts Checklist, Paperwork, and the Dynamic Timeline. The phased Checklist runs Orders Received → 90 Days Out → 60 Days Out → 30 Days Out → Move Week → In-Processing. It\'s tailored to your branch, component, orders type, and family situation, so unrelated tasks are hidden automatically.' },
  { tags: ['fitness','gym','workout','diet','meal','holistic'], citation: 'In-app: Holistic Health → Fitness',
    q: 'Where do I find gym + PCS-fitness tips in the app?',
    a: 'Holistic Health → Fitness tab. Three sections: On-Base Gym & Fitness (MWR / H2F / Fit-to-Fight), Staying Fit During PCS Travel (hotel-room workouts + drive-day movement basics), and Diet & Meal Tips for Traveling (Performance Triad nutrition, MyPlate, TRICARE nutrition counseling, cooler-pack meal planning).' },
  { tags: ['pet','quarantine','japan','germany','rabies','aphis','country'], citation: 'In-app: Family Readiness → Pets',
    q: 'Where do I see country-specific pet import rules?',
    a: 'Family Readiness → Family → Pets. The country-rules banner surfaces automatically when your gaining installation is OCONUS — covers Germany (TRACES), Japan (180-day FAVN), Hawaii (Direct Airport Release), Korea (AQIS), UK GB AHC, and 12 other countries with realistic lead times and USDA APHIS links.' },
  { tags: ['veteran','va','support','vet'], citation: 'In-app: Mission Resources → Veteran Support',
    q: 'Where do I find veteran resources in the app?',
    a: 'Mission Resources → Veteran Support. Veteran-owned business directories, public veteran resources, and local search around your gaining location. The Family Readiness group also surfaces VA-side benefits (GI Bill, VA Loan, Vet Center) where relevant.' },
];

// Parse an "In-app: <Group> → <Subtab>" hint out of an assistant
// message body or source field and map it to the deep-link route IDs
// used by the rest of the app. Returns { tab, sub, label } or null.
const INAPP_GROUP_MAP = {
  'command center':         { tab: 'home' },
  'pcs operations':         { tab: 'pcs-operations' },
  'movement & logistics':   { tab: 'home-relocation' },
  'movement and logistics': { tab: 'home-relocation' },
  'home relocation':        { tab: 'home-relocation' },
  'family readiness':       { tab: 'family-readiness' },
  'holistic health':        { tab: 'medical-readiness' },
  'medical readiness':      { tab: 'medical-readiness' },
  'mission resources':      { tab: 'mission-resources' },
};
const INAPP_SUBTAB_MAP = {
  // Movement & Logistics
  'home locator':       'home-locator',
  'bah calculator':     'bah-calculator',
  'oha calculator':     'bah-calculator',
  'bah / oha':          'bah-calculator',
  'bah / oha / lqa':    'bah-calculator',
  'lqa calculator':     'bah-calculator',
  'ppm estimator':      'ppm-estimator',
  'budget tracker':     'budget-tracker',
  'budget':             'budget-tracker',
  'shipment tracker':   'shipment-tracker',
  'inventory & claims': 'inventory-claims',
  'inventory':          'inventory-claims',
  'jtr assistant':      'jtr-assistant',
  'move aid':           'move-aid',
  'va loan':            'va-loan',
  // PCS Operations
  'checklist':          'checklist',
  'paperwork':          'documents',
  'documents':          'documents',
  'timeline':           'timeline',
  // Family Readiness
  'family':             'family',
  'education':          'education',
  'translation':        'translation',
  'faith & chaplains':  'faith',
  'faith':              'faith',
  'chaplains':          'faith',
  // Holistic Health
  'medical care':       'medical',
  'behavioral health':  'behavioral',
  'behavioral health & counseling': 'behavioral',
  'spiritual care':     'spiritual',
  'fitness':            'fitness',
  // Mission Resources
  'base insights':      'base-insights',
  'maps':               'maps',
  'help hub':           'help-hub',
  'veteran support':    'veteran',
};
function parseInappCitation(message) {
  if (!message) return null;
  const candidates = [];
  if (typeof message.source === 'string') candidates.push(message.source);
  if (typeof message.text === 'string')   candidates.push(message.text);
  for (const c of candidates) {
    // Matches both en-dash and arrow separator variants we use in the
    // curated KB ("In-app: Movement & Logistics → Shipment Tracker")
    // and freer LLM phrasing like "In-app: Family Readiness > Family".
    const m = c.match(/In-app:\s*([^→>\n]+?)\s*(?:→|>|->)\s*([^.\n]+?)(?:[.\n]|$)/i);
    if (!m) continue;
    const groupKey = String(m[1] || '').trim().toLowerCase();
    const subKey   = String(m[2] || '').trim().toLowerCase().replace(/[.,]$/, '');
    const group = INAPP_GROUP_MAP[groupKey];
    if (!group) continue;
    const sub = INAPP_SUBTAB_MAP[subKey] || null;
    return { tab: group.tab, sub, label: `${m[1].trim()} → ${m[2].trim().replace(/[.,]$/, '')}` };
  }
  return null;
}

// Build a printable HTML transcript of the conversation and open it
// in a new window with the print dialog cued. The user prints to PDF
// the same way they export PCS Binder and Inventory worksheets.
// No external PDF library — keeps the dependency footprint flat.
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function exportConversationAsPdf(messages, language) {
  if (!messages || messages.length === 0) return;
  const rows = messages.map(m => {
    const roleLabel = m.role === 'user' ? 'You' : m.role === 'system' ? 'System' : 'AI Assistant';
    const roleColor = m.role === 'user' ? '#0D3B66' : m.role === 'system' ? '#7A4A00' : '#1B5E20';
    const sourceLine = m.source ? `<div style="font-size:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#56697C;margin-top:6px">source: ${escapeHtml(m.source)}</div>` : '';
    return `
      <div style="margin-bottom:14px">
        <div style="font-size:10px;font-weight:900;color:${roleColor};letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">${roleLabel}</div>
        <div style="font-size:12px;color:#0D1821;line-height:1.6;white-space:pre-wrap">${escapeHtml(m.text)}</div>
        ${sourceLine}
      </div>
    `;
  }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8" />
<title>PCS Express — AI Assistant transcript</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0D1821; padding: 24px; max-width: 720px; margin: 0 auto; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .meta { font-size: 11px; color: #56697C; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #E0E6EE; }
  .opsec { background: #FFF8E1; border: 1px solid #FFE082; border-radius: 6px; padding: 8px 10px; font-size: 11px; color: #7A4A00; margin-bottom: 14px; }
  .stamp { margin-top: 22px; padding-top: 10px; border-top: 1px solid #E0E6EE; font-size: 10px; color: #56697C; }
</style>
</head><body>
  <h1>AI Assistant transcript</h1>
  <div class="meta">
    Generated: ${escapeHtml(new Date().toISOString())}<br />
    Language: ${escapeHtml(language || 'en')}<br />
    Messages: ${messages.length}
  </div>
  <div class="opsec">
    This transcript reflects an unclassified PCS planning conversation. Verify all dollar amounts, day counts, and weight figures against the official DTMO / GSA / IRS publication before claiming.
  </div>
  ${rows}
  <div class="stamp">
    PCS Express AI Assistant. The conversation was not stored on any PCS Express server — this transcript is the only copy.
  </div>
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Pop-up blocked. Allow pop-ups for PCS Express to export the transcript.'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 300);
}

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
// `language` is forwarded to /api/jtr-assistant so the LLM responds
// in the user's preferred app language. `initialQuestion` (or a
// global `open-ai-assistant` CustomEvent with detail.question) pre-
// fills the input so callers like "Explain this phase" buttons in
// PCS Operations can drop the user into the chat with the question
// already typed.
// Render the user's PCS context as a short JSON-shaped string the
// backend can include in the LLM system prompt. Keeps a compact, easy
// shape so the model can quote it back as citations without us having
// to teach it a schema. The curated-KB fallback also reads it directly
// to answer "what's overdue" / "what should I do this week" without
// needing a configured LLM provider.
function formatUserContextForPrompt(ctx) {
  if (!ctx) return null;
  const parts = [
    `branch=${ctx.branch || '—'}`,
    `rank=${ctx.rank || '—'}`,
    `component=${ctx.component || '—'}`,
    `ordersType=${ctx.ordersType || '—'}`,
    `moveType=${ctx.moveType || '—'}`,
    ctx.isOverseas ? 'OCONUS=yes' : 'CONUS=yes',
    ctx.hasDependents ? 'dependents=yes' : null,
    ctx.hasChildren ? 'children=yes' : null,
    ctx.hasPets ? 'pets=yes' : null,
    ctx.daysUntilTarget !== null ? `daysUntilReportDate=${ctx.daysUntilTarget}` : null,
    ctx.currentPhase ? `currentPhase=${ctx.currentPhase}` : null,
    ctx.openTaskCount > 0 ? `openTasksInPhase=${ctx.openTaskCount}` : null,
  ].filter(Boolean).join(', ');
  return parts;
}

// Curated answers for the highest-traffic context-aware questions.
// Used by the KB fallback (no LLM provider configured) so the user
// gets a tailored answer even without an API key.
function curatedContextAnswer(question, ctx) {
  if (!ctx) return null;
  const q = question.toLowerCase();
  const overdueAsk    = /overdue|past due|behind|missed/i.test(q);
  const thisWeekAsk   = /this week|next.*step|what.*do.*now|what.*next|today/i.test(q);
  if (overdueAsk && ctx.openTaskCount > 0 && ctx.currentPhase) {
    const sample = (ctx.openTaskLabels || []).slice(0, 5).map(t => `• ${t}`).join('\n');
    return `You have ${ctx.openTaskCount} open task${ctx.openTaskCount === 1 ? '' : 's'} in the "${ctx.currentPhase}" phase${ctx.daysUntilTarget !== null ? ` with ${ctx.daysUntilTarget} day${ctx.daysUntilTarget === 1 ? '' : 's'} until your report date` : ''}.\n\nTop items to clear next:\n${sample}\n\nOpen PCS Operations → Checklist to tick them off. (Citations: your profile's tailored ${ctx.branch || 'service'} checklist for the ${ctx.currentPhase} phase.)`;
  }
  if (thisWeekAsk && ctx.openTaskCount > 0 && ctx.currentPhase) {
    const sample = (ctx.openTaskLabels || []).slice(0, 3).map(t => `• ${t}`).join('\n');
    return `Focus this week (you're in the "${ctx.currentPhase}" phase):\n${sample}\n\nThese are pulled from your profile-tailored checklist. Open PCS Operations to mark them complete.`;
  }
  return null;
}

export function AIAssistantModal({ open, onClose, isDesktop, language = 'en', userContext = null }) {
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

  // Listen for an app-wide "open-ai-assistant" event. Callers can
  // dispatch `new CustomEvent('open-ai-assistant', { detail:
  // { question: '...' } })` to open the modal pre-filled.
  useEffect(() => {
    const handler = (e) => {
      const q = e?.detail?.question;
      if (typeof q === 'string' && q.trim()) {
        setQuestion(q.trim().slice(0, 1000));
        setTimeout(() => { try { inputRef.current?.focus(); } catch {} }, 50);
      }
    };
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, []);

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
      const timer = setTimeout(() => abortRef.current?.abort(), 30_000);
      // Multi-turn memory: send the full conversation history (capped
      // at the last 12 messages) so a configured LLM provider can
      // reason about context. The backend may ignore `history` until
      // the operator wires in a real provider that supports it.
      const history = nextHistory.slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', text: m.text }));
      // Short curated answer when running in KB-fallback mode without
      // an LLM provider. Lets "what's overdue" / "what's next" feel
      // immediate even when there's no API key configured.
      const curated = curatedContextAnswer(q, userContext);
      const userContextStr = formatUserContextForPrompt(userContext);
      // Request streaming first. If the backend can't / won't stream
      // (curated-KB fallback or non-Anthropic providers) it returns a
      // standard JSON response and we fall through to the existing
      // non-streaming code path.
      const r = await fetch(apiUrl('/api/jtr-assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
        body: JSON.stringify({ q, history, language, stream: true, userContext: userContextStr }),
        signal: abortRef.current.signal,
      });
      const contentType = r.headers.get('content-type') || '';
      // Streaming SSE path. Anthropic emits content_block_delta events
      // whose `delta.text` carries the next text fragment. We append
      // each fragment to a placeholder assistant message so the UI
      // shows a live "typing" effect without re-rendering the entire
      // chat for every chunk.
      if (r.ok && contentType.includes('text/event-stream') && r.body) {
        const source = r.headers.get('x-source') || 'anthropic';
        // Reserve the assistant slot.
        setMessages(prev => [...prev, { role: 'assistant', text: '', source }]);
        const decoder = new TextDecoder('utf-8');
        const reader = r.body.getReader();
        let buffer = '';
        let acc = '';
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // SSE frames are separated by a blank line. Each frame may
          // contain one or more `data: {...}` lines.
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
                // Anthropic event flavors of interest:
                //   content_block_delta → delta.text fragments
                //   message_delta       → final stop_reason etc.
                if (obj?.type === 'content_block_delta' && obj?.delta?.text) {
                  acc += obj.delta.text;
                  setMessages(prev => {
                    const copy = prev.slice();
                    const last = copy[copy.length - 1];
                    if (last && last.role === 'assistant') {
                      copy[copy.length - 1] = { ...last, text: acc };
                    }
                    return copy;
                  });
                }
              } catch {
                // Ignore non-JSON keepalive / comment frames.
              }
            }
          }
        }
        clearTimeout(timer);
        return;
      }
      clearTimeout(timer);

      if (r.status === 501) {
        // Provider not configured. Try the context-aware curated
        // answer first ("what's overdue?", "what's next this week?")
        // because those questions use the user's own checklist state
        // and are usually more valuable than a generic KB hit. Fall
        // back to KB search for everything else.
        if (curated) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: curated,
            source: 'context-aware',
          }]);
          setBusy(false);
          return;
        }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #E0E6EE', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span aria-hidden="true" style={{ fontSize: 18 }}>🤖</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821' }}>AI Assistant</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#56697C', letterSpacing: '.06em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>PCS Express helper · JTR · FTR · DSSR</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => exportConversationAsPdf(messages, language)}
              disabled={messages.length === 0}
              aria-label="Save conversation as printable PDF"
              title="Save conversation as PDF"
              style={{
                background: messages.length === 0 ? 'rgba(0,0,0,0.06)' : '#0D3B66',
                border: '1px solid ' + (messages.length === 0 ? 'rgba(0,0,0,0.08)' : '#0D3B66'),
                color: messages.length === 0 ? '#56697C' : '#FFFFFF',
                fontSize: 11,
                cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                padding: '4px 10px',
                borderRadius: 8,
                fontWeight: 800,
                opacity: messages.length === 0 ? 0.6 : 1,
              }}
            >
              💾 PDF
            </button>
            <button onClick={onClose} aria-label="Close AI Assistant" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', color: '#56697C', fontSize: 13, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>✕</button>
          </div>
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
              <p style={{ marginTop: 0 }}>Ask anything about PCS Express — every mission group, every tool, and the travel regulations behind them (JTR / FTR / DSSR). Every answer cites where it came from.</p>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0D1821', marginTop: 8, marginBottom: 4 }}>Try:</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Where do I track my HHG shipment in the app?</li>
                <li>How do I export the PCS Binder?</li>
                <li>How do I look up the OHA rate for my OCONUS base?</li>
                <li>Where do I find free translation help?</li>
                <li>How do I maximize my PPM payout?</li>
                <li>Do I get BAH overseas?</li>
              </ul>
            </div>
          )}
          {messages.map((m, idx) => {
            const nav = m.role === 'assistant' ? parseInappCitation(m) : null;
            return (
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
                  {nav && (
                    <button
                      onClick={() => {
                        // Hand routing back to App.jsx via a custom
                        // event. App listens for `pcs-navigate` and
                        // handles the tab change + sub-tab one-shot
                        // mechanism. We just close the modal once
                        // the navigation is requested.
                        window.dispatchEvent(new CustomEvent('pcs-navigate', { detail: { tab: nav.tab, sub: nav.sub || null } }));
                        onClose();
                      }}
                      aria-label={`Open ${nav.label}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 999, background: '#0D3B66', color: '#FFFFFF', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      <span aria-hidden="true">↗</span> Open {nav.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
              placeholder="Ask anything — app features, JTR/FTR/DSSR, OCONUS…"
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
