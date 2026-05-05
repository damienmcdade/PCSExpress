/*
 * Purpose: Privacy shield overlay that obscures PCS Express when the app is backgrounded.
 * Third-party dependencies: React only.
 */

import { useEffect, useState } from 'react';

export default function PrivacyShield() {
  const [shielded, setShielded] = useState(false);

  useEffect(() => {
    const applyShield = () => setShielded(document.hidden);
    const blurShield = () => setShielded(true);
    const removeShield = () => setShielded(false);

    document.addEventListener('visibilitychange', applyShield);
    window.addEventListener('blur', blurShield);
    window.addEventListener('focus', removeShield);
    return () => {
      document.removeEventListener('visibilitychange', applyShield);
      window.removeEventListener('blur', blurShield);
      window.removeEventListener('focus', removeShield);
    };
  }, []);

  if (!shielded) return null;

  return (
    <div className="privacy-shield" role="presentation" aria-hidden="true">
      <div className="privacy-shield__mark">PCS Express</div>
      <div className="privacy-shield__text">Privacy Shield Active</div>
    </div>
  );
}
