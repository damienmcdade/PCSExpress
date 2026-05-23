/*
 * Independence disclaimer — single source of truth.
 *
 * INDEPENDENCE_DISCLAIMER is the canonical sentence shown anywhere PCS Express
 * tells a user that the app is not DoD-endorsed. Every surface that needs to
 * render the disclaimer imports from here so the wording cannot drift over
 * time (a previous audit found the same sentence written four different ways
 * across the codebase).
 *
 * Surfaces using this constant:
 *   - src/components/LandingPage.jsx           (public marketing footer)
 *   - src/components/ComplianceAttestationModule.jsx  (in-app Help Hub)
 *   - src/App.jsx                              (in-app Compliance / Help section)
 *   - src/components/AppShellFooter.jsx        (persistent app-shell footer)
 *   - src/components/IndependenceAck.jsx       (first-launch one-tap ack modal)
 *
 * Keep the sentence short and self-contained — extra context (regulatory
 * references, engineering rationale, etc.) belongs in prose next to the
 * disclaimer, not inside this string.
 */

export const INDEPENDENCE_DISCLAIMER =
  'PCS Express is an independent platform — not endorsed by or affiliated with the DoD, VA, or any military branch.';
