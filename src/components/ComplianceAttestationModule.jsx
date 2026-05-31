/*
 * Compliance Attestation surface.
 *
 * Shows the user (and any prospective defense-industry buyer) the
 * current security posture of PCS Express in plain language. This is
 * an in-app summary of SECURITY.md and /.well-known/security.txt —
 * not a replacement for those files. Numbers and controls listed here
 * must stay in sync with what the server actually does (CSP, rate
 * limiters, AES-256-GCM secure storage). When you change either file,
 * update this module too.
 */

import { useEffect, useState, useRef } from 'react';
// Route both encryptionAvailable AND secureLocalStore / AuditLogger
// through SecurityExtensions. Importing cryptoStore.js directly here
// while it's also imported via SecurityExtensions triggered a dual-
// chunk evaluation that Vite warned about and could TDZ a
// module-level `let` in cryptoStore under specific minifier paths.
import { encryptionAvailable, secureLocalStore, AuditLogger } from '../security/SecurityExtensions';
import { INDEPENDENCE_DISCLAIMER } from '../config/disclaimer';

// Personal data export. Builds a JSON blob of every secureLocalStore
// key the user has touched and offers it as a download. The user can
// keep it as a personal backup outside the app, or hand it to a
// device-replacement tech. There is NO IMPORT counterpart — that
// would require a file input and break the Zero-Upload guarantee.
const EXPORT_KEYS = [
  'pcs_profile',
  'pcs_checklist_checks',
  'pcs_doc_states',
  'pcs_inventory_vault',
  'pcs_shipment_tracker',
  'pcs_pet_relocation_checks',
  'pcs_audit_log',
  'translations_saved',
];

