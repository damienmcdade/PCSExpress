# Web Push Notifications — Operator Setup

PCS Express ships push-notification *readiness* (Phase 15.4). The
plumbing is complete; flipping push on is a one-step operator change
because VAPID keys can't be safely generated or stored by the app
itself.

## What's already wired

| Piece | Where | Status |
|---|---|---|
| Service-worker `push` event handler | `public/pcs-sw.js` | Active. Receives JSON `{ title, body, tab }` and shows a system notification. |
| Service-worker `notificationclick` handler | `public/pcs-sw.js` | Active. Focuses an open tab + deep-links via `?go=<tab>`. |
| Client subscription helper | `src/pushNotifications.js` | Idempotent `enablePushNotifications()` / `disablePushNotifications()`. Asks the server for the configured VAPID public key, requests permission, subscribes the user, registers with the server. |
| Server config endpoint | `GET /api/push-config` | Returns `{ vapidPublicKey: null }` until env is set. |
| Server subscription endpoints | `POST /api/push-subscribe`, `POST /api/push-unsubscribe` | Store subscriptions in an in-memory map. Replace with a persistent store before going to production. |

## What's NOT wired (operator work)

1. **Generate a VAPID keypair.** Run once, never check the private key into git:

   ```bash
   npx web-push generate-vapid-keys --json
   ```

2. **Set environment variables on Railway (and any other host that runs the Express server):**

   ```
   VAPID_PUBLIC_KEY=BPxc... (long base64url string)
   VAPID_PRIVATE_KEY=Hsd... (shorter base64url string — KEEP SECRET)
   VAPID_SUBJECT=mailto:info@cyberwaveglobal.com
   ```

3. **Install the `web-push` library and add a dispatch endpoint.** Suggested shape (add to `server/index.js`):

   ```js
   import webPush from 'web-push'
   webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

   app.post('/api/push-dispatch', async (req, res) => {
     const { title, body, tab, key } = req.body
     if (key !== process.env.PUSH_DISPATCH_KEY) return res.status(403).end()
     const payload = JSON.stringify({ title, body, tab })
     const results = await Promise.allSettled(
       Array.from(PUSH_SUBSCRIPTIONS.values()).map(sub =>
         webPush.sendNotification(sub, payload).catch(err => {
           if (err.statusCode === 404 || err.statusCode === 410) PUSH_SUBSCRIPTIONS.delete(sub.endpoint)
           throw err
         })
       )
     )
     return res.json({ sent: results.filter(r => r.status === 'fulfilled').length })
   })
   ```

4. **Replace the in-memory `PUSH_SUBSCRIPTIONS` Map** with a persistent store (Redis, Postgres) before relying on push in production — the Map resets every deploy.

5. **Expose a UI affordance** that calls `enablePushNotifications()`. The natural spot is the notifications dropdown (`App.jsx`, around the `showNotifs` panel) — a single "Enable push reminders" button.

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
