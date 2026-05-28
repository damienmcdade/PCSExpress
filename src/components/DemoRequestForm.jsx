/*
 * DemoRequestForm — government / partner / family inquiry form.
 *
 * Posts to /api/demo-request. The endpoint validates and logs the
 * payload server-side for the operator to follow up on — there is
 * no persistent CRM, no third-party form provider, no automated
 * email pipeline yet (those are documented as roadmap items).
 *
 * Privacy:
 *   - Only the fields the user explicitly enters are sent.
 *   - We do NOT auto-attach the user's onboarding profile or any
 *     other on-device data to the request.
 *   - The 1KB max-length validation matches the server's body limit.
 */
import { useState } from 'react';
import { apiUrl } from '../config/apiConfig';

const INTERESTS = [
  { value: 'family', label: 'Military family / user' },
  { value: 'government', label: 'Government / VA / DoD' },
  { value: 'prime', label: 'Prime contractor' },
  { value: 'veteran-org', label: 'Veteran organization' },
  { value: 'investor', label: 'Investor / funding' },
  { value: 'general', label: 'General inquiry' },
];

const FIELD = {
  base: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    border: '1px solid #D8DEE7',
    borderRadius: 10,
    background: '#FFFFFF',
    color: '#0D1821',
    boxSizing: 'border-box',
  },
};

function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#0D3B66', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
      {required && <span aria-hidden="true" style={{ color: '#B71C1C', marginLeft: 4 }}>*</span>}
    </label>
  );
}

export default function DemoRequestForm({ onClose }) {
  const [form, setForm] = useState({
    name: '', email: '', organization: '', role: '', interest: 'family', message: '',
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | ok | error
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;
    // Lightweight client-side validation. The server re-validates.
    if (!form.name.trim() || form.name.trim().length < 2) {
      setStatus('error'); setErrorMsg('Please enter your name.'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setStatus('error'); setErrorMsg('Please enter a valid email address.'); return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      setStatus('error'); setErrorMsg('Tell us a bit about your interest (at least 10 characters).'); return;
    }
    setStatus('submitting'); setErrorMsg('');
    try {
      const r = await fetch(apiUrl('/api/demo-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name.trim().slice(0, 160),
          email: form.email.trim().slice(0, 160),
          organization: form.organization.trim().slice(0, 160),
          role: form.role.trim().slice(0, 120),
          interest: form.interest,
          message: form.message.trim().slice(0, 1500),
        }),
      });
      if (r.ok) {
        setStatus('ok');
      } else {
        const data = await r.json().catch(() => ({}));
        setStatus('error');
        setErrorMsg(data?.error || `The server returned ${r.status}. Please try again or email info@cyberwaveglobal.com.`);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Could not reach the server. Please try again, or email info@cyberwaveglobal.com.');
    }
  };

  if (status === 'ok') {
    return (
      <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 14, padding: 22, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">✓</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#1B5E20', marginBottom: 8 }}>Request received</div>
        <div style={{ fontSize: 13, color: '#1B5E20', lineHeight: 1.6, marginBottom: 16 }}>
          Thank you for reaching out. We'll respond directly to {form.email} within a few business days. PCS Express does not add inquirers to any marketing list.
        </div>
        {onClose && (
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid #1B5E20', color: '#1B5E20', padding: '8px 16px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 24, boxShadow: '0 6px 18px rgba(13,24,33,0.06)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div>
          <Label htmlFor="dr-name" required>Name</Label>
          <input id="dr-name" type="text" value={form.name} onChange={set('name')} autoComplete="name" maxLength={160} required aria-required="true" aria-invalid={status === 'error' ? 'true' : undefined} aria-describedby={status === 'error' && errorMsg ? 'dr-form-error' : undefined} style={FIELD.base} placeholder="Your full name" />
        </div>
        <div>
          <Label htmlFor="dr-email" required>Email</Label>
          <input id="dr-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={160} required aria-required="true" aria-invalid={status === 'error' ? 'true' : undefined} aria-describedby={status === 'error' && errorMsg ? 'dr-form-error' : undefined} style={FIELD.base} placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="dr-org">Organization</Label>
          <input id="dr-org" type="text" value={form.organization} onChange={set('organization')} autoComplete="organization" maxLength={160} style={FIELD.base} placeholder="Branch, agency, company, or none" />
        </div>
        <div>
          <Label htmlFor="dr-role">Role</Label>
          <input id="dr-role" type="text" value={form.role} onChange={set('role')} autoComplete="organization-title" maxLength={120} style={FIELD.base} placeholder="Your role" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label htmlFor="dr-interest" required>Interest</Label>
          <select id="dr-interest" value={form.interest} onChange={set('interest')} required aria-required="true" style={FIELD.base}>
            {INTERESTS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label htmlFor="dr-message" required>Message</Label>
          <textarea id="dr-message" value={form.message} onChange={set('message')} maxLength={1500} rows={5} required aria-required="true" aria-invalid={status === 'error' ? 'true' : undefined} aria-describedby={status === 'error' && errorMsg ? 'dr-form-error' : undefined} style={{ ...FIELD.base, fontFamily: 'inherit', resize: 'vertical' }} placeholder="A few sentences about how you'd potentially use or partner with PCS Express." />
          <div style={{ fontSize: 11, color: '#56697C', marginTop: 6 }}>{form.message.length} / 1500</div>
        </div>
      </div>

      {status === 'error' && errorMsg && (
        <div id="dr-form-error" role="alert" style={{ marginTop: 16, background: '#FFEBEE', border: '1px solid #EF9A9A', color: '#B71C1C', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            background: status === 'submitting' ? '#9AA5B1' : '#C99A3D',
            color: '#082A4D',
            border: 'none',
            padding: '13px 22px',
            borderRadius: 10,
            fontWeight: 900,
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            fontSize: 14,
            minHeight: 46,
          }}
        >
          {status === 'submitting' ? 'Sending…' : 'Send Request'}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid #D8DEE7', color: '#56697C', padding: '12px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
        )}
        <div style={{ fontSize: 11, color: '#56697C', flex: 1, minWidth: 200 }}>
          We respond directly. PCS Express does not share your contact information or add you to any list. Your submission (name, email, organization, role, message) plus your request IP is sent to the PCS Express server and written to ephemeral application logs for spam-prevention and follow-up; it is not persisted in a database.
        </div>
      </div>
    </form>
  );
}
