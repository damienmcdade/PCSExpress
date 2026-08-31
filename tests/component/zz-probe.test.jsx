import { describe, it, expect } from 'vitest';
import { hasAiConsent, recordAiConsent } from '../../src/config/aiConsent';
describe('probe', () => {
  it('storage', () => {
    let e1=null; try { window.localStorage.setItem('k','1'); } catch(e){ e1=String(e); }
    let v=null,e2=null; try { v = window.localStorage.getItem('k'); } catch(e){ e2=String(e); }
    recordAiConsent();
    let raw=null; try { raw = window.localStorage.getItem('pcs_ai_consent'); } catch(e){ raw='ERR'; }
    expect({ e1, v, e2, raw, has: hasAiConsent() }).toEqual('SHOW');
  });
});
