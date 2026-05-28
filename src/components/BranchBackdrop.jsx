/*
 * BranchBackdrop — animated, abstract militaristic SVG keyed to the
 * user's branch.
 *
 * Why abstract patterns instead of service-member photography:
 *   - DoD photos are public domain (17 USC §105) but each requires
 *     sourcing + bundling a JPEG into the eager landing payload, which
 *     pushes us past the AdSense / Lighthouse budget.
 *   - Photo selection carries its own representation review burden
 *     (gender, ethnicity, MOS, era) that we don't want to gate every
 *     release on.
 *   - Distinctive geometric motifs (radar grids, orbital arcs, wave
 *     forms, etc.) paired with each service's published palette read
 *     as unmistakable at hero scale without those costs.
 *
 * v2 — patterns now animate (CSS keyframes scoped to the SVG via an
 * inline <style>). Per-branch motion choices intentionally avoid
 * gimmicks: a slow hex drift, a sweeping radar line, a satellite
 * track, a contrail trail. Animations honor `prefers-reduced-motion`
 * via the parent media query block. Render is still pointer-events:
 * none so it cannot intercept hover / click.
 *
 * Usage:
 *   <BranchBackdrop branch="Marine Corps" opacity={0.18} />
 */

import { memo } from 'react';
import { branchTheme } from '../config/branchTheme';

// memo() — mounted 4× across the app shell (sidebar header, main
// header, Command Center background, every category-tab frame). The
// parent <App /> re-renders on activeTab changes, demoTip ticks,
// screen-width changes, and notification ticks — none of which
// should re-run the (cheap but non-trivial) SVG pattern code. memo
// short-circuits when `branch` is stable, which it is for the entire
// authenticated session.
function BranchBackdrop({ branch, opacity = 0.22, style = {} }) {
  const theme = branchTheme(branch);
  const stroke = theme.secondary;
  const fill   = theme.accent;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        overflow: 'hidden',
        ...style,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%' }}
      >
        <style>{KEYFRAMES}</style>
        {renderPattern(theme.pattern, { stroke, fill })}
      </svg>
    </div>
  );
}

export default memo(BranchBackdrop);

// All keyframes scoped to the SVG <style> so they don't leak into
// the global stylesheet. Movement is slow (10–24s) and subtle —
// the goal is "alive" not "distracting." All motion auto-disables
// when the user has opted into reduced motion.
const KEYFRAMES = `
  @keyframes bb-drift     { 0%{transform:translate(0,0)} 50%{transform:translate(20px,-12px)} 100%{transform:translate(0,0)} }
  @keyframes bb-sweep     { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes bb-orbit     { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes bb-wave      { 0%{transform:translateX(0)} 100%{transform:translateX(-200px)} }
  @keyframes bb-contrail  { 0%{stroke-dashoffset:1200} 100%{stroke-dashoffset:0} }
  @keyframes bb-pulse     { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes bb-beam      { 0%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} 100%{transform:rotate(-22deg)} }
  @keyframes bb-twinkle   { 0%,100%{opacity:.25} 50%{opacity:.95} }
  .bb-drift    { animation: bb-drift 18s ease-in-out infinite; transform-origin:center; }
  .bb-sweep    { animation: bb-sweep 14s linear infinite; transform-origin:600px 300px; }
  .bb-orbit    { animation: bb-orbit 22s linear infinite; transform-origin:600px 300px; }
  .bb-wave     { animation: bb-wave 24s linear infinite; }
  .bb-contrail { stroke-dasharray:1200; animation: bb-contrail 9s ease-out infinite; }
  .bb-pulse    { animation: bb-pulse 4s ease-in-out infinite; }
  .bb-beam     { animation: bb-beam 11s ease-in-out infinite; transform-origin:120px 500px; transform-box: fill-box; }
  .bb-twinkle  { animation: bb-twinkle 3.4s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .bb-drift, .bb-sweep, .bb-orbit, .bb-wave, .bb-contrail,
    .bb-pulse, .bb-beam, .bb-twinkle { animation: none !important; }
  }
`;

