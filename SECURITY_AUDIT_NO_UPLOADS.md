# PCS Express Security Audit - No Upload Overhaul

Date: 2026-05-07

## Completed controls

- Removed all React file input controls from PCS Documents and Employment.
- Removed FileReader-based document/resume file ingestion from the frontend.
- Removed local `pcs_file_*` attachment persistence cleanup path from the document module.
- Removed iOS SecureDocumentPlugin and KeychainDocumentService from the Xcode build path and deleted their source files.
- Removed Android FileProvider exposure from the Android manifest.
- Updated interactive demo and startup recovery copy so no document upload capability is described.
- Added Security category explaining no-upload controls, local-first posture, browser hardening, and DoD/DISA-style alignment.
- Added Home Locator category with gaining-installation housing lookup paths, manual base/address/ZIP input, landlord filters, home-type filters, and VA loan checklist.
- Hardened server headers: CSP, Permissions-Policy, nosniff, referrer policy, frame control, cross-origin resource policy, DNS prefetch off, and production HSTS.

## Remaining risk notes

- PCS Express is not a formal DoD ATO, FedRAMP authorization, or DISA certification.
- Users can still type sensitive text into ordinary form fields. The app warns users not to enter classified, CUI, restricted, mission, roster, or non-public government data.
- External housing and lender links leave the app. Users must verify listing accuracy, lender licensing, rates, reviews, and terms directly with the source.
- Public real-estate listing availability changes frequently; the app uses live search paths rather than storing listing data.

## Verification command

Run:

```bash
rg -n "input\\s+type=.*file|FileReader|SecureDocumentPlugin|KeychainDocumentService|storeDocument|retrieveDocument|pcs_file_|Attach File" src ios/App/App.xcodeproj android/app/src/main server
```

Expected result: no active upload capability. Some non-upload uses of words such as FileManager, file paths, or USCIS filing language may remain.
