# PCS Express — Privacy Notice

**Effective date:** May 30, 2026
**Operator:** PCS Express, operated by CyberWave Technologies LLC (cyberwaveglobal.com)
**Contact:** info@cyberwaveglobal.com

---

## 1. What PCS Express is

PCS Express is an independent platform that helps U.S. service members, DoD
civilians, and military families navigate Permanent Change of Station (PCS)
moves. It is **not endorsed by, affiliated with, sponsored by, or coordinated
with the U.S. Department of Defense, the Department of Veterans Affairs, or
any military branch.**

## 2. What this notice covers

The web app at **pcsexpress.app**, the iOS app (Capacitor shell), and the
Android app (Capacitor shell). Where this notice says "the App," it means
all three.

## 3. Information we do NOT collect

- We do **not** require accounts, sign-ups, passwords, or any form of login.
- We do **not** ask for your Social Security number, date of birth, EDIPI/DoD
  ID, military rank, orders, GBL number, or any officially identifying
  document.
- We do **not** accept document uploads or photographs anywhere in the App.
- We do **not** use third-party analytics, advertising trackers, or session
  replay services. (See §7 on advertising.)
- We do **not** sell, rent, or share any information with data brokers.

## 4. Information stored on YOUR device only

When you use the App's planning features, the following is stored locally
on your device, encrypted at rest using AES-256-GCM with a key generated
in your browser's IndexedDB (non-extractable):

- Your PCS profile (first name, branch, component, gaining installation,
  family composition, EFMP status, religious preference, etc.)
- Checklist progress, reminders, and notes you create
- Saved routes, saved translations, inventory and pet-relocation worksheets
- An audit log of the events listed above (event names + timestamps only,
  no field content)

**Nothing in this list is transmitted to PCS Express servers.** Clearing
your browser's site data, or using the in-app "Reset" function, deletes all
of it. There is no server-side backup.

## 5. Information sent off your device

| Feature | What is sent | Where | Why |
|---|---|---|---|
| AI Assistant (in-app) | Your typed question + a non-PII context blob (branch, phase, open-task count) | Anthropic, Inc. (`api.anthropic.com`) via our server | To return a contextual answer |
| Translation widget (opt-in only) | Page content as you read it | Google LLC (Google Translate) | Only when you turn translation on |
| Navigation tab | Addresses you type, plus origin/destination pairs | OpenStreetMap Foundation (`nominatim.openstreetmap.org`, `router.project-osrm.org`) | To geocode and route |
| Local resource lookups (business directory, jobs, housing rates, market stats, schools, family activities) | Your gaining installation's city / state / ZIP, and any address you type | Public government & third-party APIs via our server: SAM.gov, USASpending.gov, USAJOBS (OPM), FRED (St. Louis Fed), HUD User, TheMuse, RemoteOK, OpenStreetMap (Nominatim/Overpass) | To fetch local results for the gaining area |
| Demo / partner contact form | Name, email, organization, role, message, your request IP | PCS Express server (ephemeral application logs only — no database) | To respond to your inquiry |
| Push notifications (opt-in only) | Browser push subscription (an endpoint URL chosen by your browser vendor) | PCS Express server | To send reminders you've requested |

We do not retain server-side copies of AI Assistant or Translation traffic.
Anthropic and Google process their respective inputs under their own
privacy terms — see their notices for details.

## 6. Cookies and similar technologies

PCS Express does not set tracking cookies, fingerprinting cookies, or
advertising cookies.

- A first-party cookie named `googtrans` is set **only if you opt into
  Google Translate**, to remember your selected language across page
  loads. It is removed if you switch back to English.
- Your browser stores PCS Express's site data (the AES-encrypted PCS
  profile described in §4) as IndexedDB / localStorage entries. These
  are not cookies and are not transmitted with HTTP requests.

## 7. Advertising (Google AdSense)

PCS Express has applied for the Google AdSense program and our publisher
ID is declared in our `ads.txt` file, but **advertising is not currently
served** on the web app, and never inside the iOS/Android apps. The
AdSense script does not load and sets no advertising cookies until you
grant consent through a Consent Management Platform — which is not yet
enabled. Before any ads are served, we will: (a) require prior consent in
the EU/EEA and the UK via a Google-certified consent banner, (b) default
to non-personalized ads, and (c) update this notice with the data Google
receives. Google's use of advertising cookies is described in Google's
[Advertising Privacy & Terms](https://policies.google.com/technologies/ads)
notice.

If we ever introduce personalized ads, a granular consent banner will be
added before personalization is enabled — including a clearly-labelled
opt-out for users covered by CCPA / CPRA / GDPR / ePrivacy.

## 8. Data we receive automatically

Your browser/device sends standard HTTP information (IP address, user
agent, Accept-Language header, request path, response code) to PCS
Express servers, our hosting providers (Vercel, Inc. and Railway Corp.),
and our content delivery networks. These are used for security
diagnostics and abuse prevention.

We do not associate this data with any user identifier. It is retained
only as long as our hosting providers retain platform-level logs (see
their privacy notices for current retention windows).

## 9. Children

PCS Express is intended for adult service members, DoD civilians, and
adult family members. It is not directed at children under 13. If you
believe a minor has provided personal information through the App,
contact us at info@cyberwaveglobal.com and we will delete it. The App
does not require, collect, or accept information knowingly from
children under 13 (COPPA).

## 10. Your rights

Depending on where you live, you may have the right to:
- request a copy of the personal information we hold about you,
- request correction or deletion of that information,
- opt out of any sale or sharing of personal information (we don't
  do either),
- withdraw consent for any opt-in feature you previously enabled.

For California residents: this constitutes our CCPA / CPRA notice at
collection. The categories of personal information collected are listed
in §5 above. We do not "sell" or "share" personal information as those
terms are defined in the CCPA / CPRA.

For EU / UK / EEA residents: under GDPR Art. 13, the lawful basis for
each off-device transfer in §5 is your consent (translation, push
notifications, demo form) or our legitimate interest in providing the
service you requested (AI Assistant, Navigation). Anthropic, Google,
Vercel, and Railway each maintain their own Standard Contractual Clauses
or equivalent transfer mechanisms.

To exercise any of these rights, email info@cyberwaveglobal.com from the
email address associated with your inquiry.

## 11. Security

- HTTPS is enforced for every request (HSTS with `preload`).
- A Content Security Policy is applied (`default-src 'self'`, `object-src
  'none'`, `frame-ancestors 'self'`) with an explicit allowlist of the few
  third-party script/frame origins required for maps and (when enabled) ads.
- Push-notification endpoints are restricted by hostname allowlist.
- AI prompts are sanitized for prompt-injection and capped in length
  before being forwarded.
- The full security posture is documented in
  `SECURITY.md` and the in-app **Compliance** screen.

## 12. International data transfers

PCS Express servers are hosted in the United States (Vercel and Railway
U.S. regions). If you access the App from outside the U.S., your data
will be transferred to and processed in the United States.

## 13. Changes

We will update this notice when the App's data practices change. The
effective date at the top will be updated, and material changes will be
flagged in the App's Compliance screen.

## 14. Contact

Questions, requests, or complaints: **info@cyberwaveglobal.com**

Security vulnerabilities: see `https://pcsexpress.app/.well-known/security.txt`