function renderPattern(pattern, { stroke, fill }) {
  switch (pattern) {
    case 'hex':                  return <ArmyHex stroke={stroke} fill={fill} />;
    case 'waves':                return <NavyWaves stroke={stroke} fill={fill} />;
    case 'eagle-globe-anchor':   return <MarinesEGA stroke={stroke} fill={fill} />;
    case 'wings':                return <AirForceWings stroke={stroke} fill={fill} />;
    case 'orbit':                return <SpaceForceOrbit stroke={stroke} fill={fill} />;
    case 'lighthouse':           return <CoastGuardLighthouse stroke={stroke} fill={fill} />;
    case 'badge':
    default:                     return <CivilianBadge stroke={stroke} fill={fill} />;
  }
}

/* ─── Army: drifting hex grid + sweeping radar line ─── */
function ArmyHex({ stroke, fill }) {
  return (
    <>
      <defs>
        <pattern id="armyHex" width="60" height="52" patternUnits="userSpaceOnUse">
          <polygon points="30,2 56,17 56,47 30,62 4,47 4,17" fill="none" stroke={stroke} strokeWidth="1.5" />
        </pattern>
      </defs>
      <g className="bb-drift">
        <rect x="-40" y="-40" width="1280" height="680" fill="url(#armyHex)" />
      </g>
      {/* Sweeping radar line + center pulse */}
      <g className="bb-sweep">
        <line x1="600" y1="300" x2="1100" y2="300" stroke={fill} strokeWidth="2" opacity="0.75" />
      </g>
      <circle className="bb-pulse" cx="600" cy="300" r="6" fill={fill} />
      {/* Tread stripe along the bottom */}
      <g stroke={stroke} strokeWidth="2" fill="none">
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={i} x1={i * 42} y1="552" x2={i * 42 + 22} y2="552" />
        ))}
      </g>
    </>
  );
}

/* ─── Navy: drifting wave field + corner anchor ─── */
function NavyWaves({ stroke }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="2">
      <g className="bb-wave">
        {[0, 80, 160, 240, 320, 400, 480, 560].map((y, i) => (
          <path
            key={i}
            d={`M-200,${300 + y * 0.6} Q0,${260 + y * 0.6} 200,${300 + y * 0.6} T600,${300 + y * 0.6} T1000,${300 + y * 0.6} T1400,${300 + y * 0.6}`}
            opacity={1 - i * 0.1}
          />
        ))}
      </g>
      {/* Anchor silhouette in the corner */}
      <g transform="translate(1050,440)" opacity="0.6" className="bb-pulse">
        <circle cx="0" cy="0" r="14" fill="none" stroke={stroke} strokeWidth="3" />
        <line x1="0" y1="14" x2="0" y2="80" strokeWidth="3" />
        <path d="M-26,72 Q0,98 26,72" strokeWidth="3" />
        <line x1="-14" y1="20" x2="14" y2="20" strokeWidth="3" />
      </g>
    </g>
  );
}

