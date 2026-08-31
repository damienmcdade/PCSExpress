/*
 * AI consent sheet — Apple App Store Review Guideline 5.1.2(i).
 *
 * Blocking disclosure shown BEFORE the first time PCS Express sends anything
 * a user typed to a third-party AI. It names the providers, says exactly what
 * leaves the device, and records an explicit decision. The servers refuse to
 * transmit until that decision is "Agree" (see shared/aiConsent.js).
 *
 * Every factual claim below was checked against the real call sites:
 *   - src/components/AIAssistantChip.jsx  → POST /api/jtr-assistant with
 *     { q, history (last 12 turns), language, userContext }, where userContext
 *     is formatUserContextForPrompt(): branch, rank, component, ordersType,
 *     moveType, CONUS/OCONUS, dependents/children/pets flags,
 *     daysUntilReportDate, currentPhase, openTasksInPhase.
 *   - src/components/JTRAssistantModule.jsx → POST /api/jtr-assistant with the
 *     typed question only (no move context).
 *   - src/components/TranslationModule.jsx → POST /api/ai with a fixed
 *     translation instruction plus the exact English text typed.
 * All four handlers call Anthropic first and fall back to OpenAI only when
 * Anthropic cannot serve (5xx/529, or a 400 reporting credit/billing/balance/
 * quota) and OPENAI_API_KEY is configured.
 *
 * Mounted once in App.jsx; it listens for AI_CONSENT_REQUEST_EVENT so any call
 * site can raise it with requestAiConsent().
 */

import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  AI_CONSENT_REQUEST_EVENT,
  recordAiConsent,
  settleAiConsent,
} from '../config/aiConsent';

export default function AIConsentSheet() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    const onRequest = () => setOpen(true);
    window.addEventListener(AI_CONSENT_REQUEST_EVENT, onRequest);
    return () => window.removeEventListener(AI_CONSENT_REQUEST_EVENT, onRequest);
  }, []);

  // Escape declines. Declining is always safe here — the rest of the app is
  // unaffected — so there is no "are you sure" step to trap a keyboard user.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        decline();
      }
    };
    // Capture phase so this runs before App.jsx's global Escape handler and
    // the topmost dialog is the one that closes.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  const agree = () => {
    recordAiConsent();
    setOpen(false);
    settleAiConsent(true);
  };

  const decline = () => {
    setOpen(false);
    settleAiConsent(false);
  };

  if (!open) return null;

  const bullet = { margin: '0 0 8px 0', fontSize: 16, lineHeight: 1.55, color: '#0D1821' };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13, 24, 33, 0.72)',
        zIndex: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-consent-title"
        aria-describedby="ai-consent-intro"
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 18,
          boxShadow: '0 8px 44px rgba(0,0,0,0.45)',
          padding: '22px 20px calc(20px + env(safe-area-inset-bottom))',
        }}
      >
        <h2
          id="ai-consent-title"
          style={{ margin: '0 0 10px 0', fontSize: 21, fontWeight: 900, color: '#0D1821', lineHeight: 1.3 }}
        >
          Before you use the AI assistants
        </h2>

        <p id="ai-consent-intro" style={{ margin: '0 0 16px 0', fontSize: 16, lineHeight: 1.6, color: '#1F2937' }}>
          The AI Assistant and the free-text Translate tab send what you type out of
          PCS Express to an outside AI company, which writes the answer and sends it
          back. Nothing goes anywhere until you agree.
        </p>

        <div style={{ background: '#F4F7FB', border: '1px solid #DDE3EA', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0D1821', marginBottom: 8 }}>Who receives it</div>
          <p style={{ margin: '0 0 8px 0', fontSize: 16, lineHeight: 1.55, color: '#1F2937' }}>
            <strong>Anthropic (Claude)</strong> handles these requests. If Anthropic is
            unavailable, the same request goes to <strong>OpenAI</strong> instead so the
            assistant keeps working. Both are U.S. companies, and one of the two receives
            your text every time you use these features.
          </p>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: '#46586B' }}>
            They use the text to generate the reply and return it to PCS Express. What they
            keep or do with it afterwards is governed by their own policies:{' '}
            <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0D3B66', fontWeight: 700 }}>Anthropic privacy policy</a>
            {' · '}
            <a href="https://openai.com/policies/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ color: '#0D3B66', fontWeight: 700 }}>OpenAI privacy policy</a>.
          </p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0D1821', marginBottom: 8 }}>What gets sent</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={bullet}>
              <strong>AI Assistant:</strong> your question, the recent messages in that
              conversation, your app language, and a short summary of your move — branch,
              rank, component, orders type, move type, whether you are CONUS or OCONUS,
              whether you have dependents, children or pets, days until your report date,
              your current phase, and how many tasks are still open.
            </li>
            <li style={bullet}>
              <strong>JTR Assistant “Ask anything”:</strong> only the question you type.
            </li>
            <li style={{ ...bullet, marginBottom: 0 }}>
              <strong>Translate tab:</strong> the English text you type there and the
              language you chose. The Common Phrases tab is not affected — those
              translations already live on this device and never leave it.
            </li>
          </ul>
        </div>

        <p style={{ margin: '0 0 14px 0', fontSize: 15, lineHeight: 1.55, color: '#46586B' }}>
          PCS Express does not keep your question or the answer on its servers — only
          anonymous counters that stop the service being abused. Your profile, checklists
          and documents stay encrypted on this device and are never sent.
        </p>

        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px 0', fontSize: 15, lineHeight: 1.55, color: '#7A4A00' }}>
            Treat it as an unclassified conversation. Don’t type classified or CUI material,
            unit IDs, GBL numbers, or exact operational dates.
          </p>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: '#7A4A00' }}>
            Answers about pay, entitlements and regulations are AI-generated and can be
            wrong or out of date. Always check them against the current JTR / FTR / DSSR
            and your finance office before you act.
          </p>
        </div>

        <button
          type="button"
          onClick={agree}
          style={{
            width: '100%',
            minHeight: 48,
            padding: '13px 16px',
            borderRadius: 12,
            border: 'none',
            background: '#0D3B66',
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Agree and continue
        </button>
        <button
          type="button"
          onClick={decline}
          style={{
            width: '100%',
            minHeight: 48,
            marginTop: 10,
            padding: '13px 16px',
            borderRadius: 12,
            border: '1.5px solid #0D3B66',
            background: '#FFFFFF',
            color: '#0D3B66',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Not now
        </button>

        <p style={{ margin: '12px 0 0 0', fontSize: 14, lineHeight: 1.55, color: '#56697C' }}>
          If you tap “Not now”, everything else in PCS Express keeps working — checklists,
          timeline, calculators, the PCS binder, base info, the curated JTR knowledge base
          and Common Phrases. Only the two AI features stay switched off. You can agree — or
          change your mind later — under <strong>Security &amp; data handling</strong> at the
          bottom of the Command Center.
        </p>
      </div>
    </div>
  );
}
