# PPM, Timeline, and Base Intelligence Platform Update

Updated: 2026-05-10T10:36:33

## Added modules
- `src/lib/ppmCalculator.js`: PPM estimate engine using rank, years of service, distance, estimated weight, 95 percent GCC planning incentive, rental truck/fuel estimates, and after-tax cash-in-pocket output.
- `src/components/PPMFinancialEstimator.jsx`: Mobile-first PPM UI with Profit Meter and official JTR/DPS links.
- `src/components/DynamicTimeline.jsx`: RNLTD/backward-planned timeline with T-minus 60, 30, and 10 day milestones plus notification toggles.
- `src/components/BaseIntelligenceReviews.jsx`: Housing, Schools, and Childcare review UI with Military Family Verified badges.
- `server/db/base-reviews.sql`: PostgreSQL BaseReviews table with InstallationName, Category, Rating, UserRank, verification metadata, PII exclusion comments, checks, and indexes.

## App integration
- Home Relocation now includes a PPM Estimator tab.
- PCS Checklist now includes the dynamic 90-day timeline.
- Home screen now includes Base Intelligence as a category.
- Interactive demo includes Base Intelligence and updated Checklist/Home Relocation descriptions.

## Security posture
- No document upload capability was added.
- BaseReviews schema stores review metadata and verification status only.
- Express exposes schema and validation endpoints that reject likely raw PII.
- Official financial outcome still requires DPS/PPPO/TMO verification because JTR and PPM rates can change.
