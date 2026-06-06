# PCS Express — Third-Party Notices

PCS Express is built on top of open-source software. This file lists the
runtime open-source dependencies bundled into the production build and
the licenses they ship under. It is **not** a complete bill of materials
of every transitive dev-only dependency — those are recorded in
`package-lock.json` and can be regenerated with `npm ls --omit=dev`.

This file is updated when production `dependencies` in `package.json`
change. Last regenerated against `package.json` commit captured at the
top of git history.

## Runtime dependencies (production)

| Package | License | Source |
| --- | --- | --- |
| @capacitor/core | MIT | https://github.com/ionic-team/capacitor |
| @capacitor/haptics | MIT | https://github.com/ionic-team/capacitor-plugins |
| @capacitor/ios | MIT | https://github.com/ionic-team/capacitor |
| @capacitor/android | MIT | https://github.com/ionic-team/capacitor |
| cors | MIT | https://github.com/expressjs/cors |
| debug | MIT | https://github.com/debug-js/debug |
| dotenv | BSD-2-Clause | https://github.com/motdotla/dotenv |
| express | MIT | https://github.com/expressjs/express |
| pg (node-postgres) | MIT | https://github.com/brianc/node-postgres |
| web-push | MPL-2.0 | https://github.com/web-push-libs/web-push |
| react | MIT | https://github.com/facebook/react |
| react-dom | MIT | https://github.com/facebook/react |

React and React-DOM are included in the runtime bundle even though they
are currently declared in `devDependencies` (a known classification
defect tracked separately). Build-only tools (`postcss`, `rollup`,
`vite`) are not bundled into the shipped runtime and are therefore not
listed here; they are recorded in `package-lock.json`.

**`web-push` is licensed under the Mozilla Public License 2.0 (MPL-2.0)**,
a file-level weak-copyleft license compatible with this proprietary
application. MPL-2.0 requires that the source of the MPL-covered files
remain available and that the license/notices be preserved; the
unmodified upstream source is available at the URL above.

## Government works

PCS Express references the following U.S. government publications as
informational source material. U.S. Government works are not subject to
copyright protection in the United States under 17 U.S.C. §105, but are
attributed here for clarity:

* Joint Travel Regulations (JTR) — Defense Travel Management Office
* Federal Travel Regulation (FTR) — General Services Administration
* Department of State Standardized Regulations (DSSR) — Department of
  State
* Defense Federal Acquisition Regulation Supplement (DFARS)
* Internal Revenue Code (IRC) — relevant SCRA and CZTE sections
* U.S. Citizenship and Immigration Services (USCIS) form references
* Department of Veterans Affairs benefit publications

No DoD, VA, or military branch logo, seal, or insignia is reproduced in
the PCS Express UI. Branch names are used in their nominative sense to
identify the audience served and do not imply endorsement.

## Trademarks

* "PCS Express" is the name of this independent application and the
  property of its operator.
* All other names (branch names, base names, JTR/FTR/DSSR, "BAH",
  "OHA", "LQA", "PPM", etc.) are referenced for descriptive identification
  only. No claim is made of ownership or endorsement.

## Map data

Routing and geocoding in the Navigation tab use:

* **OpenStreetMap** tile and Nominatim geocoding data — © OpenStreetMap
  contributors, available under the Open Database License (ODbL).
  https://www.openstreetmap.org/copyright
* **OSRM** routing — BSD-2-Clause.
  https://github.com/Project-OSRM/osrm-backend

## AI services

The AI Assistant feature forwards user prompts to:

* **Anthropic, Inc.** (Claude API) under Anthropic's own terms and
  privacy policy. PCS Express does not retain prompts or completions
  server-side.

## Bundled fonts

PCS Express self-hosts two webfonts, each under the SIL Open Font License,
Version 1.1 (full text + copyright notices in `public/fonts/OFL.txt`):

* **Inter** — Copyright (c) 2016-2020 The Inter Project Authors.
* **Space Grotesk** — Copyright (c) 2020 The Space Grotesk Project Authors.

## How to report a missing attribution

If you believe an attribution is missing or incorrect, please email
info@cyberwaveglobal.com or open an issue at
https://github.com/damienmcdade/PCSExpress/issues.
