# JTR Assistant — operator README

The **JTR Regulatory Assistant** (`src/components/JTRAssistantModule.jsx`)
ships with a 14-entry curated knowledge base that runs entirely
client-side. The user can also submit a free-text question through a
backend gateway at `POST /api/jtr-assistant`. By default that endpoint
returns **501 Not Configured** so this deployment never accidentally
routes user queries to an upstream AI provider that hasn't been
intentionally wired in. This document explains how to flip the switch.

## Default behaviour

```http
POST /api/jtr-assistant
{ "q": "How do I maximize my PPM payout?" }

→ 501
{
  "error": "not-configured",
  "answer": "Free-text JTR Q&A is not configured in this deployment. …",
  "source": "not-configured"
}
```

The frontend recognises the 501 and shows a "NOT CONFIGURED" panel
with a fallback message steering the user to the gaining installation
Finance Office / DTMO. The curated KB above the input continues to work.

## Enabling a provider

The integration point is `server/index.js`, the
`app.post('/api/jtr-assistant', …)` handler (search for
`JTR_ASSISTANT_PROVIDER`). Setting the env var alone is **not** enough
— the second 501 branch deliberately reminds the operator to wire the
upstream call. Replace that branch with a real provider call.

### Anthropic example

```bash
# .env (Railway / Vercel)
JTR_ASSISTANT_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

```js
if (provider === 'anthropic') {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: `You answer Joint Travel Regulations (JTR), Federal Travel Regulation (FTR), and DSSR questions for U.S. service members and DoD civilians. Cite the JTR / FTR / DSSR section for every answer. Refuse anything outside PCS / travel-regulation scope. Never request or store personal information.`,
      messages: [{ role: 'user', content: q }],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return res.status(502).json({ error: 'upstream', source: 'anthropic' });
  const data = await r.json();
  const answer = (data?.content || []).map(c => c.text || '').join('').trim();
  return res.status(200).json({ answer, source: 'anthropic / claude-haiku-4-5' });
}
```

### OpenAI example

```bash
JTR_ASSISTANT_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

```js
if (provider === 'openai') {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You answer JTR/FTR/DSSR questions with section citations. Refuse out-of-scope queries.' },
        { role: 'user',   content: q },
      ],
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return res.status(502).json({ error: 'upstream', source: 'openai' });
  const data = await r.json();
  const answer = String(data?.choices?.[0]?.message?.content || '').trim();
  return res.status(200).json({ answer, source: 'openai / gpt-4o-mini' });
}
```

### Self-hosted / private model

`JTR_ASSISTANT_PROVIDER=internal` and point the same handler at the
internal endpoint. Keep the same response shape — `{ answer, source }`
— and the frontend renders it the same way.

## Required guardrails (do not skip)

1. **Rate limit.** `jtrAssistantRateLimit` already caps at 10 req/min
   per IP. Do not raise it without coordinating quota with the provider.
2. **OPSEC banner.** The red OPSEC banner above the textarea is
   permanent and warns the user against entering classified / CUI /
   GBL / specific dates. Do **not** remove it.
3. **Length cap.** `q` is sliced to 1000 chars on the server. Keep
   this cap when adding the provider call.
4. **Logging.** Do not log `q` to stdout or the audit log.
   `AuditLogger.record` is metadata-only by design; preserve that.
5. **CSP.** Adding a new outbound `fetch()` host requires extending
   `CSP_STRICT_BASE.connect-src` in `server/index.js` if the request
   originates from the browser. The current handler proxies through
   the backend, so the CSP doesn't need changes for backend-proxied
   providers.

## ITAR / compliance notes

Routing user-typed text through a third-party LLM expands the data-
egress surface. Before enabling a provider, confirm:

- The provider's Data Processing Agreement allows the operator's
  data-handling commitments (see `SECURITY.md`).
- The provider's data-retention default is **zero** (Anthropic's
  default with the Messages API is no-retention; OpenAI requires an
  org-level Zero-Retention agreement).
- The OPSEC banner remains user-visible — it is the only mitigation
  for accidental CUI submission.
- The provider's terms permit U.S. federal service-member end-users.

If any of the above is uncertain, leave the default 501 in place. The
curated KB plus the finance-office escalation is a perfectly defensible
product baseline.
