/*
 * Purpose: stable identity for PCS checklist tasks.
 * Third-party dependencies: none.
 *
 * WHY: completion, reminders and snoozes used to be keyed positionally as
 * `${phase}-${index}`, where `index` addressed the array returned by
 * getTailoredChecklist() — an array applyChecklistFilters() DELETES items out
 * of the middle of, based on hasPets / hasChildren / moveType / isOverseas /
 * component / ordersType, all of which the member can change mid-move. Adding
 * a pet, or shipping one new task string, shifted every index after the edit:
 * completed tasks silently re-opened and, past PHASE_WINDOWS[phase].overdueAt,
 * rendered in red as "PAST DUE — Complete immediately."
 *
 * The key is now derived from the task TEXT, so it survives filter changes and
 * insertions anywhere in the list. A task whose wording is edited upstream gets
 * a new key and re-opens once — that is the honest outcome (the task changed),
 * and it is bounded, unlike the positional cascade.
 *
 * Key shape: `${phase}::${slug}~${hash}`
 *   - slug is a readable 48-char prefix so a stored key is debuggable.
 *   - hash is FNV-1a over the FULL text, so two tasks sharing a 48-char prefix
 *     cannot collide. Verified zero collisions across all 730 tasks in
 *     BRANCH_PCS_CHECKLISTS + DOD_CIVILIAN_CHECKLIST (tests/unit).
 *   - "::" separates phase from task because phase names themselves contain
 *     hyphens ("In-Processing"), which is what made the legacy key ambiguous
 *     to parse in the first place.
 */

export const CHECKLIST_KEY_SEPARATOR = '::';

// localStorage flag recording that the one-time positional -> text-stable key
// migration has run for this device. Bump the suffix only if the key format
// itself changes again.
export const CHECKLIST_KEY_MIGRATION_FLAG = 'pcs_checklist_key_migration_v2';

// FNV-1a, 32-bit. Chosen for being tiny and dependency-free; this is a
// collision-avoidance suffix, not a security primitive.
function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

export function slugifyTask(text) {
  const s = String(text ?? '');
  const slug = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
  return `${slug}~${fnv1a32(s)}`;
}

/** Stable completion/reminder/snooze key for one task within one phase. */
export function checklistTaskKey(phase, task) {
  return `${String(phase ?? '')}${CHECKLIST_KEY_SEPARATOR}${slugifyTask(task)}`;
}

/**
 * Parse a legacy positional key. Returns { phase, index } or null.
 * Splits on the LAST hyphen because phase names contain hyphens, and requires
 * the trailing segment to be all digits so a text-derived key is never
 * mistaken for a positional one.
 */
export function parseLegacyChecklistKey(key) {
  const k = String(key ?? '');
  if (!k || k.includes(CHECKLIST_KEY_SEPARATOR)) return null;
  const sep = k.lastIndexOf('-');
  if (sep <= 0) return null;
  const idx = k.slice(sep + 1);
  if (!/^\d+$/.test(idx)) return null;
  return { phase: k.slice(0, sep), index: Number(idx) };
}

/**
 * One-time migration of a `{ key: value }` checklist map (completions,
 * reminders, snoozes) from positional keys to text-stable ones.
 *
 * `tailored` must be the SAME tailored checklist the member was looking at
 * when they made the entries — i.e. getTailoredChecklist() for their current
 * profile. That resolves each stored index to the task it currently addresses,
 * which is exactly what the UI is rendering right now, so the migration
 * preserves the member's on-screen state and stops it drifting from then on.
 *
 * Entries that cannot be resolved (phase gone, index past the end) are kept
 * verbatim rather than dropped — the migration must never be the thing that
 * destroys real progress.
 */
export function migrateChecklistKeyMap(map, tailored) {
  const source = (map && typeof map === 'object' && !Array.isArray(map)) ? map : {};
  const next = {};
  let migrated = 0;
  let unresolved = 0;
  for (const [key, value] of Object.entries(source)) {
    const legacy = parseLegacyChecklistKey(key);
    if (!legacy) {
      next[key] = value;
      continue;
    }
    const task = (tailored?.[legacy.phase] || [])[legacy.index];
    if (typeof task !== 'string') {
      next[key] = value;
      unresolved += 1;
      continue;
    }
    next[checklistTaskKey(legacy.phase, task)] = value;
    migrated += 1;
  }
  return { next, migrated, unresolved };
}

/**
 * key -> { phase, task } index over a tailored checklist. Used to recover a
 * task's label from a stored reminder key without parsing the key itself.
 */
export function buildChecklistKeyIndex(tailored) {
  const index = new Map();
  for (const [phase, tasks] of Object.entries(tailored || {})) {
    if (!Array.isArray(tasks)) continue;
    for (const task of tasks) {
      index.set(checklistTaskKey(phase, task), { phase, task });
    }
  }
  return index;
}
