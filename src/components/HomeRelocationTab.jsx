/*
 * Purpose: Home relocation evidence, claims deadlines, and replacement value planning.
 * Third-party dependencies: React only.
 */

import { useEffect, useMemo, useState } from 'react';
import { secureLocalStore, AuditLogger } from '../security/SecurityExtensions';
import SyncStatusIndicator from './SyncStatusIndicator';

const STORAGE_KEY = 'pcs_home_relocation';

const OFFICIAL_LINKS = [
  { name: 'Military OneSource Moving Claims', desc: 'Official guide for loss/damage notice, claims, FRV, and MCO escalation.', url: 'https://www.militaryonesource.mil/resources/millife-guides/moving-claims/' },
  { name: 'DPS / Defense Personal Property Program', desc: 'Schedule shipments, track delivery, and file household goods claims.', url: 'https://dps.move.mil/cust/standard/user/home.xhtml' },
  { name: 'Military PCS Moving FAQs', desc: 'Official PCS moving questions, claim timelines, and DPS guidance.', url: 'https://www.militaryonesource.mil/moving-pcs/plan-to-move/military-pcs-moving-faqs/' },
  { name: 'Joint Travel Regulations', desc: 'Official DoD travel and transportation entitlement regulation.', url: 'https://www.travel.dod.mil/Policy-Regulations/Joint-Travel-Regulations/' },
];

const DEFAULT_ITEMS = [
  { name: 'Living room television', category: 'Electronics', replacement: 900, age: 2, before: false, after: false },
  { name: 'Computer or tablet', category: 'Electronics', replacement: 1200, age: 1, before: false, after: false },
  { name: 'Furniture set', category: 'Furniture', replacement: 1800, age: 4, before: false, after: false },
];

function addDays(dateString, days) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function depreciatedValue(replacement, age) {
  const value = Number(replacement) || 0;
  const years = Number(age) || 0;
  const depreciation = Math.min(0.75, years * 0.1);
  return Math.round(value * (1 - depreciation));
}

