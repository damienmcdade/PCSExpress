#!/bin/bash
# Build iOS app for App Store submission

set -e

echo "🔨 Building PCS Express iOS App..."
echo ""

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Step 1: Build web
echo "Step 1/4: Building web app..."
npm run build > /dev/null 2>&1
echo "✓ Web app built"

# Step 2: Sync to iOS
echo "Step 2/4: Syncing to iOS project..."
npx cap sync ios > /dev/null 2>&1
echo "✓ iOS project synced"

# Step 3: Check Xcode
echo "Step 3/4: Checking Xcode installation..."
if ! command -v xcodebuild &> /dev/null; then
  echo "✗ Xcode not found. Install from App Store: https://apps.apple.com/us/app/xcode/id497799835"
  exit 1
fi
echo "✓ Xcode found"

# Step 4: Info
echo "Step 4/4: Ready for Xcode"
echo ""
echo "📱 Next steps:"
echo ""
echo "1. Open Xcode:"
echo "   open ios/App/App.xcworkspace"
echo ""
echo "2. In Xcode:"
echo "   - Select 'App' target"
echo "   - General tab → Sign in with Apple ID"
echo "   - General tab → Set Team (your Apple ID)"
echo ""
echo "3. Test on simulator:"
echo "   Product → Run (⌘R)"
echo ""
echo "4. Create archive for App Store:"
echo "   Product → Destination → Generic iOS Device"
echo "   Product → Archive (⌘⇧B)"
echo "   Window → Organizer"
echo "   Select archive → Distribute App → App Store Connect"
echo ""
echo "✅ App is ready!"
