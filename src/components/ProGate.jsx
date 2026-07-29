// PCS Pro retired (v1.5.0): every module — Move Strategy, Documents
// checklist, Inventory & Claims vault — is now free on every platform.
// This gate is a pure pass-through kept so the render sites in App.jsx
// stay untouched. The native StoreKit plumbing (src/native.js, PCSPro.swift)
// remains in place solely so any legacy subscriber's entitlement/restore
// calls keep resolving without errors; nothing invokes the paywall anymore.
export default function ProGate({ children }) {
  return children;
}
