/*
 * Purpose: Offline resilience indicator for locally saved PCS Express data.
 * Third-party dependencies: React only.
 */

import { useEffect, useState } from 'react';

export default function SyncStatusIndicator({ label = 'Encrypted and saved locally' }) {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [savedAt, setSavedAt] = useState(() => new Date());

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onSync = () => setSavedAt(new Date());
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('pcs-local-sync', onSync);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('pcs-local-sync', onSync);
    };
  }, []);

  return (
    <div className="sync-status" aria-live="polite">
      <span className={`sync-status__dot ${online ? 'is-online' : 'is-offline'}`} />
      <span>{online ? label : 'Comms-dark mode: encrypted locally'}</span>
      <span className="sync-status__time">{savedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}
