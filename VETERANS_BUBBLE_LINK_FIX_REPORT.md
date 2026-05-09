# Veterans Bubble Link Fix

Updated: 2026-05-09T12:13:15

## What changed
- Replaced the Veterans category filter buttons with active link bubbles.
- Added active official/resource links for SBA veteran-owned business guidance, SBA VetCert, SBA VBOC counseling, VA OSDBU, SAM.gov Entity Information, and SBA Small Business Search.
- Added current public search links tailored to the onboarding gaining installation for local veteran-owned businesses, restaurants, and home services.
- Removed the unused legacy static veteran-business object because many entries had blank URLs and could reintroduce dead link bubbles.
- Kept the same card layout, but every displayed card now has a non-empty source URL.

## QA checks
- Veterans helper and tab patched exactly once.
- Bubble categories now render as external links.
- Displayed Veterans cards are filtered to URL-backed records only.
