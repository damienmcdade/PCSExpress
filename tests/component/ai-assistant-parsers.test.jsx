/*
 * Intrusive tests for the pure parser helpers that turn LLM-emitted
 * text into UI affordances inside the AI Assistant modal:
 *
 *   parseAIActions          — extracts [action: ...] markers, strips
 *                             them from visible text, enforces a cap
 *                             on action count, allowlists tab_ids.
 *   parseInappCitation      — extracts "In-app: Group → Subtab" lines
 *                             from assistant messages and maps them
 *                             to the app's deep-link tab ids.
 *   escapeHtml              — escapes the 5 HTML metachars before
 *                             the conversation is rendered into a
 *                             printable transcript window.
 *   searchKB                — keyword-scores the curated KB so the
 *                             modal can answer when the live API is
 *                             unconfigured or unreachable.
 *   formatUserContextForPrompt
 *   curatedContextAnswer    — local-only answers for "what's overdue"
 *                             / "what should I do this week" pulled
 *                             from the user's on-device checklist.
 *
 * Why these matter: they ingest text that the LLM may have under
 * adversarial influence (prompt injection through user q, history, or
 * earlier compromised turn). The parsers must:
 *   - Refuse to render unknown tab_ids (no arbitrary deep-links).
 *   - Cap the number of action buttons (no DoS / UI flood).
 *   - Strip markers from visible text (no leaked metadata in chat).
 *   - HTML-escape transcript content (no XSS in the print window).
 */
import { describe, it, expect } from 'vitest';
import {
  parseAIActions,
  parseInappCitation,
  escapeHtml,
  searchKB,
  formatUserContextForPrompt,
  curatedContextAnswer,
} from '../../src/components/AIAssistantChip';

describe('parseAIActions', () => {
  it('returns empty result for non-string / empty input', () => {
    expect(parseAIActions(null)).toEqual({ cleanText: '', actions: [] });
    expect(parseAIActions(undefined)).toEqual({ cleanText: '', actions: [] });
    expect(parseAIActions('')).toEqual({ cleanText: '', actions: [] });
    expect(parseAIActions(42)).toEqual({ cleanText: '', actions: [] });
  });

  it('strips a valid open_tab marker from visible text and exposes the action', () => {
    const { cleanText, actions } = parseAIActions('Open the calc.\n[action: open_tab bah-calculator]');
    expect(cleanText).toBe('Open the calc.');
    expect(actions).toEqual([{ verb: 'open_tab', tab: 'bah-calculator', label: 'BAH / OHA Calculator' }]);
  });

  it('strips ask_followup markers and exposes the question (truncated to 200 chars)', () => {
    const longQ = 'Q'.repeat(500);
    const { cleanText, actions } = parseAIActions(`Body.\n[action: ask_followup ${longQ}]`);
    expect(cleanText).toBe('Body.');
    expect(actions).toHaveLength(1);
    expect(actions[0].verb).toBe('ask_followup');
    expect(actions[0].q.length).toBe(200);
  });

  it('drops open_tab markers whose tab_id is NOT on the allowlist', () => {
    // Unknown tab_ids must NOT render a button (would deep-link to a
    // route that doesn't exist, or worse — confuse the SPA router).
    const { actions } = parseAIActions('hi\n[action: open_tab admin-panel]\n[action: open_tab ../../etc/passwd]');
    expect(actions).toEqual([]);
  });

  it('caps the number of rendered actions at 3 even if the model emits more', () => {
    // System prompt says "AT MOST 3"; the parser also enforces. This
    // protects the UI from a runaway / jailbroken model that floods
    // buttons.
    const body = Array.from({ length: 10 }, (_, i) => `[action: open_tab checklist]`).join('\n');
    const { actions } = parseAIActions('intro\n' + body);
    expect(actions.length).toBeLessThanOrEqual(3);
  });

  it('ignores unknown action verbs', () => {
    const { actions } = parseAIActions('hi\n[action: run_shell rm -rf /]\n[action: open_tab home]');
    // run_shell isn't a recognized verb so the regex doesn't even
    // match it. Only the valid open_tab survives.
    expect(actions).toEqual([{ verb: 'open_tab', tab: 'home', label: 'Command Center' }]);
  });

  it('treats HTML / script tags in marker args as inert text (no markup leakage)', () => {
    // The args become button text via React's text path — but the
    // ask_followup question is what gets stored. Make sure the raw
    // string is preserved without any HTML-escape side effects (those
    // would corrupt round-trip search).
    const { actions } = parseAIActions('hi\n[action: ask_followup <script>alert(1)</script>]');
    expect(actions[0].q).toBe('<script>alert(1)</script>');
    // React will escape this when it renders into the DOM — that's
    // the framework's job, not ours. We just verify we don't try to
    // pre-render it as HTML ourselves.
  });

  it('extracts multiple distinct valid markers up to the cap', () => {
    const { cleanText, actions } = parseAIActions(
      'Use these tools:\n' +
      '[action: open_tab bah-calculator]\n' +
      '[action: open_tab shipment-tracker]\n' +
      '[action: ask_followup What about TLE?]'
    );
    expect(cleanText).toBe('Use these tools:');
    expect(actions).toHaveLength(3);
    expect(actions.map(a => a.verb)).toEqual(['open_tab', 'open_tab', 'ask_followup']);
  });

  it('collapses 3+ consecutive newlines that result from stripped markers', () => {
    const { cleanText } = parseAIActions('Body\n\n\n\n[action: open_tab home]\n\n\nTail');
    expect(cleanText).not.toMatch(/\n{3,}/);
  });

  it('is case-insensitive on the verb but case-sensitive on the tab_id', () => {
    // Verb match uses /i; tab_ids must match the allowlist exactly to
    // avoid accepting "HOME" or "Home" as deep-link targets.
    const { actions } = parseAIActions('hi\n[ACTION: OPEN_TAB home]');
    expect(actions).toEqual([{ verb: 'open_tab', tab: 'home', label: 'Command Center' }]);
    const { actions: a2 } = parseAIActions('hi\n[action: open_tab HOME]');
    expect(a2).toEqual([]); // uppercase tab_id is not on the allowlist
  });

  it('returns original text when no markers are present', () => {
    const { cleanText, actions } = parseAIActions('Just a normal answer with no markers.');
    expect(cleanText).toBe('Just a normal answer with no markers.');
    expect(actions).toEqual([]);
  });

  it('drops empty ask_followup args', () => {
    // `[action: ask_followup ]` doesn't match the regex (requires
    // \s+ then [^\]]+) — verify it cleanly produces no action.
    const { actions } = parseAIActions('hi\n[action: ask_followup ]');
    expect(actions).toEqual([]);
  });
});

