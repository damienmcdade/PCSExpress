# PCS Express iOS App - Quick Start

## 1. Prerequisites
- macOS 12+ with Xcode 15+
- Apple Developer Account ($99/year)
- CocoaPods (installed with Xcode)

## 2. Prepare Your App

### Step 1: Create App Icons
- Design or download a 1024x1024 PNG icon
- Tools: Figma, Canva, or AppIcon.co

### Step 2: Build Web Version
```bash
cd pcs-express
npm run build
```

### Step 3: Sync to iOS
```bash
npm run ios:build
```

Output: `✓ iOS build synced. Open with: open ios/App/App.xcworkspace`

## 3. Open in Xcode

```bash
npm run ios:open
```

Or manually:
```bash
open ios/App/App.xcworkspace
```

## 4. Configure for App Store

### In Xcode:

1. **Select Signing Team**
   - Click "App" target
   - General tab
   - Team dropdown → Select your Apple ID
   - Xcode auto-creates signing certificate

2. **Set Bundle ID** (optional)
   - General → Bundle Identifier
   - Default: `com.pcsexpress.app`

3. **Update Version**
   - General → Version: 1.0.0
   - General → Build: 1

4. **Add App Icon**
   - Assets.xcassets → AppIcon
   - Drag your 1024x1024 PNG
   - Xcode auto-generates all sizes

## 5. Test on Simulator

```
Product → Destination → iPhone 15
Product → Run (⌘R)
```

Or on physical device:
```
Connect iPhone via USB
Product → Destination → [Your iPhone]
Product → Run (⌘R)
```

## 6. Create Test Build

```
Product → Destination → Generic iOS Device
Product → Archive (⌘⇧B)
Wait for "Archive Succeeded"
```

## 7. Upload to App Store

In Xcode Organizer:
```
Window → Organizer
Select Archive → Distribute App
App Store Connect → Automatic Signing → Upload
```

## 8. Complete Metadata in App Store Connect

https://appstoreconnect.apple.com

- Description
- Screenshots (1242x2208)
- Keywords
- Privacy Policy
- Support URL

## 9. Submit for Review

App Store Connect → Your App → Version → Submit for Review

Review takes 24 hours - 5 days.

---

## Build Commands Reference

```bash
# Rebuild web app after changes
npm run build

# Sync changes to iOS project
npm run cap:sync

# Open Xcode directly
npm run ios:open

# Full build pipeline
npm run ios:build && npm run ios:open
```

---

## Troubleshooting

### "Signing certificate error"
```
Xcode → Settings → Accounts
Manage Certificates → + → iOS Development
```

### "App crashes on launch"
- Check build logs in Xcode (⌘⇧K)
- Verify API endpoints use HTTPS
- Test in simulator first

### "Cannot find capacitor.config.json"
```bash
npx cap init "PCS Express" "com.pcsexpress.app" --web-dir dist
```

### "Build fails with architecture error"
- Product → Scheme → App
- Product → Destination → Generic iOS Device
- Product → Build Settings
- Search "ARCHS" → Set to `arm64`

---

## Next Steps

1. ✅ Build web version (`npm run build`)
2. ✅ Sync to iOS (`npm run ios:build`)
3. ✅ Add app icon
4. ✅ Test on simulator
5. ✅ Create test archive
6. ✅ Upload to App Store
7. ✅ Complete metadata
8. ✅ Submit for review

See `IOS_APPSTORE_GUIDE.md` for detailed instructions.
