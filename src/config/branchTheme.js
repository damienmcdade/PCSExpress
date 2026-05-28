/*
 * Branch-tailored theme.
 *
 * Source of truth for per-branch color schemes, motto, and abstract
 * backdrop patterns. Wired from the user's onboarding selection
 * (`profile.branch`) into the landing-page hero (interactive preview)
 * and the in-app dashboard header (active theme).
 *
 * Why abstract SVG patterns instead of service-member photos:
 *   - DoD photos are public domain by federal copyright law
 *     (17 USC §105) but each requires sourcing + bundling a JPEG
 *     into the eager bundle, which would balloon the landing payload
 *     past the AdSense / Lighthouse budget.
 *   - Photo selection also carries its own representation /
 *     diversity / "is this MOS appropriate" review burden that we
 *     don't want to gate every release on.
 *   - Distinctive geometric patterns (radar grids, orbital arcs, etc.)
 *     paired with each branch's published color scheme deliver an
 *     unmistakable branch-feel without those costs.
 *
 * Color references are each branch's PUBLISHED brand color from the
 * service's official PAO / heraldry office.
 */

export const BRANCHES = {
  Army: {
    label: 'Army',
    motto: 'This We\'ll Defend',
    primary: '#000000',       // Army Black
    secondary: '#FFD700',     // Army Gold
    accent: '#4B5320',        // Army Green (OD)
    bgGradient: 'linear-gradient(135deg, #1B1B1B 0%, #4B5320 60%, #FFD700 140%)',
    surfaceTint: 'rgba(75, 83, 32, 0.06)',
    pattern: 'hex',
  },
  Navy: {
    label: 'Navy',
    motto: 'Honor, Courage, Commitment',
    primary: '#000080',       // Navy Blue
    secondary: '#FFD700',     // Navy Gold
    accent: '#001F54',
    bgGradient: 'linear-gradient(135deg, #001F54 0%, #003B7A 55%, #FFD700 140%)',
    surfaceTint: 'rgba(0, 31, 84, 0.06)',
    pattern: 'waves',
  },
  'Marine Corps': {
    label: 'Marine Corps',
    motto: 'Semper Fidelis',
    primary: '#C8102E',       // Scarlet
    secondary: '#FFD700',     // Marine Corps Gold
    accent: '#7A0A1F',
    bgGradient: 'linear-gradient(135deg, #7A0A1F 0%, #C8102E 55%, #FFD700 130%)',
    surfaceTint: 'rgba(200, 16, 46, 0.06)',
    pattern: 'eagle-globe-anchor',
  },
  'Air Force': {
    label: 'Air Force',
    motto: 'Aim High … Fly-Fight-Win',
    primary: '#003A70',       // Air Force Blue
    secondary: '#C0C0C0',     // Silver
    accent: '#1462A4',
    bgGradient: 'linear-gradient(135deg, #001F3F 0%, #003A70 55%, #1462A4 110%)',
    surfaceTint: 'rgba(0, 58, 112, 0.06)',
    pattern: 'wings',
  },
  'Space Force': {
    label: 'Space Force',
    motto: 'Semper Supra',
    primary: '#1B1B41',       // Space Black
    secondary: '#C0C0C0',     // Silver
    accent: '#4B0082',
    bgGradient: 'linear-gradient(135deg, #000010 0%, #1B1B41 50%, #4B0082 130%)',
    surfaceTint: 'rgba(75, 0, 130, 0.06)',
    pattern: 'orbit',
  },
  'Coast Guard': {
    label: 'Coast Guard',
    motto: 'Semper Paratus',
    primary: '#003366',       // CG Blue
    secondary: '#FF671F',     // CG Orange
    accent: '#C8102E',        // CG Racing Stripe Red
    bgGradient: 'linear-gradient(135deg, #001F4D 0%, #003366 55%, #FF671F 130%)',
    surfaceTint: 'rgba(255, 103, 31, 0.06)',
    pattern: 'lighthouse',
  },
  'DoD Civilian': {
    label: 'DoD Civilian',
    motto: 'Service to the Nation',
    primary: '#0D3B66',
    secondary: '#C99A3D',
    accent: '#56697C',
    bgGradient: 'linear-gradient(135deg, #082A4D 0%, #0D3B66 55%, #C99A3D 130%)',
    surfaceTint: 'rgba(13, 59, 102, 0.06)',
    pattern: 'badge',
  },
};

export const DEFAULT_BRANCH_KEY = 'DoD Civilian';

export function branchTheme(branchKey) {
  if (!branchKey) return BRANCHES[DEFAULT_BRANCH_KEY];
  return BRANCHES[branchKey] || BRANCHES[DEFAULT_BRANCH_KEY];
}

export const BRANCH_KEYS = Object.keys(BRANCHES);
