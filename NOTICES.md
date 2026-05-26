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
| postcss | MIT | https://github.com/postcss/postcss |
| react | MIT | https://github.com/facebook/react |
| react-dom | MIT | https://github.com/facebook/react |
| rollup | MIT | https://github.com/rollup/rollup |

React and React-DOM are included in the runtime bundle even though they
are currently declared in `devDependencies` (a known classification
defect tracked separately).

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

## How to report a missing attribution

If you believe an attribution is missing or incorrect, please email
contact@pcsexpress.app or open an issue at
https://github.com/damienmcdade/PCSExpress/issues.