describe('parseInappCitation', () => {
  it('returns null for null / no-message input', () => {
    expect(parseInappCitation(null)).toBeNull();
    expect(parseInappCitation(undefined)).toBeNull();
    expect(parseInappCitation({})).toBeNull();
  });

  it('parses "In-app: Group → Subtab" arrow form', () => {
    const out = parseInappCitation({ text: 'Cited: In-app: Movement & Logistics → Shipment Tracker. Open it.' });
    expect(out).toMatchObject({ tab: 'home-relocation', sub: 'shipment-tracker' });
    expect(out.label).toContain('Movement & Logistics');
  });

  it('parses ">" form as a fallback separator', () => {
    const out = parseInappCitation({ text: 'In-app: Family Readiness > Translation.' });
    expect(out).toMatchObject({ tab: 'family-readiness', sub: 'translation' });
  });

  it('parses "->" ASCII arrow form', () => {
    // Group-2 capture is greedy across the rest of the sentence up to
    // the next period — so the citation phrase has to end with one.
    const out = parseInappCitation({ text: 'See In-app: PCS Operations -> Checklist.' });
    expect(out).toMatchObject({ tab: 'pcs-operations', sub: 'checklist' });
  });

  it('reads from the source field if text has no citation', () => {
    const out = parseInappCitation({ source: 'In-app: Mission Resources → Help Hub', text: 'no nav here' });
    expect(out).toMatchObject({ tab: 'mission-resources', sub: 'help-hub' });
  });

  it('returns null when the group is unknown (no arbitrary deep-link)', () => {
    const out = parseInappCitation({ text: 'In-app: Hidden Admin Console → Database.' });
    expect(out).toBeNull();
  });

  it('returns tab without sub when the subtab is unknown', () => {
    const out = parseInappCitation({ text: 'In-app: Family Readiness → SomeNewTabWeDontKnow.' });
    expect(out).toMatchObject({ tab: 'family-readiness', sub: null });
  });

  it('is case-insensitive on group/subtab matching', () => {
    const out = parseInappCitation({ text: 'in-app: MOVEMENT & LOGISTICS → bah Calculator.' });
    expect(out).toMatchObject({ tab: 'home-relocation', sub: 'bah-calculator' });
  });
});

describe('escapeHtml', () => {
  it('escapes all five HTML metacharacters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
    expect(escapeHtml("O'Reilly & Sons")).toBe('O&#39;Reilly &amp; Sons');
  });

  it('coerces non-string inputs without throwing', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(false)).toBe('false');
    // Critically: the boolean coercion should not allow "<" to slip
    // through (defensive coverage in case the messages array somehow
    // contained an object).
    expect(escapeHtml({ toString: () => '<x>' })).toBe('&lt;x&gt;');
  });

  it('escapes ampersand FIRST so we do not double-escape', () => {
    // The order of replacements matters: if you replace < before &
    // you get &lt; which then becomes &amp;lt; on the next pass.
    expect(escapeHtml('A&<B>')).toBe('A&amp;&lt;B&gt;');
  });

  it('handles an injection payload that would be dangerous unescaped', () => {
    // escapeHtml only escapes the 5 metachars; the `onerror=` substring
    // survives as plain text. That's safe because the `<` is escaped
    // to `&lt;`, so no `<img>` tag forms when the string is inserted
    // into innerHTML downstream.
    const payload = '"><img src=x onerror=alert(1)>';
    const out = escapeHtml(payload);
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
    expect(out).toContain('&quot;');
    expect(out).toContain('&gt;');
  });
});

