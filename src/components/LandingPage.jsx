/*
 * LandingPage — public-facing capability statement + entry point.
 *
 * Shown to first-time visitors before the onboarding flow, and also on
 * demand via ?landing=1 (used when showing the platform to VA / DoD
 * small-business liaisons, prime contractors, veteran orgs, etc.). The
 * existing in-app experience for already-onboarded users is unchanged
 * — once a profile exists, the landing is bypassed and the user goes
 * straight to the dashboard.
 *
 * Truthfulness guardrails:
 *   - We do NOT claim DoD, VA, FedRAMP, DISA, ATO, IL4/IL5, or any
 *     official agency endorsement. The disclaimer at the bottom is
 *     explicit and matches the agency-facing language the founder
 *     would defend in front of a contracting officer.
 *   - Security claims are limited to what's actually implemented
 *     (AES-256-GCM at rest, HTTPS, minimal collection, no document
 *     upload anywhere) and what's truthfully on the roadmap.
 *   - Metrics show as placeholders until real numbers exist.
 *
 * The palette matches the existing app: navy primary, white surface,
 * muted gold accents. No external assets — every visual element is
 * inline CSS so the page works fully offline and renders identically
 * in the iOS / Android Capacitor shells if ever shown there.
 */
import { lazy, Suspense, useState } from 'react';
import BranchBackdrop from './BranchBackdrop';
import { branchTheme } from '../config/branchTheme';
import { INDEPENDENCE_DISCLAIMER } from '../config/disclaimer';

// v2 — lazy-load the AI Assistant modal exactly the way App.jsx does so
// the LandingPage's "Need help now" button can open the same multi-
// turn assistant (with the crisis-line header + curated-KB fallback)
// that authenticated users get. LandingPage is shown BEFORE App's
// onboarding state mounts, so we can't rely on App's open-ai-assistant
// window event — we mount our own modal instance here.
const AIAssistantModal = lazy(() =>
  import('./AIAssistantChip').then(m => ({ default: m.AIAssistantModal }))
);

const PALETTE = {
  navy: '#0D3B66',
  navyDeep: '#082A4D',
  gold: '#C99A3D',
  paper: '#FFFFFF',
  bg: '#F4F6F9',
  text: '#0D1821',
  muted: '#56697C',
  border: '#E0E6EE',
  green: '#1B5E20',
  greenSoft: '#E8F5E9',
};

// Display font for hero headers + section titles + brand mark.
// Space Grotesk is a geometric sans with a slightly technical /
// mission-control character that contrasts the neutral Inter body
// without crossing into stencil-font cosplay. Loaded in index.html.
const DISPLAY_FONT = '"Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI Variable", system-ui, sans-serif';

const SECTIONS = [
  { id: 'who', label: 'Who we serve' },
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How it works' },
  { id: 'security', label: 'Security' },
  { id: 'partners', label: 'For partners' },
  { id: 'roadmap', label: 'Roadmap' },
];

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function CTAButton({ children, onClick, variant = 'primary', style = {} }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 800,
    letterSpacing: '.02em',
    padding: '14px 22px',
    borderRadius: 12,
    fontSize: 14,
    minHeight: 48,
    transition: 'transform .12s ease, box-shadow .12s ease',
    ...style,
  };
  const variants = {
    primary: {
      background: PALETTE.gold,
      color: PALETTE.navyDeep,
      boxShadow: '0 6px 18px rgba(201, 154, 61, 0.28)',
    },
    secondary: {
      background: PALETTE.paper,
      color: PALETTE.navy,
      border: `1.5px solid ${PALETTE.navy}`,
    },
    ghost: {
      background: 'transparent',
      color: PALETTE.paper,
      border: `1.5px solid rgba(255,255,255,0.45)`,
    },
  };
  return (
    <button type="button" onClick={onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

function SectionHeader({ kicker, title, subtitle, light = false }) {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto 36px', textAlign: 'center' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        fontSize: 11, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase',
        color: PALETTE.gold, marginBottom: 12,
      }}>
        {/* Decorative leading bar — small gold accent rule so the
            kicker reads as a labelled section rather than floating
            uppercase text. */}
        <span aria-hidden="true" style={{ display: 'inline-block', width: 28, height: 2, background: PALETTE.gold, borderRadius: 2 }} />
        {kicker}
        <span aria-hidden="true" style={{ display: 'inline-block', width: 28, height: 2, background: PALETTE.gold, borderRadius: 2 }} />
      </div>
      <h2 style={{
        fontSize: 32, fontWeight: 700, color: light ? PALETTE.paper : PALETTE.navy,
        margin: '0 0 12px', lineHeight: 1.15, letterSpacing: '-0.025em',
        fontFamily: DISPLAY_FONT,
      }}>{title}</h2>
      {subtitle && (
        <p style={{
          fontSize: 15, lineHeight: 1.65, color: light ? 'rgba(255,255,255,0.85)' : PALETTE.muted,
          margin: 0,
        }}>{subtitle}</p>
      )}
    </div>
  );
}

function Card({ children, style = {}, accent, className = '' }) {
  // `accent` (optional) renders a 3px colored stripe along the top of
  // the card so the eye can group cards by category without copy
  // alone (used for the Features grid). `className` lets a caller
  // opt out of the default hover-lift if needed.
  return (
    <div className={`pcs-card ${className}`} style={{
      background: PALETTE.paper,
      border: `1px solid ${PALETTE.border}`,
      borderRadius: 16,
      padding: 22,
      boxShadow: '0 6px 18px rgba(13, 24, 33, 0.04)',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      {accent && (
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: accent,
        }} />
      )}
      {children}
    </div>
  );
}

