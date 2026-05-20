#!/usr/bin/env bash
#
# ios-archive-upload.sh — one-shot CLI archive + App Store Connect upload.
#
# STATUS: stub. Will only succeed once these prerequisites are in place:
#
#   1. An "Apple Distribution" certificate in your login keychain. The
#      Xcode GUI (Product → Archive → Distribute App → App Store Connect)
#      will generate one the first time. Alternatively, generate via
#      developer.apple.com (Certificates → +) and import the .cer.
#
#   2. An App Store Connect API key. Create at:
#        https://appstoreconnect.apple.com/access/api
#      Download the .p8 once (Apple does not show it again), then place
#      it at ~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8 so
#      altool / notarytool can find it automatically.
#
#   3. Set these env vars before running (do NOT commit them):
#        ASC_KEY_ID="ABC123XYZ9"
#        ASC_ISSUER_ID="69a6de70-...-..."
#        # Optional overrides:
#        IOS_BUNDLE_ID="com.pcsexpress.app"
#        IOS_TEAM_ID="2S2MY5X9B9"
#        IOS_SCHEME="App"
#
#   4. Run:
#        npm run ios:upload
#
# What it does:
#   • Bumps CFBundleVersion if BUMP_BUILD=1 (App Store rejects duplicate
#     build numbers per marketing version).
#   • npm run build → vite production bundle
#   • npx cap sync ios → copy web assets into Xcode project
#   • xcodebuild archive → build/App.xcarchive
#   • xcodebuild -exportArchive → build/export/App.ipa
#   • xcrun altool --upload-app → ASC ingest
#
# On any failure the script exits non-zero. Re-running from a partial
# state is safe — each phase has its own clean-up.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

IOS_SCHEME="${IOS_SCHEME:-App}"
IOS_BUNDLE_ID="${IOS_BUNDLE_ID:-com.pcsexpress.app}"
IOS_TEAM_ID="${IOS_TEAM_ID:-2S2MY5X9B9}"
IOS_DIR="ios/App"
ARCHIVE_PATH="${IOS_DIR}/build/App.xcarchive"
EXPORT_PATH="${IOS_DIR}/build/export"
EXPORT_OPTIONS="${IOS_DIR}/ExportOptions.plist"

# ───────────────────────────────────────────────────────────────────────
# Preflight — fail fast with actionable errors.
# ───────────────────────────────────────────────────────────────────────
require_var() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "[ios-upload] ERROR: $name not set. See header of this script." >&2
    exit 1
  fi
}

require_var ASC_KEY_ID
require_var ASC_ISSUER_ID

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "[ios-upload] ERROR: xcodebuild not on PATH. Install Xcode." >&2
  exit 1
fi

if ! security find-identity -v 2>/dev/null | grep -qE "Apple Distribution|iPhone Distribution"; then
  echo "[ios-upload] ERROR: no Apple Distribution certificate in keychain." >&2
  echo "  Fix: open ios/App/App.xcodeproj in Xcode, Product → Archive →" >&2
  echo "  Distribute App → App Store Connect. Xcode generates the cert" >&2
  echo "  automatically the first time. Then re-run this script." >&2
  exit 1
fi

# ───────────────────────────────────────────────────────────────────────
# Optional build-number bump. App Store rejects duplicate builds.
# ───────────────────────────────────────────────────────────────────────
if [ "${BUMP_BUILD:-0}" = "1" ]; then
  INFO_PLIST="${IOS_DIR}/App/Info.plist"
  CURRENT_BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST")
  NEXT_BUILD=$((CURRENT_BUILD + 1))
  /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEXT_BUILD" "$INFO_PLIST"
  echo "[ios-upload] CFBundleVersion bumped: $CURRENT_BUILD → $NEXT_BUILD"
fi

# ───────────────────────────────────────────────────────────────────────
# Build web assets + sync into Xcode project.
# ───────────────────────────────────────────────────────────────────────
echo "[ios-upload] Building web bundle…"
npm run build

echo "[ios-upload] Syncing into iOS project…"
npx cap sync ios

# ───────────────────────────────────────────────────────────────────────
# Write ExportOptions.plist if not present. Targets App Store Connect.
# ───────────────────────────────────────────────────────────────────────
if [ ! -f "$EXPORT_OPTIONS" ]; then
  cat > "$EXPORT_OPTIONS" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>${IOS_TEAM_ID}</string>
  <key>signingStyle</key><string>automatic</string>
  <key>destination</key><string>export</string>
  <key>uploadSymbols</key><true/>
  <key>stripSwiftSymbols</key><true/>
</dict>
</plist>
EOF
  echo "[ios-upload] Wrote $EXPORT_OPTIONS"
fi

# ───────────────────────────────────────────────────────────────────────
# Archive.
# ───────────────────────────────────────────────────────────────────────
rm -rf "$ARCHIVE_PATH" "$EXPORT_PATH"
echo "[ios-upload] Archiving…"
xcodebuild \
  -project "${IOS_DIR}/App.xcodeproj" \
  -scheme "$IOS_SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  archive

# ───────────────────────────────────────────────────────────────────────
# Export to .ipa.
# ───────────────────────────────────────────────────────────────────────
echo "[ios-upload] Exporting .ipa…"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -allowProvisioningUpdates

IPA_PATH=$(find "$EXPORT_PATH" -name "*.ipa" -maxdepth 2 | head -1)
if [ -z "$IPA_PATH" ]; then
  echo "[ios-upload] ERROR: export succeeded but no .ipa file found at $EXPORT_PATH" >&2
  exit 1
fi
echo "[ios-upload] IPA: $IPA_PATH"

# ───────────────────────────────────────────────────────────────────────
# Upload to App Store Connect via altool. The API key file is expected
# at ~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8 (altool picks
# it up automatically when --apiKey is the key ID alone).
# ───────────────────────────────────────────────────────────────────────
echo "[ios-upload] Uploading to App Store Connect…"
xcrun altool --upload-app \
  --type ios \
  --file "$IPA_PATH" \
  --apiKey "$ASC_KEY_ID" \
  --apiIssuer "$ASC_ISSUER_ID"

echo "[ios-upload] ✓ Upload submitted. Track processing at"
echo "  https://appstoreconnect.apple.com/apps"