describe('searchKB', () => {
  it('returns null for empty / whitespace / null query', () => {
    expect(searchKB('')).toBeNull();
    expect(searchKB(null)).toBeNull();
    expect(searchKB('   ')).toBeNull();
  });

  it('returns null below the relevance threshold', () => {
    // Pure noise should not pull a curated entry — the threshold
    // requires at least one tag hit + one body hit.
    expect(searchKB('zzzzzz-no-such-token')).toBeNull();
  });

  it('matches a high-signal tag query (PPM)', () => {
    const hit = searchKB('how do I maximize my PPM payout?');
    expect(hit).not.toBeNull();
    expect(hit.tags).toEqual(expect.arrayContaining(['ppm']));
  });

  it('matches a translation query to the right curated entry', () => {
    const hit = searchKB('free translation OCONUS');
    expect(hit).not.toBeNull();
    expect(hit.citation).toMatch(/Translation/);
  });

  it('returns the same shape every time (citation + answer body)', () => {
    const hit = searchKB('crisis 988');
    expect(hit).toMatchObject({
      q: expect.any(String),
      a: expect.any(String),
      citation: expect.any(String),
      tags: expect.any(Array),
    });
  });

  it('does not crash on bizarre Unicode / control-char input', () => {
    expect(() => searchKB(' ￿<>\r\n   pcs')).not.toThrow();
  });
});

describe('formatUserContextForPrompt', () => {
  it('returns null for null / undefined', () => {
    expect(formatUserContextForPrompt(null)).toBeNull();
    expect(formatUserContextForPrompt(undefined)).toBeNull();
  });

  it('serializes the documented profile fields and skips falsy optionals', () => {
    const out = formatUserContextForPrompt({
      branch: 'Army',
      rank: 'E-5',
      component: 'Active',
      ordersType: 'PCS',
      moveType: 'HHG',
      isOverseas: true,
      hasDependents: true,
      hasChildren: false,
      hasPets: true,
      daysUntilTarget: 47,
      currentPhase: '60 Days Out',
      openTaskCount: 5,
    });
    expect(out).toContain('branch=Army');
    expect(out).toContain('OCONUS=yes');
    expect(out).toContain('dependents=yes');
    expect(out).toContain('pets=yes');
    expect(out).not.toContain('children=yes'); // false → skipped
    expect(out).toContain('daysUntilReportDate=47');
    expect(out).toContain('openTasksInPhase=5');
  });

  it('emits CONUS marker when isOverseas is falsy', () => {
    const out = formatUserContextForPrompt({ branch: 'Navy', isOverseas: false });
    expect(out).toContain('CONUS=yes');
    expect(out).not.toContain('OCONUS=yes');
  });

  it('uses "—" placeholder for missing string fields', () => {
    const out = formatUserContextForPrompt({});
    expect(out).toContain('branch=—');
    expect(out).toContain('rank=—');
  });
});

describe('curatedContextAnswer', () => {
  const ctx = {
    branch: 'Army',
    currentPhase: '30 Days Out',
    openTaskCount: 3,
    openTaskLabels: ['Schedule HHG pickup', 'Update DEERS', 'Reserve TLE lodging'],
    daysUntilTarget: 14,
  };

  it('returns null without context', () => {
    expect(curatedContextAnswer('whats overdue?', null)).toBeNull();
  });

  it('returns null when the question matches no template', () => {
    expect(curatedContextAnswer('what is BAH?', ctx)).toBeNull();
  });

  it('answers "what is overdue" with phase + task count + a sample of labels', () => {
    const out = curatedContextAnswer('whats overdue?', ctx);
    expect(out).toMatch(/3 open task/);
    expect(out).toMatch(/30 Days Out/);
    expect(out).toMatch(/Schedule HHG pickup/);
  });

  it('answers "what should I do this week" with up to 3 sampled tasks', () => {
    const out = curatedContextAnswer('what next this week?', ctx);
    expect(out).toMatch(/Focus this week/);
    const bulletCount = (out.match(/• /g) || []).length;
    expect(bulletCount).toBeLessThanOrEqual(3);
  });

  it('returns null when there are zero open tasks', () => {
    const empty = { ...ctx, openTaskCount: 0, openTaskLabels: [] };
    expect(curatedContextAnswer('whats overdue?', empty)).toBeNull();
  });

  it('returns null when currentPhase is missing', () => {
    const noPhase = { ...ctx, currentPhase: null };
    expect(curatedContextAnswer('whats overdue?', noPhase)).toBeNull();
  });
});
