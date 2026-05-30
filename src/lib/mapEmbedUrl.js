/*
 * Map embed URL helpers shared by BaseMapModule.
 *
 * Two providers:
 *
 * 1. publicMapEmbedUrl (Google classic embed) - legacy keyword fallback.
 *    Accepts a `z=` (zoom) parameter, 0-21. Drawback: Google's geocoder
 *    can land on the wrong city or show a consent wall in some
 *    jurisdictions.
 *
 * 2. osmBoundingBoxEmbedUrl (OpenStreetMap export iframe) - preferred
 *    when we have lat/lng from Nominatim. Renders OSM tiles with a
 *    marker directly on the installation. No API key, no consent wall,
 *    consistent worldwide.
 *
 * BaseMapModule geocodes the installation through Nominatim (already
 * in the app CSP for the route planner) and uses the OSM iframe so the
 * base sits exactly in the center of the viewport.
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

/**
 * Build an OpenStreetMap embed URL centered on (lat, lng) with a marker.
 * `spanDeg` controls the rough viewport width in degrees - smaller = more
 * zoomed in. ~0.06 deg fits a typical large CONUS installation.
 */
export function osmBoundingBoxEmbedUrl(lat, lng, spanDeg = 0.06) {
  // Number.isFinite (not typeof === 'number') so NaN/±Infinity don't
  // produce "bbox=NaN,NaN,..." URLs that silently break the iframe.
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const span = Number.isFinite(spanDeg) ? spanDeg : 0.06;
  const half = span / 2;
  const bbox = [lng - half, lat - half, lng + half, lat + half].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
