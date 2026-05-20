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
import { useState } from 'react';
import DemoRequestForm from './DemoRequestForm';

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

const SECTIONS = [
  { id: 'who', label: 'Who we serve' },
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How it works' },
  { id: 'security', label: 'Security' },
  { id: 'partners', label: 'For partners' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'demo', label: 'Request a demo' },
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
    <div style={{ maxWidth: 820, margin: '0 auto 32px', textAlign: 'center' }}>
      <div style={{
        fontSize: 11, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase',
        color: light ? PALETTE.gold : PALETTE.gold, marginBottom: 10,
      }}>{kicker}</div>
      <h2 style={{
        fontSize: 30, fontWeight: 900, color: light ? PALETTE.paper : PALETTE.navy,
        margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.01em',
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

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: PALETTE.paper,
      border: `1px solid ${PALETTE.border}`,
      borderRadius: 16,
      padding: 22,
      boxShadow: '0 6px 18px rgba(13, 24, 33, 0.04)',
      height: '100%',
      ...style,
    }}>
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
  { title: 'Minimal collection', body: 'No name, email, address, or document content leaves the device. The AI Assistant sends only the question plus a non-PII context blob (branch / phase / open-task count).' },
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
  const [demoOpen, setDemoOpen] = useState(false);
  const startPlan = () => { try { onStartPlan?.(); } catch {} };

  return (
    <div
      style={{
        background: PALETTE.bg,
        color: PALETTE.text,
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
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
            <span style={{ fontSize: 16, fontWeight: 900, color: PALETTE.navyDeep, letterSpacing: '-0.01em' }}>PCS Express</span>
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
          <CTAButton onClick={startPlan} style={{ padding: '10px 16px', minHeight: 40, fontSize: 13 }}>
            Start Your PCS Plan
          </CTAButton>
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
      <section id="top" style={{ background: `linear-gradient(135deg, ${PALETTE.navy} 0%, ${PALETTE.navyDeep} 100%)`, color: PALETTE.paper }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px 64px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,154,61,0.16)', border: '1px solid rgba(201,154,61,0.35)', color: PALETTE.gold, padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 22 }}>
            <span aria-hidden="true">●</span>
            Military relocation readiness platform
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 950, margin: '0 0 18px', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 880, marginLeft: 'auto', marginRight: 'auto' }}>
            PCS Express helps service members and military families simplify PCS moves through guided workflows, centralized relocation tools, and military-specific resources.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 auto 28px', maxWidth: 720 }}>
            Built for all DoD branches, components, and military families. Designed to reduce confusion, save time, and improve relocation readiness.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <CTAButton onClick={startPlan}>Start Your PCS Plan →</CTAButton>
            <CTAButton variant="ghost" onClick={() => scrollTo('demo')}>Request a Demo</CTAButton>
            <CTAButton variant="ghost" onClick={() => scrollTo('features')}>Explore PCS Tools</CTAButton>
          </div>
          <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard', 'DoD Civilian'].map(b => (
              <span key={b} style={{ fontSize: 10, fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{b}</span>
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
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <Card key={f.title} style={{ background: PALETTE.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 10, background: PALETTE.navy, color: PALETTE.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: 16 }}>{f.icon}</span>
                <div style={{ fontSize: 14, fontWeight: 900, color: PALETTE.navyDeep, lineHeight: 1.3 }}>{f.title}</div>
              </div>
              <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>{f.body}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section id="how" style={{ padding: '72px 20px', background: PALETTE.bg }}>
        <SectionHeader
          kicker="How it works"
          title="Four steps from orders to in-processing"
          subtitle="No accounts to create, no documents to upload. Your profile stays encrypted on your device."
        />
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {HOW_IT_WORKS.map(step => (
            <Card key={step.n}>
              <div style={{ fontSize: 36, fontWeight: 950, color: PALETTE.gold, lineHeight: 1, marginBottom: 10 }}>{step.n}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: PALETTE.navyDeep, marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>{step.body}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ───── WHY PCS IS HARD ───── */}
      <section style={{ padding: '72px 20px', background: PALETTE.paper }}>
        <SectionHeader
          kicker="Why PCS moves are difficult"
          title="The problem we're solving"
          subtitle="Service members and families absorb thousands of hours of administrative load every move cycle. PCS Express centralizes that load and reduces what gets missed."
        />
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {PAIN_POINTS.map(p => (
            <div key={p.headline} style={{ background: PALETTE.bg, borderLeft: `4px solid ${PALETTE.gold}`, padding: '14px 18px', borderRadius: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: PALETTE.navyDeep, marginBottom: 6 }}>{p.headline}</div>
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
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {OPERATIONAL_BENEFITS.map(b => (
            <Card key={b.title}>
              <div style={{ fontSize: 14, fontWeight: 900, color: PALETTE.navyDeep, marginBottom: 8 }}>{b.title}</div>
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
              <div style={{ fontSize: 13, color: PALETTE.muted, lineHeight: 1.6 }}>Supports DoD readiness goals around family resilience, transition assistance, and reduction of relocation-related administrative overhead.</div>
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
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {ROADMAP.map(p => (
            <Card key={p.phase}>
              <div style={{ fontSize: 11, fontWeight: 900, color: p.phase === 'Live today' ? PALETTE.green : (p.phase === 'In development' ? PALETTE.gold : PALETTE.muted), letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>{p.phase}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {p.items.map(item => (
                  <li key={item} style={{ fontSize: 13, color: PALETTE.text, lineHeight: 1.65, marginBottom: 6, paddingLeft: 18, position: 'relative' }}>
                    <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, color: PALETTE.gold, fontWeight: 950 }}>›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
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
          <h2 style={{ fontSize: 26, fontWeight: 900, color: PALETTE.navyDeep, margin: '0 0 16px', lineHeight: 1.25 }}>Built from firsthand PCS experience</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: PALETTE.text }}>
            PCS Express was founded by a military-connected founder with firsthand experience in the challenges of military relocation and transition. The platform was built to make PCS planning easier, more organized, and more accessible for service members and their families.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: PALETTE.muted, marginTop: 14 }}>
            Built to support individual users today, with a roadmap toward organizational and partner support. Designed for future integration with military family-readiness, relocation-assistance, and veteran-support ecosystems.
          </p>
          <div style={{ marginTop: 22 }}>
            <CTAButton variant="secondary" onClick={() => scrollTo('demo')}>Contact Founder</CTAButton>
          </div>
        </div>
      </section>

      {/* ───── DEMO REQUEST ───── */}
      <section id="demo" style={{ padding: '72px 20px', background: PALETTE.paper }}>
        <SectionHeader
          kicker="Request a demo · contact"
          title="See PCS Express in your context"
          subtitle="Tell us a little about who you are and how you'd potentially work with the platform. We'll respond directly — no marketing list, no follow-on automation."
        />
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {demoOpen ? (
            <DemoRequestForm onClose={() => setDemoOpen(false)} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <CTAButton onClick={() => setDemoOpen(true)}>Open the request form</CTAButton>
            </div>
          )}
        </div>
      </section>

      {/* ───── DISCLAIMER + FOOTER ───── */}
      <footer style={{ background: PALETTE.navyDeep, color: 'rgba(255,255,255,0.75)', padding: '36px 20px 28px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 18px', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' }}>
            <strong style={{ color: PALETTE.gold }}>Disclaimer.</strong> PCS Express is an independent platform and is not currently endorsed by, affiliated with, or officially approved by the Department of Defense, Department of Veterans Affairs, or any military branch unless otherwise stated. References to JTR, FTR, DSSR, DTMO, TRICARE, the GI Bill, SCRA, and other federal regulations are provided for planning and educational purposes. Verify exact entitlements with your unit S1 / IPAC / MPF / PSD or the official publication before making financial or housing decisions.
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
                <button onClick={() => scrollTo('demo')} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block', fontSize: 12 }}>Request a demo</button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>Trust</div>
              <div style={{ lineHeight: 2 }}>
                <button onClick={() => scrollTo('security')} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block', fontSize: 12 }}>Security & privacy</button>
                {/* TODO: link to /privacy and /terms pages once the
                    legal review is complete. Placeholder anchors for now. */}
                <a href="#privacy" style={{ color: 'inherit', textDecoration: 'none', display: 'block', fontSize: 12 }}>Privacy policy (TODO)</a>
                <a href="#terms" style={{ color: 'inherit', textDecoration: 'none', display: 'block', fontSize: 12 }}>Terms of service (TODO)</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: PALETTE.gold, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>Contact</div>
              <div style={{ lineHeight: 2 }}>
                <button onClick={() => scrollTo('demo')} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block', fontSize: 12 }}>Demo / partner inquiry</button>
                {/* TODO: replace with the founder's published contact
                    address once the public-comms channel is selected. */}
                <span style={{ display: 'block', fontSize: 12 }}>contact@pcsexpress.app (TODO)</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
            <div>© {new Date().getFullYear()} PCS Express LLC (TODO — pending entity formation). All rights reserved.</div>
            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={startPlan} style={{ background: 'none', border: 'none', color: PALETTE.gold, fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: 11 }}>Start Your PCS Plan →</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
