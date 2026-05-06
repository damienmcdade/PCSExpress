# PCS Express Security Audit

Generated: 2026-05-06

## Scope

This audit reviewed the application source for:

- Non-public government, military, CUI, classified, operational, or sensitive reference data.
- Raw local persistence of user-entered PCS data.
- User-uploaded document handling.
- Public-data notices and sensitive-input notices in the user interface.
- Native iOS secure document storage integration.

## Public Data Finding

Result: PASS

The automated public-data scan found no application reference data requiring removal. Stale backup source files with obsolete storage logic were removed from `src/` so they are not included in future builds or audits.

The app now displays public-data notices explaining that reference content is limited to official public U.S. government, U.S. military, or public-source lookup information. Users are warned not to enter classified information, CUI, rosters, operational details, access procedures, internal contact lists, or other non-public government information.

## User Data Finding

Result: HARDENED

Active web persistence now routes through `secureLocalStore`, which uses AES-GCM encryption with a generated non-extractable Web Crypto key stored in browser-managed IndexedDB when supported. Native iOS document blobs continue to use the iOS Keychain through `SecureDocumentPlugin`.

Documents uploaded through the PCS Documents workflow are stored locally:

- iOS native: Keychain-backed secure storage.
- Web: encrypted local browser storage when Web Crypto and IndexedDB are available.

The Orders upload flow no longer sends extracted orders text to the AI endpoint. It reads the file locally and asks the user to review and save only the minimum fields needed.

## Standards Alignment

PCS Express is designed to align with the intent of:

- NIST SP 800-218 Secure Software Development Framework.
- DISA STIG-style data minimization, least exposure, local protection, and public-data handling expectations.
- DoD public-release discipline for avoiding classified, CUI, operational, and non-public government data in app reference content.

This document is not a formal DoD authorization, ATO, DISA certification, or compliance attestation. Formal use with government data requires organization-specific assessment, authorization, configuration review, penetration testing, and continuous monitoring.

## Verification Commands

- `node scripts/public-data-scan.mjs`
- `npm run build`
- `npx cap sync ios`

