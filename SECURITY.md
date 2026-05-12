# PCS Express — Security Policy

## Reporting a vulnerability

Open a GitHub Security Advisory on
https://github.com/damienmcdade/PCSExpress/security/advisories/new

or email the maintainer (see `public/.well-known/security.txt`).

Please include:
1. A clear description of the issue and its impact
2. Steps to reproduce (a minimal test case is ideal)
3. The affected version / commit SHA
4. Your suggested severity if you have one

We aim to acknowledge within 5 business days and target a fix in the
next release cycle for any confirmed vulnerability.

## Scope

In scope:
* The PCS Express web app (Vercel + Railway deployments)
* The Express backend API (`/api/*`)
* The Capacitor iOS / Android shells (when running our published bundle)

Out of scope:
* Self-XSS scenarios in features that explicitly accept free-text user
  input (the Translation → "Translate" sub-tab routes free-text to a
  3rd-party AI service — the OPSEC banner above the input documents
  this; do not enter classified or operational information there)
* Reports against deployed third-party dependencies (please file with
  the upstream maintainer)
* Denial of service attacks that require sustained > 50 req/s
* Reports requiring a non-default browser configuration

## What PCS Express does and does not do

PCS Express is an **independent application** — it is not owned,
operated, endorsed, certified, or approved by the Department of Defense,
DISA, any military branch, or any U.S. government agency.

This security policy aligns where practical with public DoD/DISA
security guidance:
* DISA Application Security & Development STIG (input validation,
  security headers, fingerprint reduction)
* NIST SP 800-53 control families AC, IA, SC, SI (auth, identity,
  comms, system integrity)
* NIST SP 800-171 CUI guidance (the app's design choice to NEVER
  ingest documents removes the CUI handling problem at the source)
* OWASP Application Security Verification Standard (ASVS) v4.0

These alignments are **engineering best-effort**, not a formal ATO
or STIG-Q certification. Formal DoD compliance requires a human
authorized assessor.

## Implemented controls

* **AES-256-GCM encryption** of all locally persisted user data, using
  a non-extractable Web Crypto key persisted in IndexedDB.
* **Zero-Upload design** — there is no file input anywhere in the
  application (verifiable: `grep -r 'type="file"' src/` returns zero).
* **No PCS Express backend that stores user data** — the only server
  endpoint (`/api/ai`) forwards translation text to Anthropic and
  returns the result; nothing is persisted server-side.
* **Strict CSP** — `default-src 'self'`, no script `unsafe-inline`,
  `connect-src` whitelist limited to OSM tile/router/nominatim hosts.
* **HSTS with preload** (1-year max-age, includeSubDomains).
* **COOP/CORP set to `same-origin`** for Spectre-class mitigation.
* **Permissions-Policy** disables 12 device feature categories
  (camera, microphone, geolocation, payment, USB, Bluetooth,
  gyroscope, accelerometer, magnetometer, ambient-light-sensor,
  serial, MIDI).
* **Server fingerprinting reduced** — `server_tokens off`,
  `X-Powered-By` stripped, backend `Server` header hidden by proxy.
* **Per-IP rate limit** on `/api/*` (30 req/min, burst 10).
* **Input validation** on `/api/ai` — length-capped at 4000 chars,
  basic shape checks, rejects non-strings.
* **PrivacyShield overlay** obscures the app when the tab is
  backgrounded.
* **Audit log records metadata only** — no PII (no names,
  installations, dates) ever written to the audit trail.
* **target="_blank" links carry rel="noopener noreferrer"** —
  no reverse-tabnabbing surface.
* **No eval / new Function** — no JavaScript code-injection sinks.
* **Vulnerability disclosure path** via `/.well-known/security.txt`
  and GitHub Security Advisories.