const WHO_WE_SERVE = [
  { label: 'Active Duty', detail: 'All branches and ranks, from junior enlisted to flag officer.' },
  { label: 'Reserve Component', detail: 'Title 10 mobilizations, annual training relocations, and PCS-equivalent moves.' },
  { label: 'National Guard', detail: 'Title 32 activations, AGR, and federal-active orders.' },
  { label: 'Military Spouses', detail: 'Family-side checklists, license portability, and SECO career resources.' },
  { label: 'Veterans Transitioning', detail: 'Post-separation relocation, GI Bill schools, VA benefits, and SCRA protections.' },
  { label: 'DoD Civilians', detail: 'GS, SES, and WG employees with FTR §302 relocation, LQA, and TQSA workflows.' },
  { label: 'First-time PCS Families', detail: 'Step-by-step guidance for the very first move — what to ask, when to ask it.' },
  { label: 'CONUS & OCONUS', detail: 'Stateside moves and overseas PCS with pet-import, country-clearance, and EFMP support.' },
];

const FEATURES = [
  { icon: '✓', title: 'PCS checklist + task tracking', body: 'Tailored to your branch, component, orders type, and family situation. Phases run from orders received through in-processing at the gaining installation.' },
  { icon: '⌂', title: 'Housing & location planning', body: 'Verified housing sources for every branch — HOMES.mil, AHRN, MilitaryByOwner — alongside live listings and Fair Market Rent context.' },
  { icon: '$', title: 'Benefits & entitlement guidance', body: 'BAH, OHA, LQA, TQSA, PPM, DLA, TLE, MALT, weight allowance, and pet shipment — calculators plus citations to JTR / FTR / DSSR.' },
  { icon: '⎙', title: 'Document organization', body: 'Orders, leases, weight tickets, inventory worksheets — organized by phase. PCS Express never accepts, stores, or transmits document uploads.' },
  { icon: '⏱', title: 'Timeline & milestone planning', body: 'Backward-planned from your Report-NLT date with CONUS (90-day) and OCONUS (180-day) templates that absorb pet quarantine, passports, and country clearance.' },
  { icon: '◎', title: 'Installation & area research', body: 'Schools, hospitals, religious services, family support offices, and veteran-owned businesses near every gaining installation.' },
  { icon: '◇', title: 'Family readiness resources', body: 'EFMP screening, spouse deployment guide, child care, education benefits, and immigration support for non-US-citizen family members.' },
  { icon: '∗', title: 'AI-assisted PCS guidance', body: 'Natural-language Q&A grounded in JTR / FTR / DSSR with curated fallback when the live provider is offline. Crisis line + Military OneSource pinned in every conversation.' },
  { icon: '◈', title: 'Personalized relocation workflow', body: 'Checklist, timeline, and resource pane all retune automatically to your branch, paygrade, dependents, and CONUS vs OCONUS status.' },
];

const HOW_IT_WORKS = [
  { n: 1, title: 'Enter your move details', body: 'Branch, component, paygrade, family status, gaining and losing installations, and your Report-NLT date — the minimum needed to tailor the rest of the experience.' },
  { n: 2, title: 'Build your PCS timeline', body: 'PCS Express produces a backward-planned schedule with the correct phases for your CONUS or OCONUS move, including pet, passport, and country-clearance lead times.' },
  { n: 3, title: 'Track tasks and documents', body: 'Work through phase-by-phase checklists, mark milestones, and pull entitlement calculations on demand. Everything stays encrypted on your device.' },
  { n: 4, title: 'Access resources before, during, and after', body: 'Housing tools, installation research, family-readiness contacts, and post-arrival guidance — available offline once cached.' },
];

const PAIN_POINTS = [
  { headline: 'Information is scattered.', detail: 'JTR, FTR, DSSR, branch-specific portals, installation-specific resources — there is no single map.' },
  { headline: 'Timelines vary by branch + component.', detail: 'An OCONUS PCS for a Title-32 Guard member is not the same as an Active-Duty Army CONUS move. Generic checklists miss this.' },
  { headline: 'Families carry the operational burden.', detail: 'Service members are absorbed by unit out-processing. Spouses absorb housing, schools, pets, and benefits work.' },
  { headline: 'Mistakes are expensive.', detail: 'Missed DPS windows, late weight tickets, and unverified housing offers cost real dollars and trigger reimbursement disputes.' },
];

const OPERATIONAL_BENEFITS = [
  { title: 'Reduced administrative load', body: 'Phase-based workflows reduce the number of decisions a service member or family makes in a high-stress window.' },
  { title: 'Higher completion rates', body: 'Checklists tailored to actual orders type and family situation make it harder to forget critical steps.' },
  { title: 'Better outcomes for OCONUS moves', body: 'Pet-import, EFMP screening, country clearance, and Patriot Express timing are surfaced before they become hard deadlines.' },
  { title: 'Centralized reference', body: 'Authoritative links to JTR, FTR, DSSR, TRICARE, DTMO, and branch portals are organized by phase, not by site.' },
];

const SECURITY_POINTS = [
  { title: 'HTTPS-only delivery', body: 'Every request is TLS 1.2+ with HSTS preload and a strict Content Security Policy.' },
  { title: 'Encryption at rest on device', body: 'Profile, checklist, and reminders are encrypted with AES-256-GCM. The key lives in IndexedDB, is non-extractable, and never leaves the device.' },
  { title: 'No document uploads', body: 'PCS Express does not accept, store, or transmit document uploads or photographs anywhere in the product.' },
  { title: 'Minimal on-device profile', body: 'Your PCS profile (name, branch, rank, family info) is stored only on this device under AES-256-GCM. Everything that does leave the device is listed below.' },
  { title: 'What does leave the device (always disclosed in-app)', body: 'AI Assistant: your typed question + a non-PII context blob (branch / phase / open-task count) to Anthropic. Navigation: addresses you type, to OpenStreetMap (Nominatim + OSRM). Translation widget (opt-in): translated page contents to Google. AdSense (third-party advertising support) loads non-personalized ads by default.' },
  { title: 'Auditable design', body: 'The codebase follows public standards alignments (NIST SP 800-53 SC-5 rate-limit, OWASP ASVS V4 input handling) and prompt-injection sanitization for the AI surface.' },
  { title: 'Roadmap', body: 'Optional federated identity, audit-log export, federal-readiness control mapping (NIST 800-171 / 800-53 moderate), and SBOM publishing are tracked items for future hardening.' },
];

