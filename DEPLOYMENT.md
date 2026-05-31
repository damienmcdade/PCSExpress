# Deployment

PCS Express ships as a Vite React SPA (Vercel) + an Express API (Railway),
with iOS/Android wrappers (Capacitor).

## Release the web + API
```
npm run deploy:vercel    # frontend (Vercel, prod)
npm run deploy:railway   # backend (Railway) — Railway does NOT auto-deploy
```
Run BOTH for any change touching the server, so the frontend and the backend
it calls don't drift. `npm run deploy:all` runs them in sequence.

> CI auto-deploy (`.github/workflows/release.yml`) is wired but inert until the
> `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`/`RAILWAY_TOKEN` repo secrets
> are set; until then releases are the manual commands above.

## Native (Capacitor)
```
npm run build && npx cap copy ios && npx cap copy android   # propagate web build
npm run ios:build        # iOS (needs Apple Distribution cert + ASC API key)
npm run android:bundle   # Android signed AAB (needs the upload keystore)
```

## Versioning
`package.json` `version` is the source of truth. Update the native
`MARKETING_VERSION` / `versionName` to match on each release; bump the native
build numbers (`CFBundleVersion` / `versionCode`) per store submission. Tag
each release `vX.Y.Z` and record it in `CHANGELOG.md`.

## Required env
See `server/.env.example` (Railway) and `.env.example` (build/dev). The only
mandatory server var for live AI is `ANTHROPIC_API_KEY`; everything else
degrades gracefully when unset.
