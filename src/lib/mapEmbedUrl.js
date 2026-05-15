/*
 * Google Maps embed URL helpers shared by BaseMapModule and HomeLocatorTab.
 *
 * The classic `maps.google.com/maps?q=...&output=embed` URL accepts a
 * `z=` (zoom) parameter between 0 (whole-world) and 21 (street level).
 * Without `z`, Google picks a zoom based on the geocoded result type and
 * for installation queries that often resolves much wider than the base
 * itself - users see surrounding state/region instead of the base.
 *
 * Default zoom 13 keeps most CONUS installation footprints visible while
 * still showing nearby town context. Override via the second argument.
 */

const DEFAULT_ZOOM = 13;

export function publicMapEmbedUrl(label, zoom = DEFAULT_ZOOM) {
  const query = encodeURIComponent(label || 'military installation');
  const z = Number.isFinite(zoom) ? Math.max(1, Math.min(21, Math.round(zoom))) : DEFAULT_ZOOM;
  return `https://maps.google.com/maps?q=${query}&z=${z}&output=embed`;
}

export function publicMapSearchUrl(label) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label || 'military installation')}`;
}