const ROADMAP = [
  { phase: 'Live today', items: ['Tailored PCS checklist (all branches + components)', 'BAH / OHA / LQA / PPM / TQSA calculators', 'Encrypted on-device profile (AES-256-GCM)', 'Installation directory + housing tools', 'AI Assistant with curated KB fallback', 'iOS + Android native shells (Capacitor)'] },
  { phase: 'In development', items: ['Personalized relocation workflow refinements', 'Pull-to-refresh on data tabs', 'Floating AI Assistant access on mobile', 'Production push notifications', 'Expanded EFMP and immigration support'] },
  { phase: 'Planned roadmap', items: ['Mobile app store release (iOS + Android)', 'Installation resource database expansion', 'Secure document vault (opt-in)', 'Partner dashboard for organizations', 'Aggregate analytics for partner orgs (non-PII)', 'Security hardening — NIST 800-171 / 800-53 control mapping', 'Government integration readiness review'] },
];

const PARTNER_USE_CASES = [
  { who: 'Family Readiness Programs', what: 'A consistent self-service planner for incoming and outgoing families, freeing FRG / FRSA staff to focus on high-touch cases.' },
  { who: 'Transition Assistance', what: 'Post-separation PCS support paired with VA benefits, GI Bill schools, and SCRA-protected lease workflows for newly separating service members.' },
  { who: 'Relocation Education', what: 'On-demand entitlement and timeline content for first-time movers, presented in branch- and component-correct language.' },
  { who: 'Installation Resource Navigation', what: 'A single map of housing, schools, medical, and family-support sources for every installation a member is leaving or arriving at.' },
  { who: 'Administrative Burden Reduction', what: 'Phase-based checklists that pre-load the right paperwork and entitlement context before the member walks into S1, MPF, IPAC, or PSD.' },
];