async function exportPersonalDataAsFile(profile) {
  const collected = {};
  for (const k of EXPORT_KEYS) {
    try {
      const v = await secureLocalStore.get(k, null);
      if (v != null) collected[k] = v;
    } catch (err) {
      console.error(`[compliance-export] ${k} ${err.message || err}`);
    }
  }
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    note: 'PCS Express personal-data export. This file is your only copy outside the device. The PCS Express server never had it. Re-importing is not supported (PCS Express has no upload surface) — keep this file as a personal backup or printable record.',
    profile: profile || null,
    storage: collected,
  };
  AuditLogger.record('personal_data_export', { keyCount: Object.keys(collected).length });
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `pcs-express-export-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Restore from an export file. Reading a LOCAL file the user picks does NOT
// upload anything to a PCS Express server — the file is parsed in the browser
// and written back into the encrypted on-device store. This is the device-loss
// recovery path (e.g. setting up a new phone). Returns the number of keys
// restored. Throws with a user-facing message on a bad file.
async function importPersonalDataFromFile(file) {
  // A real export is a few KB. Reject anything implausibly large BEFORE reading
  // it into memory, so a mistaken pick (or a hostile "backup") can't OOM the tab
  // by forcing a multi-hundred-MB file.text() + JSON.parse.
  const MAX_IMPORT_BYTES = 5_000_000;
  if (file && typeof file.size === 'number' && file.size > MAX_IMPORT_BYTES) {
    throw new Error('That file is too large to be a PCS Express export — pick a pcs-express-export-*.json file.');
  }
  const text = await file.text();
  let payload;
  try { payload = JSON.parse(text); }
  catch { throw new Error('That file is not valid JSON — pick a pcs-express-export-*.json file.'); }
  if (!payload || typeof payload !== 'object' || !payload.storage || typeof payload.storage !== 'object') {
    throw new Error('That does not look like a PCS Express export file.');
  }
  let restored = 0;
  for (const k of EXPORT_KEYS) {
    const v = payload.storage[k];
    if (v != null) { await secureLocalStore.set(k, v); restored += 1; }
  }
  AuditLogger.record('personal_data_import', { keyCount: restored });
  return restored;
}

const SECTIONS = [
  {
    id: 'data-residency',
    title: 'Data residency & hosting',
    items: [
      { label: 'Frontend',                  value: 'Vercel · United States edge / U.S.-region functions only',           cite: 'vercel.com/docs/edge-network' },
      { label: 'Backend API',               value: 'Railway · US East (us-east1) region',                                cite: 'railway.app/docs/reference/regions' },
      { label: 'Mobile shell',              value: 'Capacitor 8 · iOS + Android. Bundle ships with the same app code; no additional telemetry.', cite: '' },
      { label: 'Persistent user storage',   value: 'Local-only. No server-side database stores PCS profile data.',       cite: '' },
    ],
  },
  {
    id: 'encryption',
    title: 'Encryption at rest & in transit',
    items: [
      { label: 'At rest (browser / mobile)', value: 'AES-256-GCM via Web Crypto SubtleCrypto. Non-extractable AES key persisted in IndexedDB; all PCS state JSON-encoded then encrypted before localStorage.', cite: 'src/security/cryptoStore.js' },
      { label: 'In transit',                 value: 'TLS 1.2+ enforced by Vercel + Railway; HSTS with 1-year max-age, includeSubDomains, preload.',                                                            cite: 'server/index.js' },
      { label: 'Audit trail',                value: 'Metadata-only — event names + timestamps. No PII, installation names, or dates of birth ever written to audit.',                                          cite: 'src/security/SecurityExtensions.js' },
      { label: 'Key escrow',                 value: 'No escrow / no key recovery path. PCS Express cannot decrypt user data even if served a subpoena.',                                                       cite: '' },
    ],
  },
  {
    id: 'http-headers',
    title: 'HTTP security headers',
    items: [
      { label: 'Content-Security-Policy', value: "Strict default-src 'self'; no script unsafe-inline; tight connect-src whitelist. A relaxed CSP allowing Google Translate hosts is conditionally applied only when the user opts into translation (googtrans cookie present).", cite: 'server/index.js' },
      { label: 'HSTS',                    value: 'max-age=31536000; includeSubDomains; preload',                                                                                                                                              cite: 'server/index.js' },
      { label: 'COOP / CORP',             value: 'same-origin (Spectre-class isolation)',                                                                                                                                                     cite: 'server/index.js' },
      { label: 'Permissions-Policy',      value: 'camera, microphone, geolocation, payment, USB, Bluetooth, gyroscope, accelerometer, magnetometer, ambient-light-sensor, serial, MIDI all denied.',                                          cite: 'server/index.js' },
      { label: 'Server / X-Powered-By',   value: 'Stripped (Express disclaimer hidden; reverse-proxy Server header normalized).',                                                                                                             cite: 'server/index.js' },
    ],
  },
  {
    id: 'access-controls',
    title: 'Access controls & rate limits',
    items: [
      { label: 'Per-IP API rate limit', value: '30 req / minute, burst 10. Applied to every /api/* route via in-memory map with 5-minute cleanup.', cite: 'server/index.js · registerRateLimitMap' },
      { label: 'AI gateway rate limit', value: 'Separate limit on /api/ai — 10 req / minute, request body length-capped at 4 000 chars.',           cite: 'server/index.js' },
      { label: 'Authentication',         value: 'Client-only profile state; no user accounts, no auth tokens, no OAuth handoff. Profiles never leave the device.', cite: '' },
      { label: 'No SQL backend',          value: 'No relational or document database stores user state. Removes the entire SQL-injection / unauthenticated-read attack surface.', cite: '' },
    ],
  },
  {
    id: 'export-controls',
    title: 'ITAR / export-control posture',
    items: [
      { label: 'Data ingested',        value: 'Public installation metadata, public DTMO/GSA reference data, user-entered PCS profile state (kept local). No classified, controlled-unclassified (CUI), or operationally sensitive data is ingested or transmitted.', cite: '' },
      { label: 'AI/ML routing',         value: 'AI Assistant + Translation features forward user-typed text plus a non-PII context blob (branch / phase / open-task count) to Anthropic via /api/ai and /api/jtr-assistant with length caps, prompt-injection sanitization, and an OPSEC banner above each input. Nothing is persisted server-side beyond rate-limit counters.', cite: '' },
      { label: 'Other off-device egress', value: 'Navigation: addresses you type are sent to OpenStreetMap (Nominatim + OSRM) for geocoding and routing. Demo / partner contact form: name, email, org, role, message, plus request IP are POSTed to the server and written to ephemeral logs (no database). Translation widget (opt-in): page contents go to Google when enabled. Future advertising: ads.txt declares a Google AdSense publisher relationship; no ad code currently loads.', cite: '' },
      { label: 'Distribution control', value: 'Source is published on a public GitHub repo (no controlled algorithms or USML Cat XI/XV components). App contains no encryption beyond what is freely exportable under EAR §740.17 (TSU).',                                cite: '' },
      { label: 'Foreign access',       value: 'OCONUS service members (the app’s primary OCONUS audience) are U.S. government personnel; no foreign-national user provisioning.',                                                                                  cite: '' },
    ],
  },
  {
    id: 'alignment',
    title: 'Public-standard alignment (engineering best-effort)',
    items: [
      { label: 'NIST SP 800-53',  value: 'AC-2, AC-7, IA-5, SC-12, SC-13, SC-28, SI-10, SI-11, AU-2 (audit log), AU-12 — controls implemented or N/A by design.',           cite: 'SECURITY.md' },
      { label: 'NIST SP 800-171', value: 'No document upload to any server. The only file input is a local-only JSON backup restore that is read in-browser (FileReader) and never transmitted off-device.',                                            cite: 'restore picker is client-side only' },
      { label: 'DISA ASD STIG',   value: 'Input validation, security headers, server fingerprint reduction implemented per the Application Security & Development STIG.',  cite: 'SECURITY.md' },
      { label: 'OWASP ASVS 4.0',  value: 'V2 auth, V3 session, V8 data-protection, V13 API verifications passed in spot-review (formal verification still needed).',        cite: 'SECURITY.md' },
      { label: 'CMMC 2.0',         value: 'Independent application — not a DoD CMMC-assessed contractor. Architecture is CMMC-Level-2-compatible if onboarded to a defense prime.', cite: '' },
    ],
  },
  {
    id: 'zta-cato',
    title: 'Zero Trust Architecture & cATO roadmap',
    items: [
      { label: 'Identity boundary',         value: 'Browser-isolated; no implicit trust between client and server. Every /api/* call is rate-limited per-IP and carries no session — there is no shared trust boundary to compromise.',                                                          cite: 'server/index.js · registerRateLimitMap' },
      { label: 'Microsegmentation',         value: 'Backend runs on a single Railway service today; modular architecture (see below) lets each domain (PPM, OHA, schools, religious) move to its own service without client refactor when needed for cATO segmentation.',                cite: '' },
      { label: 'Continuous monitoring',     value: 'PCS Express ships SECURITY.md + RFC 9116 security.txt and a metadata-only audit log. A formal ConMon plan (NIST 800-137) would be required for cATO.',                                                                              cite: 'SECURITY.md' },
      { label: 'cATO / SWIFT readiness',     value: 'Software Fast Track (SWIFT) launches 2026-05-01. PCS Express is not currently on a DoD ATO/cATO path — these controls (encryption, no PII storage, strict CSP, RFC 9116, modular boundaries) are intended to make sponsor-side cATO onboarding tractable when an authorizing official is engaged.', cite: '' },
    ],
  },
  {
    id: 'foci',
    title: 'Foreign Ownership, Control, or Influence (FOCI)',
    items: [
      { label: 'Ownership',                  value: 'Independent project — currently sole-developer owned by a U.S. person. No outside investors, no venture funds with foreign limited partners.',                                                                                                     cite: '' },
      { label: 'Acquisition readiness',      value: 'Any future funding round will be screened for FOCI before close: NISPOM-aligned questionnaire for all investors / LPs, disclosure of any non-U.S. limited partners, and a written FOCI mitigation plan if any non-U.S. ownership exceeds 5 %.',         cite: '32 CFR Part 117 (NISPOM)' },
      { label: 'Personnel',                  value: 'Contributors are U.S. persons. Any future non-U.S. contributor would be limited to non-sensitive UI / translation work and excluded from anything touching export-controlled algorithms (none currently exist).',                                cite: '' },
      { label: 'Hosting & data',             value: 'Vercel and Railway U.S.-region only. No CDN edge in foreign jurisdictions caches PII (there is none to cache). DoD-prime acquirer can re-host on GovCloud (AWS US-Gov-West / Azure Gov) without code changes.',                                cite: '' },
    ],
  },
  {
    id: 'modular-architecture',
    title: 'Modular architecture (defense-prime integration)',
    items: [
      { label: 'Frontend modularity',        value: 'Each PCS surface is a standalone React component under src/components/ (e.g., InventoryVaultModule, ShipmentTrackerModule, JTRAssistantModule, ComplianceAttestationModule). Any module can be lifted into a prime\'s existing app shell with no cross-module coupling.', cite: 'src/components/*' },
      { label: 'Backend modularity',         value: 'server/index.js exposes 14+ independent /api/* endpoints (vet-businesses, housing-listings, schools-nearby, religious-services, family-activities, market-stats, job-listings, jtr-assistant, base-reviews, etc.). Each can be split into a separate microservice without client changes.', cite: 'server/index.js' },
      { label: 'Data formats',               value: 'All API responses are open JSON with documented shapes. No proprietary serialization. Frontend never assumes endpoint co-residency — apiUrl() abstraction lets each backend route point at a different host.',                                cite: 'src/config/apiConfig' },
      { label: 'Mobile-shell decoupling',    value: 'Capacitor 8 iOS / Android wrap the same dist bundle as web. A defense-prime acquirer can re-skin the mobile shell while leaving the engine intact.',                                                                                                    cite: 'ios/, android/' },
    ],
  },
  {
    id: 'vuln-disclosure',
    title: 'Vulnerability disclosure',
    items: [
      { label: 'Reporting path',  value: 'GitHub Security Advisory (https://github.com/damienmcdade/PCSExpress/security/advisories/new) or email maintainer.', cite: 'public/.well-known/security.txt' },
      { label: 'SLA',             value: 'Acknowledge within 5 business days. Fix in next release cycle for confirmed vulnerabilities.',                                                      cite: 'SECURITY.md' },
      { label: 'RFC 9116',        value: 'security.txt published at /.well-known/security.txt with Contact, Expires, and Canonical fields.',                                                  cite: 'public/.well-known/security.txt' },
      { label: 'DoD VDP',          value: 'Independent app — not on the DoD VDP roster (cyber.mil/vdp). Direct report to maintainer.',                                                        cite: '' },
    ],
  },
];

export default function ComplianceAttestationModule({ theme, profile }) {
  const [cryptoOk, setCryptoOk] = useState(null);
  const importInputRef = useRef(null);
  const [importMsg, setImportMsg] = useState(null);
  useEffect(() => { setCryptoOk(encryptionAvailable()); }, []);
  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary, borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFF', border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>COMPLIANCE ATTESTATION</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Security posture & data-handling commitments</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
          In-app summary of the controls documented in <code>SECURITY.md</code> and <code>public/.well-known/security.txt</code>. {INDEPENDENCE_DISCLAIMER} Engineering choices align with public DoD / DISA / NIST / OWASP guidance on a best-effort basis.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ background: cryptoOk ? '#E8F5E9' : '#FFF3E0', color: cryptoOk ? '#1B5E20' : '#6D4C00', fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 999 }}>
          AES-256-GCM at rest · {cryptoOk == null ? 'checking…' : cryptoOk ? 'ACTIVE' : 'unavailable (legacy browser)'}
        </span>
        <span style={{ background: '#E3F2FD', color: '#0D3B66', fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 999 }}>TLS 1.2+ in transit</span>
        <span style={{ background: '#F3E5F5', color: '#4A148C', fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 999 }}>U.S.-region hosting only</span>
        <span style={{ background: '#FFFDE7', color: '#7A4A00', fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 999 }}>No PII database (ephemeral demo-form logs only)</span>
        <span style={{ background: '#FBE9E7', color: '#BF360C', fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 999 }}>Zero-Upload design</span>
      </div>

      {SECTIONS.map(section => (
        <section key={section.id} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821', marginBottom: 10, letterSpacing: '.03em' }}>{section.title}</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {section.items.map((it, idx) => (
              <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.04em' }}>{it.label}</div>
                <div style={{ fontSize: 12, color: '#0D1821', lineHeight: 1.5 }}>{it.value}</div>
                {it.cite && (
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#56697C', marginTop: 4, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>source: {it.cite}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821', marginBottom: 6, letterSpacing: '.03em' }}>Back up &amp; restore your data</div>
        <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.55, marginBottom: 10 }}>
          Because your data lives only on this device (never on a PCS Express server), download a backup so you don't lose it if you clear your browser, lose your phone, or move to a new device. The file holds your profile, checklist progress, inventory, shipment-tracker fields, pet checklist, audit log, and saved translations. <strong>It is your only copy — keep it somewhere safe.</strong> Restoring reads the file locally on your device; nothing is uploaded to any server.
        </div>
        <button
          type="button"
          onClick={() => exportPersonalDataAsFile(profile)}
          className="card-cta card-cta--block"
          style={{ '--cta-color': theme.primary, background: theme.primary, color: '#FFF', border: 'none', cursor: 'pointer' }}
        >
          💾 Download backup (JSON)
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files && e.target.files[0];
            e.target.value = '';
            if (!file) return;
            if (!window.confirm('Restore from this backup? It will overwrite the PCS data currently on this device.')) return;
            try {
              const n = await importPersonalDataFromFile(file);
              setImportMsg({ ok: true, text: `Restored ${n} item${n === 1 ? '' : 's'}. Reloading…` });
              setTimeout(() => { try { window.location.reload(); } catch { /* ignore */ } }, 1200);
            } catch (err) {
              setImportMsg({ ok: false, text: err.message || 'Could not restore that file.' });
            }
          }}
        />
        <button
          type="button"
          onClick={() => importInputRef.current && importInputRef.current.click()}
          className="card-cta card-cta--block"
          style={{ '--cta-color': theme.primary, marginTop: 8, background: '#FFF', color: theme.primary, border: `1.5px solid ${theme.primary}`, cursor: 'pointer' }}
        >
          ⤴️ Restore from a backup file
        </button>
        {importMsg && (
          <div role="status" style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: importMsg.ok ? '#1B5E20' : '#C62828' }}>
            {importMsg.text}
          </div>
        )}
      </section>

      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <a href="https://github.com/damienmcdade/PCSExpress/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>Read full SECURITY.md on GitHub</a>
        <a href="/.well-known/security.txt" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">RFC 9116 security.txt</a>
        <a href="https://github.com/damienmcdade/PCSExpress/security/advisories/new" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">Report a vulnerability (GitHub Security Advisory)</a>
      </div>
    </div>
  );
}
