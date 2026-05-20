/*
 * Vercel serverless function: /api/jtr-assistant
 *
 * Mirrors the same endpoint in server/index.js, but runs directly on
 * Vercel so the live AI Assistant stays operational even when the
 * Railway service is down (which has been the case for an extended
 * period). When Railway is back, the same endpoint also exists there;
 * Vercel's filesystem-routing precedence ensures THIS file handles
 * the request first, so the Railway copy becomes redundant rather
 * than conflicting.
 *
 * Non-streaming on purpose: keeps the function simple, sidesteps any
 * Vercel runtime / Anthropic SSE pass-through gotchas, and the client
 * (AIAssistantChip.jsx) already has a working non-streaming response
 * path. The user-visible difference is no per-token typing animation
 * on Vercel; the answer arrives in a single chunk once Anthropic
 * finishes generating.
 *
 * Required env var on Vercel for live AI:
 *   ANTHROPIC_API_KEY
 *
 * Without it, returns HTTP 501. The client falls back to the curated
 * KB / context-aware answer path that's already shipped.
 *
 * Optional env vars:
 *   ANTHROPIC_MODEL — override default model
 *
 * Security parity with server/index.js:
 *   - q, userContext, and every history message are sanitized via
 *     sanitizeForPrompt() to strip ASCII control chars and collapse
 *     whitespace before being inlined into the system prompt.
 *   - Hard length caps on q (1000), userContext (1000), each
 *     history message (1500), language (8 chars, [a-z-] only).
 *   - 30-second timeout on the upstream Anthropic call via
 *     AbortSignal.timeout.
 *   - No request body is logged. The function is stateless — Vercel
 *     does not persist q, history, or userContext.
 */

// Match the curated system prompt language used by server/index.js.
// Kept verbatim so the assistant behaves identically across whichever
// surface (Railway / Vercel) ends up handling the request.
const AI_ASSISTANT_SYSTEM_PROMPT = `You are the PCS Express AI Assistant. You help U.S. service members, civilians, and their families navigate Permanent Change of Station moves.

Knowledge sources you can cite:
  - JTR (Joint Travel Regulations) for military per-diem, weight allowances, POV shipment, TLE, DLA, MALT, claims windows.
  - FTR (Federal Travel Regulations) for DoD civilians (HHT, real estate reimbursement, weight allowances).
  - DSSR (Department of State Standardized Regulations) for OCONUS allowances (LQA §130, TQSA §240, post allowance, MIHA).
  - IRC §112 (Combat Zone Tax Exclusion), IRS Pub 3, IRS Form 2555 (FEIE for OCONUS civilians).
  - Official .mil / .gov resources: travel.dod.mil, va.gov, militaryonesource.mil, dps.move.mil, milconnect.dmdc.osd.mil, dodea.edu, dodtap.mil, usajobs.gov, tricare.mil.

PCS Express navigation vocabulary (cite these when relevant):
  - Command Center: home dashboard with Mission Lanes (Today / This Week / Before You Report).
  - PCS Operations: phased Checklist, Paperwork binder, Dynamic Timeline.
  - Movement & Logistics: BAH/OHA Calculator, PPM Estimator, Budget Tracker, Shipment Tracker, Inventory & Claims, JTR Assistant tab, Move Aid, VA Loan, Home Locator.
  - Family Readiness: Family, Education, Translation, Faith & Chaplains, Spouse Deployment Guide, Pet Relocation, EFMP.
  - Holistic Health: Medical Care, Behavioral Health, Spiritual Care, Fitness.
  - Mission Resources: Base Insights, Maps, Help Hub (Healthcare/Family/Financial/PCS/Education/Careers/Portals), Veteran Support.

Rules:
  - Cite the official regulation OR the in-app surface (e.g., "Movement & Logistics → Shipment Tracker").
  - For safety / crisis questions, lead with: Military Crisis Line 988 then 1, or Military OneSource 1-800-342-9647.
  - Do NOT invent dollar amounts, day counts, or weight figures. Direct the user to the live source if you don't have it verified.
  - Be concise. PCS members are busy. Aim for under 200 words unless the question explicitly asks for detail.
  - If the user's PCS context is provided, cite specifics ("you have N open tasks in the X phase").`;

const sanitizeForPrompt = (s, maxLen) => String(s || '')
  .replace(/[\x00-\x1F\x7F]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLen);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      error: 'not-configured',
      answer: 'The live AI Assistant is not configured on this deployment yet. The PCS Express app falls back to a curated JTR/FTR/DSSR knowledge base — your question may still get a citation-backed answer there. For anything outside that scope, escalate to your gaining installation Finance Office or open the JTR Assistant tab inside Movement & Logistics.',
      source: 'not-configured',
    });
  }

  // Vercel parses req.body automatically when Content-Type is JSON
  // and the function isn't configured with rawBody. Guard anyway in
  // case a client posts with the wrong content type.
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const q = sanitizeForPrompt(body.q, 1000);
  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const language = String(body.language || 'en').trim().slice(0, 8).toLowerCase().replace(/[^a-z-]/g, '');
  const userContext = sanitizeForPrompt(body.userContext, 1000);
  if (!q) return res.status(400).json({ error: 'q is required' });

  const messages = rawHistory
    .slice(-10)
    .map(m => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: sanitizeForPrompt(m?.text, 1500),
    }))
    .filter(m => m.content.length > 0);
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== q) {
    messages.push({ role: 'user', content: q });
  }

  const langLine = language && language !== 'en'
    ? `\n\nThe user's preferred app language is ${language}. Respond in that language unless the user explicitly asks for another.`
    : '';
  const ctxLine = userContext
    ? `\n\nThe user's current PCS context (non-PII, drawn from their on-device profile): ${userContext}. Use this to tailor answers ("you have N open tasks in the X phase") and cite the relevant tab in PCS Express when appropriate.`
    : '';

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: AI_ASSISTANT_SYSTEM_PROMPT + langLine + ctxLine,
        messages,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error(`[jtr-assistant] anthropic ${upstream.status} ${detail.slice(0, 200)}`);
      return res.status(502).json({
        error: 'upstream-error',
        answer: `The live AI provider returned an error (HTTP ${upstream.status}). Try the JTR Assistant tab inside Movement & Logistics for a curated answer, or check Mission Resources → Help Hub for the official source.`,
        source: 'upstream-error',
      });
    }

    const data = await upstream.json();
    const text = (Array.isArray(data?.content) ? data.content : [])
      .filter(b => b?.type === 'text')
      .map(b => String(b.text || ''))
      .join('')
      .trim();

    return res.status(200).json({
      answer: text || 'No answer returned from the AI provider.',
      source: 'anthropic',
    });
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return res.status(504).json({
        error: 'timeout',
        answer: 'The AI provider took too long to respond. Try a shorter question, or open the JTR Assistant tab for the curated library.',
        source: 'timeout',
      });
    }
    console.error('[jtr-assistant]', err?.message || err);
    return res.status(502).json({
      error: 'network-error',
      answer: 'Could not reach the AI provider. The curated knowledge base inside the JTR Assistant tab is still available.',
      source: 'network-error',
    });
  }
}