export default function LandingPage({ onStartPlan, onClose }) {
  // v3 — AI Assistant modal state. The hero now exposes a prominent
  // "AI Assistant" button (replaced the Need-Help-Now chip) so users
  // who land on the marketing page can get tailored answers about
  // PCS / JTR / FTR / DSSR before signing up. The floating
  // CrisisLineChip is still rendered globally for users who need
  // 988 / OneSource directly.
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  // v4 — preview branch theme on hero. When a visitor hovers / taps a
  // branch chip, the hero gradient + backdrop SVG shift to that
  // service's published color scheme. Defaults to null = neutral
  // navy-teal gradient (the cross-branch view).
  const [previewBranch, setPreviewBranch] = useState(null);
  const startPlan = () => { try { onStartPlan?.(); } catch {} };
  const activeTheme = previewBranch ? branchTheme(previewBranch) : null;

  return (
    <div
      style={{
        background: PALETTE.bg,
        color: PALETTE.text,
        minHeight: '100vh',
        // marginal global scope so the keyframes below can be reused
        // by any block inside the LandingPage tree.
        position: 'relative',
        // v5 — Inter is now actually loaded via Google Fonts in
        // index.html, so this stack no longer silently falls back to
        // system-ui (which was why the prior "modernization" looked
        // unchanged). cv11 = single-story 'a', ss01 = open digits,
        // ss03 = curved 'l' — Inter's recommended UI feature set.
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Roboto, system-ui, sans-serif',
        fontFeatureSettings: '"cv11", "ss01", "ss03", "calt"',
        letterSpacing: '-0.011em',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      {/* Page-wide polish stylesheet. Card hover lift, section reveal
          keyframes, and the trust-strip stat hover. Keeping these in
          a single inline <style> avoids touching the global CSS file
          and ensures the rules ship with the LandingPage chunk only. */}
      <style>{`
        .pcs-card {
          transition: transform 220ms cubic-bezier(.2,.7,.25,1),
                      box-shadow 220ms cubic-bezier(.2,.7,.25,1),
                      border-color 220ms ease;
        }
        .pcs-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(13, 24, 33, 0.10),
                      0 4px 10px rgba(13, 24, 33, 0.05);
          border-color: rgba(201, 154, 61, 0.45);
        }
        .pcs-trust-stat {
          transition: transform 200ms ease, color 200ms ease;
        }
        .pcs-trust-stat:hover { transform: translateY(-2px); }
        @keyframes pcs-fade-up {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
        @keyframes pcs-pulse-soft {
          0%, 100% { opacity: 0.55; transform: scale(1);   }
          50%      { opacity: 1;    transform: scale(1.25); }
        }
        .pcs-step-node {
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .pcs-card:hover .pcs-step-node {
          transform: scale(1.06);
          box-shadow: 0 8px 22px rgba(201,154,61,0.45);
        }
        @media (prefers-reduced-motion: reduce) {
          .pcs-card, .pcs-trust-stat, .pcs-step-node { transition: none !important; }
        }
      `}</style>

      {/* ───── NAV ───── */}
      <nav
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'saturate(180%) blur(8px)',
          WebkitBackdropFilter: 'saturate(180%) blur(8px)',
          borderBottom: `1px solid ${PALETTE.border}`,
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => scrollTo('top')}
            aria-label="PCS Express — home"
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${PALETTE.navy} 0%, ${PALETTE.navyDeep} 100%)`,
              color: PALETTE.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 950, letterSpacing: '.04em',
            }}>PE</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: PALETTE.navyDeep, letterSpacing: '-0.02em', fontFamily: DISPLAY_FONT }}>PCS Express</span>
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'none', gap: 22 }} className="pe-nav-links">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: PALETTE.muted }}
              >
                {s.label}
              </button>
            ))}
          </div>
          {/* Nav-bar "Start Your PCS Plan" removed per user directive
              — redundant with the prominent animated hero CTA right
              below. */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close landing and return to app"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: PALETTE.muted, fontSize: 13, fontWeight: 700, padding: '6px 8px' }}
            >
              Skip ✕
            </button>
          )}
        </div>
      </nav>

      {/* ───── HERO ───── */}
      {/* v3 — design refresh per user directive: replaced the
          Need-Help-Now CTA with an AI Assistant button (988 / Crisis
          access still available via the floating CrisisLineChip), and
          warmed the hero gradient with a vibrant teal accent so the
          page reads as "active mission" rather than "static brochure"
          while staying institutionally appropriate. */}
      <section
        id="top"
        style={{
          // v4 — gradient swaps to the previewed branch's published
          // palette on hover / tap so visitors can see the platform
          // adapt to their service before signing up.
          background: activeTheme
            ? activeTheme.bgGradient
            : `linear-gradient(135deg, ${PALETTE.navyDeep} 0%, ${PALETTE.navy} 45%, #0F5A8F 100%)`,
          color: PALETTE.paper,
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 280ms ease',
        }}
      >
        {previewBranch && <BranchBackdrop branch={previewBranch} opacity={0.28} />}
        {/* Inline keyframes — Vite doesn't transform <style> children
            but the browser does, and this keeps the animation
            self-contained in the LandingPage without touching the
            global stylesheet. */}
        <style>{`
          @keyframes pcs-radar-sweep {
            0%   { transform: translate(-50%,-50%) rotate(0deg);   }
            100% { transform: translate(-50%,-50%) rotate(360deg); }
          }
          @keyframes pcs-grid-drift {
            0%   { background-position: 0 0; }
            100% { background-position: 60px 60px; }
          }
          @keyframes pcs-pulse {
            0%, 100% { transform: scale(1);   opacity: 0.9; }
            50%      { transform: scale(1.6); opacity: 0;   }
          }
          @keyframes pcs-stripe-shift {
            0%   { background-position: 0 0;   }
            100% { background-position: 200px 0; }
          }
          /* "Start Your PCS Plan" active-effects bundle:
             - cta-attention: gentle scale + glow breath so the button
               draws the eye even before hover.
             - cta-glow: secondary gold drop-shadow pulse layered on top
               of the breath.
             - cta-shimmer: a diagonal highlight band that travels across
               the button face every few seconds.
             - cta-arrow-pulse: the trailing → nudges right then
               settles, signalling "this leads somewhere."
             Reduced-motion users get a flat, static button. */
          @keyframes pcs-cta-attention {
            0%, 100% { transform: translateY(0)    scale(1);    }
            50%      { transform: translateY(-2px) scale(1.015); }
          }
          @keyframes pcs-cta-glow {
            0%, 100% { box-shadow: 0 10px 26px rgba(201,154,61,0.38), 0 0 0  0   rgba(201,154,61,0.55); }
            50%      { box-shadow: 0 14px 34px rgba(201,154,61,0.55), 0 0 0 12px rgba(201,154,61,0);     }
          }
          @keyframes pcs-cta-shimmer {
            0%   { transform: translateX(-130%) skewX(-18deg); }
            70%  { transform: translateX(160%)  skewX(-18deg); }
            100% { transform: translateX(160%)  skewX(-18deg); }
          }
          @keyframes pcs-cta-arrow {
            0%, 100% { transform: translateX(0);   }
            50%      { transform: translateX(4px); }
          }
          .pcs-cta-hero {
            position: relative;
            overflow: hidden;
            isolation: isolate;
            animation: pcs-cta-attention 3.6s ease-in-out infinite,
                       pcs-cta-glow      3.6s ease-in-out infinite;
          }
          .pcs-cta-hero:hover {
            animation-play-state: paused;
            transform: translateY(-2px) scale(1.03);
            box-shadow: 0 18px 44px rgba(201,154,61,0.55),
                        0 4px 10px rgba(0,0,0,0.20);
          }
          .pcs-cta-hero:active {
            transform: translateY(0) scale(0.985);
            box-shadow: 0 6px 14px rgba(201,154,61,0.30);
          }
          .pcs-cta-hero::before {
            content: '';
            position: absolute;
            top: 0; left: 0; height: 100%; width: 55%;
            background: linear-gradient(110deg,
              rgba(255,255,255,0)    0%,
              rgba(255,255,255,0.55) 50%,
              rgba(255,255,255,0)    100%);
            animation: pcs-cta-shimmer 3.8s ease-in-out infinite;
            pointer-events: none;
            z-index: 1;
          }
          .pcs-cta-hero > * { position: relative; z-index: 2; }
          .pcs-cta-hero-arrow { display: inline-block; animation: pcs-cta-arrow 1.8s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .pcs-cta-hero,
            .pcs-cta-hero::before,
            .pcs-cta-hero-arrow { animation: none !important; }
          }
        `}</style>

        {/* Tactical grid overlay drifting diagonally — adds depth
            without competing with the foreground copy. */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18,
          backgroundImage:
            'linear-gradient(rgba(201,154,61,0.25) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(201,154,61,0.25) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'pcs-grid-drift 22s linear infinite',
        }} />

        {/* Radar sweep — radial gradient rotating slowly behind the
            hero copy. Capped to 60% width so it reads as ambience,
            not a UI element. */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '60vmax', height: '60vmax', pointerEvents: 'none',
          background: 'conic-gradient(from 0deg, rgba(201,154,61,0.0) 0deg, rgba(201,154,61,0.18) 28deg, rgba(201,154,61,0.0) 60deg, rgba(201,154,61,0) 360deg)',
          mixBlendMode: 'screen',
          filter: 'blur(8px)',
          animation: 'pcs-radar-sweep 12s linear infinite',
          transformOrigin: 'center',
          willChange: 'transform',
        }} />

        {/* Flag-stripe strip along the bottom edge — uses navy +
            white + gold (PCS palette) rather than RGB so it reads
            as 'institutional' not 'July 4th'. */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 6,
          background: `repeating-linear-gradient(90deg, ${PALETTE.gold} 0 40px, ${PALETTE.navyDeep} 40px 80px, ${PALETTE.paper} 80px 120px, ${PALETTE.navy} 120px 160px)`,
          opacity: 0.85,
          animation: 'pcs-stripe-shift 18s linear infinite',
        }} />

        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px 80px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,154,61,0.16)', border: '1px solid rgba(201,154,61,0.35)', color: PALETTE.gold, padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 22 }}>
            <span aria-hidden="true" style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: PALETTE.gold }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: PALETTE.gold, animation: 'pcs-pulse 1.8s ease-out infinite' }} />
            </span>
            Military relocation readiness platform
          </div>
          {/* Cinematic hero. A short, punchy display headline carries
              the brand promise; the operative copy moves into the
              subhead. Replaces the prior paragraph-length <h1>, which
              read as marketing prose rather than a hero. */}
          <h1 style={{
            fontSize: 'clamp(44px, 8vw, 84px)',
            fontWeight: 700, margin: '0 0 18px',
            lineHeight: 0.95, letterSpacing: '-0.045em',
            maxWidth: 980, marginLeft: 'auto', marginRight: 'auto',
            fontFamily: DISPLAY_FONT,
            textShadow: '0 2px 24px rgba(0,0,0,0.25)',
          }}>
            Your PCS,<br />
            <span style={{ color: PALETTE.gold }}>engineered.</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: 'rgba(255,255,255,0.88)', margin: '0 auto 32px', maxWidth: 720, fontWeight: 500 }}>
            Branch-aware planning, encrypted on your device, every entitlement and timeline at hand — for active duty, reserve, guard, civilian, and the families who carry the move.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Hero "Start Your PCS Plan" — animated attention button.
                Idle breath + gold glow pulse + shimmer sweep + nudging
                arrow signal "this is the primary path." Hover/active
                states pause the idle motion so the visitor's intent is
                respected. Falls back to a static button under
                prefers-reduced-motion. */}
            <button
              type="button"
              onClick={startPlan}
              className="pcs-cta-hero"
              aria-label="Start your PCS plan — begin onboarding"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                border: 'none', cursor: 'pointer',
                padding: '14px 26px', borderRadius: 14,
                fontSize: 15, fontWeight: 800, letterSpacing: '-0.005em',
                minHeight: 50,
                background: `linear-gradient(135deg, ${PALETTE.gold} 0%, #E0B45A 50%, #B5832B 100%)`,
                color: PALETTE.navyDeep,
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                fontFamily: 'inherit',
              }}
            >
              Start Your PCS Plan
              <span aria-hidden="true" className="pcs-cta-hero-arrow" style={{ fontSize: 17, fontWeight: 900 }}>→</span>
            </button>
            {/* v3 — AI Assistant CTA replaces the Need-Help-Now chip.
                Opens the same multi-turn assistant authenticated
                users get (Anthropic-backed when the provider is up,
                curated JTR / FTR / DSSR KB fallback when offline).
                Vibrant teal-gold gradient with a glow so it reads as
                the primary "talk to the platform" entry point. */}
            <button
              type="button"
              onClick={() => setShowAIAssistant(true)}
              aria-label="Open the AI Assistant — ask any PCS, BAH, or relocation question"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 22px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'linear-gradient(135deg, #14B8A6 0%, #0E7490 55%, #C99A3D 100%)',
                color: '#FFFFFF', fontSize: 15, fontWeight: 800,
                letterSpacing: '-0.005em', cursor: 'pointer',
                boxShadow: '0 10px 28px rgba(20, 184, 166, 0.32), 0 2px 6px rgba(0,0,0,0.18)',
                transition: 'transform 120ms ease, box-shadow 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(20, 184, 166, 0.42), 0 2px 6px rgba(0,0,0,0.20)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)';     e.currentTarget.style.boxShadow = '0 10px 28px rgba(20, 184, 166, 0.32), 0 2px 6px rgba(0,0,0,0.18)'; }}
            >
              <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>🤖</span>
              AI Assistant
              <span aria-hidden="true" style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: '.08em' }}>· ASK ANYTHING</span>
            </button>
          </div>

          {/* Mission-profile branch selector. Renders as a HUD-style
              labelled selector with a leading status glyph so the
              "tap to preview" affordance reads as an active control,
              not a passive chip row. */}
          <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.65)',
              letterSpacing: '.22em', textTransform: 'uppercase',
              width: '100%', textAlign: 'center', marginBottom: 10,
              fontFamily: DISPLAY_FONT, fontWeight: 600,
            }}>
              <span aria-hidden="true" style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: PALETTE.gold, marginRight: 10, verticalAlign: 'middle',
                animation: 'pcs-pulse-soft 2.4s ease-in-out infinite',
                boxShadow: `0 0 10px ${PALETTE.gold}`,
              }} />
              Mission profile · select your branch
            </div>
            {['Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard', 'DoD Civilian'].map(b => {
              const isActive = previewBranch === b;
              const bt = branchTheme(b);
              return (
                <button
                  key={b}
                  type="button"
                  onMouseEnter={() => setPreviewBranch(b)}
                  onFocus={() => setPreviewBranch(b)}
                  onClick={() => setPreviewBranch(isActive ? null : b)}
                  aria-pressed={isActive}
                  aria-label={`Preview ${b} branch theme`}
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '7px 14px',
                    borderRadius: 999,
                    background: isActive ? bt.primary : 'rgba(255,255,255,0.08)',
                    color: isActive ? bt.secondary : 'rgba(255,255,255,0.92)',
                    border: isActive ? `1px solid ${bt.secondary}` : '1px solid rgba(255,255,255,0.18)',
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'background 160ms ease, color 160ms ease, border 160ms ease, transform 120ms ease',
                    transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                  }}
                >
                  {b}
                </button>
              );
            })}
            {activeTheme && (
              <div style={{ width: '100%', textAlign: 'center', marginTop: 4 }}>
                <span style={{ display: 'inline-block', fontSize: 12, fontStyle: 'italic', color: activeTheme.secondary, letterSpacing: '.04em' }}>
                  “{activeTheme.motto}” · {activeTheme.label}
                </span>
              </div>
            )}
          </div>

          {/* Trust strip — four high-signal capability claims under
              the hero. Each is factual (matches the in-product
              experience) so we never tip into vapor-marketing. Uses
              Space Grotesk for the numeric "value" line so the digits
              read distinct from the body copy. */}
          <div style={{
            marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.10)',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 18,
            maxWidth: 880, marginLeft: 'auto', marginRight: 'auto',
          }}>
            {[
              { value: '7',          label: 'Branches & components tailored' },
              { value: 'AES-256',    label: 'On-device encryption' },
              { value: '90 / 180',   label: 'Day CONUS / OCONUS timelines' },
              { value: '0 uploads',  label: 'Documents leave your device' },
            ].map(s => (
              <div key={s.label} className="pcs-trust-stat" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: PALETTE.gold, lineHeight: 1, letterSpacing: '-0.02em', fontFamily: DISPLAY_FONT }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: '.14em', textTransform: 'uppercase', marginTop: 8, lineHeight: 1.35 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── WHO WE SERVE ───── */}
      <section id="who" style={{ padding: '72px 20px', background: PALETTE.bg }}>
        <SectionHeader
          kicker="Who we serve"
          title="Built for every DoD relocation journey"
          subtitle="From a first-PCS junior airman to a transitioning veteran resettling a family, PCS Express tailors content to the move you're actually making."
        />
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {WHO_WE_SERVE.map(g => (
            <Card key={g.label}>
              <div style={{ fontSize: 12, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>{g.label}</div>
              <div style={{ fontSize: 14, color: PALETTE.text, lineHeight: 1.55 }}>{g.detail}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section id="features" style={{ padding: '72px 20px', background: PALETTE.paper }}>
        <SectionHeader
          kicker="Core features"
          title="One workflow. Every phase of the PCS."
          subtitle="A coherent set of tools — not a folder of links. Each feature retunes to the user's branch, component, paygrade, dependents, and CONUS vs OCONUS status."
        />
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {FEATURES.map((f, i) => {
            // Cycle the accent color so the 3x3 grid reads as visually
            // varied rather than a wall of identical cards. The order
            // intentionally clusters by category role: navy = workflow,
            // gold = financial / entitlements, teal = AI / data.
            const accents = [
              PALETTE.navy,   // checklist
              PALETTE.navy,   // housing
              PALETTE.gold,   // benefits
              PALETTE.navy,   // documents
              PALETTE.gold,   // timeline
              '#14B8A6',      // installation research
              '#14B8A6',      // family readiness
              '#14B8A6',      // AI
              PALETTE.navy,   // personalized workflow
            ];
            const accent = accents[i] || PALETTE.navy;
            return (
              <Card key={f.title} accent={accent} style={{ background: PALETTE.paper }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <span aria-hidden="true" style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `linear-gradient(135deg, ${accent} 0%, ${accent}CC 100%)`,
                    color: '#FFFFFF',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 950, fontSize: 18, flexShrink: 0,
                    boxShadow: `0 4px 12px ${accent}40`,
                  }}>{f.icon}</span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: PALETTE.navyDeep, lineHeight: 1.3, paddingTop: 6, fontFamily: DISPLAY_FONT, letterSpacing: '-0.015em' }}>{f.title}</div>
                </div>
                <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>{f.body}</div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section id="how" style={{ padding: '72px 20px', background: PALETTE.bg }}>
        <SectionHeader
          kicker="How it works"
          title="Four steps from orders to in-processing"
          subtitle="No accounts to create, no documents to upload. Your profile stays encrypted on your device."
        />
        {/* Connected timeline. On wide screens (≥980px) a dashed
            gold rule visually links the four step nodes; on narrow
            screens the cards stack and the rule is hidden because
            the link no longer corresponds to layout. The step number
            node lifts on card hover via .pcs-step-node. */}
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: 56, left: '8%', right: '8%', height: 2,
            background: `repeating-linear-gradient(90deg, ${PALETTE.gold} 0 8px, transparent 8px 16px)`,
            opacity: 0.5,
            display: 'none',
          }} className="pcs-how-line" />
          <style>{`
            @media (min-width: 980px) {
              .pcs-how-line { display: block !important; }
            }
          `}</style>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            {HOW_IT_WORKS.map(step => (
              <Card key={step.n} style={{ paddingTop: 28, textAlign: 'center' }}>
                <div className="pcs-step-node" style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${PALETTE.gold} 0%, #B5832B 100%)`,
                  color: PALETTE.navyDeep,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800, fontFamily: DISPLAY_FONT,
                  boxShadow: '0 4px 14px rgba(201,154,61,0.35)',
                  marginBottom: 14,
                  border: `3px solid ${PALETTE.paper}`,
                }}>{step.n}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: PALETTE.navyDeep, marginBottom: 8, fontFamily: DISPLAY_FONT, letterSpacing: '-0.02em' }}>{step.title}</div>
                <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>{step.body}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── WHY PCS IS HARD ───── */}
      <section style={{ padding: '72px 20px', background: PALETTE.paper }}>
        <SectionHeader
          kicker="Why PCS moves are difficult"
          title="The problem we're solving"
          subtitle="Service members and families absorb thousands of hours of administrative load every move cycle. PCS Express centralizes that load and reduces what gets missed."
        />
        {/* Pain points read as warnings — orange-red left rule + small
            "▲" glyph differentiate them from the (green) operational
            benefits section below, so the reader's eye sorts problem
            vs. solution without re-reading every headline. */}
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {PAIN_POINTS.map(p => (
            <div key={p.headline} className="pcs-card" style={{
              background: '#FEF7F0',
              borderLeft: `4px solid #E07A1F`,
              border: `1px solid #FAD6B5`,
              borderLeftWidth: 4,
              padding: '14px 18px', borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 6, background: '#E07A1F', color: '#FFFFFF',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 950,
                }}>▲</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: PALETTE.navyDeep }}>{p.headline}</div>
              </div>
              <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>{p.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── OPERATIONAL BENEFITS ───── */}
      <section style={{ padding: '72px 20px', background: PALETTE.bg }}>
        <SectionHeader
          kicker="Operational benefits"
          title="What gets better when the right tool is in hand"
        />
        {/* Benefits use a positive green accent — paired visually
            with the orange-red pain-points block above so the
            "problem → improvement" narrative is legible at a glance. */}
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {OPERATIONAL_BENEFITS.map(b => (
            <Card key={b.title} accent="#2E7D32">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 6, background: '#2E7D32', color: '#FFFFFF',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 950,
                }}>✓</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: PALETTE.navyDeep }}>{b.title}</div>
              </div>
              <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>{b.body}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ───── SECURITY ───── */}
      <section id="security" style={{ padding: '72px 20px', background: `linear-gradient(135deg, ${PALETTE.navy} 0%, ${PALETTE.navyDeep} 100%)`, color: PALETTE.paper }}>
        <SectionHeader
          kicker="Security & privacy"
          title="Security, privacy, and future government-readiness in mind"
          subtitle="PCS Express is being developed with security, privacy, and future government-readiness in mind. The platform is not currently authorized under FedRAMP, IL4/IL5, or any DoD ATO process. The list below reflects what is implemented today versus what is planned."
          light
        />
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {SECURITY_POINTS.map(s => (
            <div key={s.title} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: PALETTE.gold, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── PARTNERS ───── */}
      <section id="partners" style={{ padding: '72px 20px', background: PALETTE.paper }}>
        <SectionHeader
          kicker="For government & partners"
          title="Partner with PCS Express"
          subtitle="An independent platform designed to centralize PCS resources for service members, families, veterans, and DoD civilians. Potential partnerships span family readiness, transition assistance, relocation education, and administrative-burden reduction."
        />
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Problem</div>
              <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>PCS information is scattered across regulations, branch portals, and installation resources. Families absorb the burden of finding and sequencing it.</div>
            </Card>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Solution</div>
              <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>A single workflow that retunes to branch, component, and CONUS / OCONUS status, with authoritative citations to JTR, FTR, DSSR, DTMO, and branch portals.</div>
            </Card>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Mission alignment</div>
              <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>Designed with DoD-published family-readiness and transition-assistance priorities in mind, with the goal of reducing relocation-related administrative overhead. PCS Express is independent and is not endorsed, sponsored, or coordinated with the DoD.</div>
            </Card>
          </div>

          <div style={{ background: PALETTE.bg, borderRadius: 16, padding: 22, marginBottom: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: PALETTE.navyDeep, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 14 }}>Potential agency / partner use cases</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {PARTNER_USE_CASES.map(u => (
                <div key={u.who} style={{ background: PALETTE.paper, borderLeft: `3px solid ${PALETTE.gold}`, padding: '12px 14px', borderRadius: 10, border: `1px solid ${PALETTE.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: PALETTE.navyDeep, marginBottom: 4 }}>{u.who}</div>
                  <div style={{ fontSize: 12, color: PALETTE.muted, lineHeight: 1.55 }}>{u.what}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: PALETTE.greenSoft, border: `1px solid #A5D6A7`, borderRadius: 14, padding: 18, fontSize: 13, color: PALETTE.green, lineHeight: 1.6 }}>
            <strong>Capability statement alignment.</strong> Core competencies: military relocation workflow design, regulatory citation curation (JTR / FTR / DSSR), encrypted on-device personalization, and branch- and component-aware UX. Differentiators: zero document-upload surface, fully offline-capable PWA, automatic CONUS / OCONUS retuning, and a roadmap toward partner-dashboard delivery for family-readiness and transition programs.
          </div>
        </div>
      </section>

      {/* ───── ROADMAP ───── */}
      <section id="roadmap" style={{ padding: '72px 20px', background: PALETTE.bg }}>
        <SectionHeader
          kicker="Planned roadmap"
          title="What's shipping, what's in flight, and what's planned"
          subtitle="Items listed under Planned roadmap are not yet implemented and should not be relied on for current decisions."
        />
        {/* Roadmap cards now lead with a colored badge + a thin
            progress bar that reflects each phase's maturity (full /
            partial / planned). Gives the section visual rhythm and
            sets honest expectations: "Planned" is clearly less
            advanced than "Live today" before a reader scans copy. */}
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {ROADMAP.map(p => {
            const cfg = p.phase === 'Live today'
              ? { color: PALETTE.green, bar: 100, bg: '#E8F5E9', accent: PALETTE.green }
              : p.phase === 'In development'
              ? { color: PALETTE.gold,  bar: 55,  bg: 'rgba(201,154,61,0.10)', accent: PALETTE.gold }
              : { color: PALETTE.muted, bar: 18,  bg: 'rgba(86,105,124,0.10)', accent: PALETTE.muted };
            return (
              <Card key={p.phase} accent={cfg.accent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 10, fontWeight: 900, color: cfg.color, letterSpacing: '.12em', textTransform: 'uppercase',
                    background: cfg.bg, padding: '4px 10px', borderRadius: 999,
                  }}>
                    <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                    {p.phase}
                  </span>
                </div>
                <div aria-hidden="true" style={{ height: 4, background: PALETTE.border, borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
                  <div style={{ width: `${cfg.bar}%`, height: '100%', background: cfg.color, borderRadius: 2, transition: 'width 600ms ease' }} />
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {p.items.map(item => (
                    <li key={item} style={{ fontSize: 13, color: PALETTE.text, lineHeight: 1.65, marginBottom: 8, paddingLeft: 22, position: 'relative' }}>
                      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 6, width: 12, height: 12, borderRadius: 3, background: `${cfg.color}22`, color: cfg.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 950 }}>›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ───── METRICS PLACEHOLDER ───── */}
      <section style={{ padding: '36px 20px', background: PALETTE.paper, borderTop: `1px solid ${PALETTE.border}`, borderBottom: `1px solid ${PALETTE.border}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, textAlign: 'center' }}>
          {[
            { stat: 'All 6', label: 'DoD branches supported' },
            { stat: '4', label: 'Components covered (AD / Reserve / Guard / Civilian)' },
            { stat: '90 + 180', label: 'Day timelines (CONUS / OCONUS)' },
            { stat: '36+', label: 'Tailored feature modules' },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize: 30, fontWeight: 950, color: PALETTE.navyDeep, lineHeight: 1 }}>{m.stat}</div>
              <div style={{ fontSize: 11, color: PALETTE.muted, marginTop: 6, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 800 }}>{m.label}</div>
            </div>
          ))}
        </div>
        {/* TODO: replace placeholders with live aggregate metrics once
            partner-dashboard analytics ship (see Planned roadmap). */}
      </section>

      {/* ───── FOUNDER ───── */}
      <section style={{ padding: '72px 20px', background: PALETTE.bg }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 12 }}>Founder & mission</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: PALETTE.navyDeep, margin: '0 0 16px', lineHeight: 1.2, letterSpacing: '-0.025em', fontFamily: DISPLAY_FONT }}>Built from firsthand PCS experience</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: PALETTE.text }}>
            PCS Express was founded by a military-connected founder with firsthand experience in the challenges of military relocation and transition. The platform was built to make PCS planning easier, more organized, and more accessible for service members and their families.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: PALETTE.muted, marginTop: 14 }}>
            Built to support individual users today, with a roadmap toward organizational and partner support. Designed for future integration with military family-readiness, relocation-assistance, and veteran-support ecosystems.
          </p>
          <div style={{ marginTop: 22 }}>
            <CTAButton variant="secondary" onClick={() => { window.location.href = 'mailto:contact@pcsexpress.app'; }}>Contact Founder</CTAButton>
          </div>
        </div>
      </section>

      {/* ───── DISCLAIMER + FOOTER ───── */}
      <footer style={{ background: PALETTE.navyDeep, color: 'rgba(255,255,255,0.75)', padding: '36px 20px 28px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 18px', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' }}>
            <strong style={{ color: PALETTE.gold }}>Disclaimer.</strong> {INDEPENDENCE_DISCLAIMER} References to JTR, FTR, DSSR, DTMO, TRICARE, the GI Bill, SCRA, and other federal regulations are provided for planning and educational purposes. Verify exact entitlements with your unit S1 / IPAC / MPF / PSD or the official publication before making financial or housing decisions.
          </div>
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18, fontSize: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>Product</div>
              <div style={{ lineHeight: 2 }}>
                <button onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block', fontSize: 12 }}>Features</button>
                <button onClick={() => scrollTo('how')} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block', fontSize: 12 }}>How it works</button>
                <button onClick={() => scrollTo('roadmap')} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block', fontSize: 12 }}>Roadmap</button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>For partners</div>
              <div style={{ lineHeight: 2 }}>
                <button onClick={() => scrollTo('partners')} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block', fontSize: 12 }}>Government & partners</button>
                <a href="mailto:contact@pcsexpress.app" style={{ color: 'inherit', textDecoration: 'none', display: 'block', fontSize: 12 }}>contact@pcsexpress.app</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>Trust</div>
              <div style={{ lineHeight: 2 }}>
                <button onClick={() => scrollTo('security')} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block', fontSize: 12 }}>Security & privacy</button>
                <a href="/privacy.html" style={{ color: 'inherit', textDecoration: 'none', display: 'block', fontSize: 12 }}>Privacy notice</a>
                <a href="/terms.html" style={{ color: 'inherit', textDecoration: 'none', display: 'block', fontSize: 12 }}>Terms of use</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>Contact</div>
              <div style={{ lineHeight: 2 }}>
                <a href="mailto:contact@pcsexpress.app" style={{ color: 'inherit', textDecoration: 'none', display: 'block', fontSize: 12 }}>contact@pcsexpress.app</a>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
            <div>© {new Date().getFullYear()} PCS Express. All rights reserved.</div>
            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={startPlan} style={{ background: 'none', border: 'none', color: PALETTE.gold, fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: 11 }}>Start Your PCS Plan →</button>
            </div>
          </div>
        </div>
      </footer>
      {/* Per user directive, the floating crisis-line chip no longer
          renders on the marketing landing — the AI Assistant button is
          the primary help affordance here. The CrisisLineChip remains
          mounted globally inside the authenticated app shell. */}

      {/* AI Assistant modal — mounted at LandingPage level because
          the App shell short-circuits to <LandingPage /> before its
          own AIAssistantModal mount runs. Suspense fallback is empty
          (the modal opens with its own loading state). */}
      <Suspense fallback={null}>
        {showAIAssistant && (
          <AIAssistantModal
            open={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            isDesktop={true}
          />
        )}
      </Suspense>
    </div>
  );
}
