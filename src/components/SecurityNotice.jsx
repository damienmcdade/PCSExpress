/*
 * Purpose: Reusable public-data and local-storage notices for sensitive PCS workflows.
 * Third-party dependencies: React only.
 */

export function PublicDataNotice({ theme, compact = false }) {
  return (
    <div className="security-notice security-notice--public" style={{ borderColor: `${theme?.primary || '#1565C0'}55` }}>
      <strong>Official public data only</strong>
      <span>
        Application reference content is limited to official public U.S. government, U.S. military, or public-source lookup data. Do not enter classified, CUI, rosters, operational details, access procedures, internal phone lists, or non-public government information.
      </span>
      {!compact && <small>This safeguard is designed to align with NIST SSDF and DISA STIG-style public-data handling expectations; it is not a formal DoD authorization or ATO certification.</small>}
    </div>
  );
}

export function LocalEncryptedDataNotice({ theme, compact = false }) {
  return (
    <div className="security-notice security-notice--encrypted" style={{ borderColor: `${theme?.accent || '#2E7D32'}66` }}>
      <strong>Local device storage</strong>
      <span>
        User-entered PCS data is stored locally on this device and is not intentionally uploaded to PCS Express servers for storage. The previous browser secure-storage wrapper has been removed to prevent refresh failures; browser protections now rely on strict security headers, privacy shielding, local-only storage, and app-level recovery safeguards.
      </span>
      {!compact && <small>For the highest protection, keep the device locked, updated, and enrolled in your organization-approved security controls.</small>}
    </div>
  );
}