export default function HomeRelocationTab({ theme }) {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [draft, setDraft] = useState({ name: '', category: 'High-value item', replacement: '', age: '' });

  useEffect(() => {
    let mounted = true;
    secureLocalStore.get(STORAGE_KEY, {}).then(saved => {
      if (!mounted || !saved) return;
      setDeliveryDate(saved.deliveryDate || '');
      setItems(Array.isArray(saved.items) && saved.items.length ? saved.items : DEFAULT_ITEMS);
    });
    return () => { mounted = false; };
  }, []);

  const saveState = async (next) => {
    await secureLocalStore.set(STORAGE_KEY, next);
  };

  const updateDeliveryDate = async (value) => {
    setDeliveryDate(value);
    await saveState({ deliveryDate: value, items });
    AuditLogger.record('home_relocation_deadline_update', { deliveryDate: value });
  };

  const updateItem = async (index, patch) => {
    const nextItems = items.map((item, i) => i === index ? { ...item, ...patch } : item);
    setItems(nextItems);
    await saveState({ deliveryDate, items: nextItems });
    AuditLogger.record('home_relocation_inventory_update', { index, fields: Object.keys(patch) });
  };

  const addItem = async () => {
    if (!draft.name.trim()) return;
    const nextItems = [...items, { ...draft, replacement: Number(draft.replacement) || 0, age: Number(draft.age) || 0, before: false, after: false }];
    setItems(nextItems);
    setDraft({ name: '', category: 'High-value item', replacement: '', age: '' });
    await saveState({ deliveryDate, items: nextItems });
    AuditLogger.record('home_relocation_inventory_add', { name: draft.name });
  };

  const totals = useMemo(() => items.reduce((acc, item) => {
    const replacement = Number(item.replacement) || 0;
    const depreciated = depreciatedValue(replacement, item.age);
    acc.replacement += replacement;
    acc.depreciated += depreciated;
    return acc;
  }, { replacement: 0, depreciated: 0 }), [items]);

  const lossDamageDeadline = addDays(deliveryDate, 180);
  const fullReplacementDeadline = addDays(deliveryDate, 274);

  return (
    <div className="home-relocation-page">
      <div className="home-relocation-header">
        <div>
          <div className="assistance-kicker">Home Relocation</div>
          <h2>Inventory, Evidence & Claims</h2>
          <p>Use official DPS moving-claims timelines to document high-value property, preserve before-and-after evidence, and estimate replacement value.</p>
        </div>
        <SyncStatusIndicator />
      </div>

      <section className="claims-deadline-card">
        <h3>Claims Deadline Management</h3>
        <label>
          Delivery complete date
          <input type="date" value={deliveryDate} onChange={event => updateDeliveryDate(event.target.value)} />
        </label>
        <div className="claims-deadline-grid">
          <div><span>Loss/damage notice</span><strong>{lossDamageDeadline || 'Set delivery date'}</strong><p>Submit written notice within 180 calendar days from delivery.</p></div>
          <div><span>Full replacement value</span><strong>{fullReplacementDeadline || 'Set delivery date'}</strong><p>File the claim in DPS within 9 months for full replacement value eligibility.</p></div>
        </div>
      </section>

      <section className="inventory-card">
        <h3>Digital Inventory & Evidence</h3>
        <p>Record before and after photos or videos outside the app, then mark each item documented here so the claim package stays organized.</p>
        <div className="inventory-add-row">
          <input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Item name" />
          <input value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} placeholder="Category" />
          <input type="number" min="0" value={draft.replacement} onChange={event => setDraft({ ...draft, replacement: event.target.value })} placeholder="Replacement $" />
          <input type="number" min="0" value={draft.age} onChange={event => setDraft({ ...draft, age: event.target.value })} placeholder="Age years" />
          <button onClick={addItem} style={{ background: theme.primary }}>Add Item</button>
        </div>
        <div className="inventory-list">
          {items.map((item, index) => (
            <article key={`${item.name}-${index}`} className="inventory-item">
              <div>
                <strong>{item.name}</strong>
                <span>{item.category} - age {item.age || 0} yr</span>
              </div>
              <div className="inventory-values">
                <span>FRV ${Number(item.replacement || 0).toLocaleString()}</span>
                <span>Dep. ${depreciatedValue(item.replacement, item.age).toLocaleString()}</span>
              </div>
              <label><input type="checkbox" checked={!!item.before} onChange={event => updateItem(index, { before: event.target.checked })} /> Before media</label>
              <label><input type="checkbox" checked={!!item.after} onChange={event => updateItem(index, { after: event.target.checked })} /> After media</label>
            </article>
          ))}
        </div>
      </section>

      <section className="replacement-card">
        <h3>Replacement Value Calculator</h3>
        <div className="replacement-grid">
          <div><span>Estimated full replacement value</span><strong>${totals.replacement.toLocaleString()}</strong></div>
          <div><span>Estimated depreciated value</span><strong>${totals.depreciated.toLocaleString()}</strong></div>
          <div><span>Negotiation gap</span><strong>${Math.max(0, totals.replacement - totals.depreciated).toLocaleString()}</strong></div>
        </div>
        <p>FRV generally focuses on replacement or repair costs for lost or damaged items. Use receipts, photos, model numbers, and comparable replacement listings when negotiating with the transportation service provider.</p>
      </section>

      <section className="pet-resources" aria-label="Official home relocation resources">
        <h3>Official Moving Claims Links</h3>
        {OFFICIAL_LINKS.map(resource => (
          <a key={resource.name} href={resource.url} target="_blank" rel="noopener noreferrer">
            <strong>{resource.name}</strong>
            <span>{resource.desc}</span>
          </a>
        ))}
      </section>
    </div>
  );
}
