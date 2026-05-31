# Web Push Notifications — Operator Setup

Web Push is **fully wired end to end** (client → service worker → server
subscribe → server dispatch) as of v1.1.6. Turning it on is purely an
operator env-var change because VAPID keys can't be safely generated or
stored by the app itself.

## What's wired

| Piece | Where | Status |
|---|---|---|
| Service-worker `push` event handler | `public/pcs-sw.js` | Active. Receives JSON `{ title, body, tab, tag }` and shows a system notification. |
| Service-worker `notificationclick` handler | `public/pcs-sw.js` | Active. Focuses an open tab + deep-links via `?go=<tab>`. |
| Client subscription helper | `src/pushNotifications.js` | Idempotent `enablePushNotifications()` / `disablePushNotifications()`. Asks the server for the configured VAPID public key, requests permission, subscribes, registers with the server. |
| Server config endpoint | `GET /api/push-config` | Returns `{ vapidPublicKey }` (or `null` until env is set). |
| Server subscription endpoints | `POST /api/push-subscribe`, `POST /api/push-unsubscribe` | Store subscriptions in an in-memory map (endpoint-keyed, capped, oldest-evicted). |
| **Server dispatcher** | `POST /api/push-dispatch` | **Active.** `web-push`-signed broadcast to every subscription; sanitizes the payload; prunes 404/410 (gone) subscriptions; auth via `PUSH_DISPATCH_KEY`. |

## Turning it on (operator work)

1. **Generate a VAPID keypair.** Run once, never check the private key into git:

   ```bash
   npx web-push generate-vapid-keys --json
   ```

2. **Set environment variables** on Railway (and any other host that runs the Express server):

   ```
   VAPID_PUBLIC_KEY=BPxc...        # long base64url string
   VAPID_PRIVATE_KEY=Hsd...        # shorter base64url string — KEEP SECRET
   VAPID_SUBJECT=mailto:info@cyberwaveglobal.com
   PUSH_DISPATCH_KEY=<random secret>   # authorizes /api/push-dispatch; UNSET = endpoint disabled
   ```

   On boot the server logs `[push] enabled=<bool> dispatch=<authorized|disabled>`
   so you can confirm config landed.

3. **Send a broadcast.** The dispatch endpoint is server-to-server — authenticate
   with the secret in a header (NOT the body, so it never lands in body logs):

   ```bash
   curl -X POST https://pcsexpress-production.up.railway.app/api/push-dispatch \
     -H "Authorization: Bearer $PUSH_DISPATCH_KEY" \
     -H "Content-Type: application/json" \
     -d '{"title":"Orders posted","body":"Your RFO is available.","tab":"timeline"}'
   # → { "ok": true, "enabled": true, "sent": N, "failed": 0, "pruned": M, "total": N }
   ```

   Payload fields: `title` (≤100), `body` (≤250), `tab` (deep-link slug → `/?go=<tab>`),
   `tag` (collapses duplicate notifications). All are control-char-stripped and
   length-capped server-side by `buildPushPayload`.

### Behavior / hardening notes

- **Auth is constant-time** (`secretsMatch`, SHA-256 + `timingSafeEqual`); no
  `PUSH_DISPATCH_KEY` set ⇒ `503 push-dispatch not configured` (a fresh deploy
  can't be made to spam users). Wrong/absent key ⇒ `403`. A dedicated per-IP
  rate limit (10/min) throttles brute-forcing the key.
- **Self-healing store:** a push service replying `404`/`410` (unknown / user
  revoked) prunes that subscription from the Map; the response reports `pruned`.
- **Origin guard exempt:** `/api/push-dispatch` is excluded from the
  Origin-on-write CSRF guard because the Bearer secret is the stronger
  guarantee and machine callers send no Origin.

## Still optional / future

1. **Persistent subscription store.** The in-memory `PUSH_SUBSCRIPTIONS` Map
   resets every deploy (acceptable on Railway's single instance — clients
   re-subscribe on reconnect). Swap for Redis/Postgres if cross-deploy
   durability or multi-replica fan-out is needed.
2. **UI affordance.** `enablePushNotifications()` is ready to call; the natural
   spot is the notifications dropdown (`App.jsx`, near the `showNotifs` panel) —
   a single "Enable push reminders" button.
3. **Scheduling.** `/api/push-dispatch` is a manual/cron trigger; wire it to a
   scheduler (Railway cron or a GitHub Action) for timeline-based reminders.

## Security / DOD-DISA alignment notes

- **No PII** leaves the device in any of these endpoints. The
  subscription object is the browser-issued push endpoint URL plus
  the `p256dh` and `auth` cryptographic keys. No name, branch, rank,
  duty station, or checklist content is transmitted.
- **Subscriptions are not tied to user identity** server-side. The
  Map keyed by endpoint URL is intentional — broadcasts go to every
  subscribed endpoint, so users opt in to receive *general* PCS
  Express push messages, not personalized ones. Personalized push
  would require auth, which Phase 15 deliberately doesn't add.
- **Push dispatch must be authenticated** behind `PUSH_DISPATCH_KEY`.
  The example above gates the endpoint behind a shared secret. Use a
  proper auth layer (signed request, OAuth token) before opening to
  third parties.
- **VAPID private key is the keys-to-the-kingdom secret.** Anyone with
  it can send notifications to every subscribed user. Treat it like a
  signing key — env-var only, never logged, rotated on suspected
  compromise.
