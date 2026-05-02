#!/bin/bash

echo "🔧 Setting up PCS Express iOS Project"
echo "======================================"
echo ""

# Step 1: Navigate to project
echo "Step 1: Navigating to project..."
cd ~/path/to/PCSExpress/pcs-express
# Replace ~/path/to/PCSExpress with your actual path

# Step 2: Install CocoaPods (if not already installed)
echo "Step 2: Installing CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo "  Installing CocoaPods (this may take a few minutes)..."
    sudo gem install cocoapods
    echo "  ✓ CocoaPods installed"
else
    echo "  ✓ CocoaPods already installed"
fi

# Step 3: Navigate to iOS app directory
echo "Step 3: Installing iOS dependencies..."
cd ios/App
pod install --repo-update

# Step 4: Return to project root
echo "Step 4: Setup complete!"
cd ../..

# Step 5: Open Xcode
echo ""
echo "✅ Setup complete!"
echo ""
echo "Opening Xcode..."
open ios/App/App.xcworkspace

echo ""
echo "Next steps in Xcode:"
echo "1. Click 'App' target (left sidebar)"
echo "2. General tab → Team dropdown → Sign in with Apple ID"
echo "3. Product → Destination → iPhone 15 Pro Max"
echo "4. Product → Run (⌘R)"
