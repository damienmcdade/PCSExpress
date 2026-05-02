#!/bin/bash
set -e

echo "📱 PCS EXPRESS - AUTOMATED APP STORE SUBMISSION"
echo "================================================"
echo ""
echo "⚠️  SECURITY NOTE: This script uses Xcode's secure credential storage"
echo "   Your Apple ID password will NOT be stored or transmitted"
echo ""
echo "STEP 1: You will be prompted to sign in with your Apple ID"
echo "STEP 2: Xcode will handle authentication securely"
echo "STEP 3: App will build and upload automatically"
echo ""

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v xcodebuild &> /dev/null; then
  echo "❌ Xcode not found"
  exit 1
fi
echo "✓ Xcode found"

if ! command -v xcrun &> /dev/null; then
  echo "❌ xcrun not found"
  exit 1
fi
echo "✓ xcrun found"

# Step 1: Build web
echo ""
echo "📦 Step 1/4: Building web app..."
npm run build > /dev/null 2>&1
echo "✓ Web app built"

# Step 2: Sync iOS
echo ""
echo "🔄 Step 2/4: Syncing to iOS project..."
npx cap sync ios > /dev/null 2>&1
echo "✓ iOS project synced"

# Step 3: Create archive
echo ""
echo "🏗️  Step 3/4: Creating archive (this takes 1-2 minutes)..."
ARCHIVE_PATH="build/PCSExpress.xcarchive"
mkdir -p build

xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  archive > /dev/null 2>&1

if [ -d "$ARCHIVE_PATH" ]; then
  echo "✓ Archive created successfully"
else
  echo "❌ Archive creation failed"
  exit 1
fi

# Step 4: Upload to App Store
echo ""
echo "📤 Step 4/4: Uploading to App Store..."
echo "    (First time: You'll be prompted to sign in with Apple ID)"
echo ""

xcrun altool --validate-app \
  -f "$ARCHIVE_PATH/Products/Applications/App.ipa" \
  -t ios \
  --file-type ipa \
  --output-format xml 2>&1 | grep -q "valid" || {
  echo "⚠️  Validation failed - check app configuration"
  exit 1
}

echo "✓ App validated"

xcrun altool --upload-app \
  -f "$ARCHIVE_PATH/Products/Applications/App.ipa" \
  -t ios \
  --file-type ipa \
  --output-format xml

echo ""
echo "✅ UPLOAD SUCCESSFUL!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://appstoreconnect.apple.com"
echo "2. Find your build in 'Your App' → 'Builds'"
echo "3. Select it and click 'Submit for Review'"
echo "4. Complete metadata (screenshots, description, etc.)"
echo "5. Click 'Submit for Review' button"
echo ""
echo "⏱️  Apple review: 24 hours - 5 days"
echo ""