/* ─── Marines: rotating globe + sweeping wing arcs ─── */
function MarinesEGA({ stroke, fill }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="1.6">
      <g className="bb-orbit">
        <g transform="translate(600,300)">
          <circle cx="0" cy="0" r="220" />
          <ellipse cx="0" cy="0" rx="220" ry="60" />
          <ellipse cx="0" cy="0" rx="220" ry="120" />
          <ellipse cx="0" cy="0" rx="220" ry="180" />
          <ellipse cx="0" cy="0" rx="60" ry="220" />
          <ellipse cx="0" cy="0" rx="120" ry="220" />
          <ellipse cx="0" cy="0" rx="180" ry="220" />
        </g>
      </g>
      <path d="M0,160 Q300,80 600,160" strokeWidth="3" opacity="0.9" />
      <path d="M600,160 Q900,80 1200,160" strokeWidth="3" opacity="0.9" />
      {[[200, 90],[1000, 90],[400, 510],[800, 510]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`} fill={fill} stroke="none" className="bb-twinkle">
          <polygon points="0,-10 3,-3 10,-3 4,2 6,10 0,5 -6,10 -4,2 -10,-3 -3,-3" />
        </g>
      ))}
    </g>
  );
}

/* ─── Air Force: contrails that re-draw + dashed altitude bands ─── */
function AirForceWings({ stroke }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="2">
      {[100, 200, 300, 400, 500].map((y) => (
        <line key={y} x1="0" y1={y} x2="1200" y2={y} strokeDasharray="6 12" opacity="0.45" />
      ))}
      <path className="bb-contrail" d="M-40,540 Q400,360 1240,80" strokeWidth="2.5" />
      <path className="bb-contrail" d="M-40,560 Q500,400 1240,120" strokeWidth="2.5" opacity="0.7" style={{ animationDelay: '-3s' }} />
      <path className="bb-contrail" d="M-40,520 Q300,320 1240,40" strokeWidth="2.5" opacity="0.5" style={{ animationDelay: '-6s' }} />
      <g transform="translate(1100,100)" opacity="0.9" className="bb-pulse">
        <polygon points="0,0 -60,18 -50,0 -60,-18" fill={stroke} stroke="none" />
      </g>
    </g>
  );
}

/* ─── Space Force: rotating orbital rings + twinkling stars ─── */
function SpaceForceOrbit({ stroke, fill }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.9">
      <g className="bb-orbit">
        <g transform="translate(600,300)">
          {[80, 130, 190, 260, 340].map((r, i) => (
            <ellipse key={r} cx="0" cy="0" rx={r * 1.4} ry={r * 0.55}
                     transform={`rotate(${i * 18})`} opacity={0.9 - i * 0.12} />
          ))}
          <circle cx="0" cy="0" r="48" fill={fill} stroke={stroke} strokeWidth="2" opacity="0.7" />
          <g transform="translate(310,-90)" stroke={stroke} strokeWidth="2">
            <rect x="-8" y="-6" width="16" height="12" fill={stroke} opacity="0.7" />
            <line x1="-22" y1="0" x2="-8" y2="0" />
            <line x1="8"   y1="0" x2="22" y2="0" />
          </g>
        </g>
      </g>
      {Array.from({ length: 36 }).map((_, i) => {
        const x = (i * 137) % 1200;
        const y = (i * 79)  % 600;
        const delay = (i % 7) * 0.4;
        return (
          <circle key={i} cx={x} cy={y} r="1.6" fill={stroke} stroke="none"
                  className="bb-twinkle" style={{ animationDelay: `${delay}s` }} />
        );
      })}
    </g>
  );
}

/* ─── Coast Guard: sweeping lighthouse beam + scrolling waves ─── */
function CoastGuardLighthouse({ stroke, fill }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="2">
      <g className="bb-beam" style={{ transformOrigin: '120px 500px' }}>
        <polygon points="0,0 1100,-280 1100,-360 0,-40" fill={fill} opacity="0.20" stroke="none" transform="translate(120,500)" />
      </g>
      <g transform="translate(120,500)">
        <rect x="-14" y="-160" width="28" height="160" fill={stroke} opacity="0.7" />
        <polygon points="-26,-220 26,-220 14,-160 -14,-160" fill={stroke} opacity="0.85" />
        <circle cx="0" cy="-200" r="6" fill={fill} className="bb-pulse" />
      </g>
      <g className="bb-wave">
        {[420, 470, 520, 560].map((y, i) => (
          <path key={y} d={`M-200,${y} Q0,${y - 26} 200,${y} T600,${y} T1000,${y} T1400,${y}`} opacity={0.95 - i * 0.18} />
        ))}
      </g>
    </g>
  );
}

/* ─── DoD Civilian: heraldic badge + slow drift ─── */
function CivilianBadge({ stroke }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="1.5">
      <g className="bb-drift">
        <g transform="translate(600,300)" opacity="0.85">
          <polygon points="0,-180 60,-50 200,-30 100,60 130,200 0,130 -130,200 -100,60 -200,-30 -60,-50" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="80" />
          <text x="0" y="6" fontSize="16" fontWeight="900" textAnchor="middle" fill={stroke} stroke="none" letterSpacing="2">DoD</text>
        </g>
      </g>
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={i} x1={i * 130 + 10} y1="540" x2={i * 130 + 10} y2="580" strokeWidth="3" opacity="0.55" />
      ))}
    </g>
  );
}
