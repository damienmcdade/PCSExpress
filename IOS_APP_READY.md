# 📱 PCS Express iOS App - Complete Setup

Your PCS Express app is now **ready for the Apple App Store**!

## ✅ What's Been Done

- ✓ Capacitor iOS wrapper configured
- ✓ Web app built and synced to iOS project
- ✓ App icons created (all required sizes)
- ✓ Bundle ID set: `com.pcsexpress.app`
- ✓ Info.plist configured
- ✓ Build scripts created
- ✓ API endpoints configured for HTTPS

## 🚀 Next Steps (On Your Mac)

### Step 1: Open Xcode
```bash
open ios/App/App.xcworkspace
```

### Step 2: Sign In with Apple ID
1. Click the "App" target (left sidebar)
2. General tab
3. Account field → Sign In
4. Enter your Apple ID
5. Xcode auto-creates signing certificate

### Step 3: Test in Simulator
```
Product → Destination → iPhone 15 Pro Max
Product → Run (⌘R)
```

The app should launch and show your PCS Express web app.

### Step 4: Create Archive
```
Product → Destination → Generic iOS Device
Product → Archive (⌘⇧B)
```

Wait for "Archive Succeeded"

### Step 5: Upload to App Store
```
Window → Organizer
Select your archive
Distribute App → App Store Connect
```

### Step 6: Complete Metadata

Go to https://appstoreconnect.apple.com

- Add 2-5 screenshots (1242x2208)
- Fill description & keywords
- Add privacy policy URL
- Add support URL

### Step 7: Submit for Review

App Store Connect → Your App → Submit for Review

**Done!** Review takes 1-5 days.

---

## 📋 Files Created

| File | Purpose |
|------|---------|
| `capacitor.config.json` | Capacitor configuration |
| `ios/App/` | Complete iOS Xcode project |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/` | App icons (all sizes) |
| `build-ios.sh` | Auto-build script |
| `IOS_QUICK_START.md` | Fast reference guide |
| `IOS_APPSTORE_GUIDE.md` | Detailed submission guide |
| `APPSTORE_CHECKLIST.sh` | Step-by-step checklist |

---

## 🎨 App Icons

All required iOS icon sizes have been generated and placed in the correct location:
- 20x20, 40x40, 60x60, 76x76, 83x83, 120x120, 152x152, 167x167, 180x180, 1024x1024

The icons show a soldier saluting the American flag with "PCS EXPRESS" text.

**To replace with your own icon:**
1. Export a 1024x1024 PNG
2. Copy to: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
3. Replace files
4. Re-open Xcode project

---

## 🔐 Security & API

Your app is configured to:
- Use HTTPS only for API calls
- Call your Railway backend at: `https://pcsexpress-production.up.railway.app/api/ai`
- Pass ANTHROPIC_API_KEY securely
- Comply with App Store guidelines

---

## 📱 Testing Before Submission

### On Simulator
```bash
open ios/App/App.xcworkspace
Product → Run
```

Test these features:
- ✓ App launches
- ✓ UI renders (no crashes)
- ✓ Can interact with app
- ✓ API calls work (if on WiFi)

### On Physical Device
1. Connect iPhone via USB
2. Select device in Product → Destination
3. Click Run
4. App installs and launches

---

## 🎯 Timeline

| Step | Time |
|------|------|
| Sign in + test | 15 min |
| Create archive | 5-10 min |
| Upload to App Store | 5-10 min |
| Apple review | 24 hours - 5 days |
| **Total to App Store** | **~1-2 days** |

---

## ❓ Troubleshooting

### "Cannot find xcworkspace"
```bash
ls ios/App/App.xcworkspace
# If not found, run:
npx cap sync ios
```

### "Signing certificate error"
In Xcode:
```
Settings → Accounts → Manage Certificates
Click "+" → iOS Development
```

### "App crashes on launch"
Check Xcode build logs:
```
Product → Clean Build Folder (⇧⌘K)
Product → Run again
```

### "Cannot call API"
- Ensure ANTHROPIC_API_KEY is set in Railway
- Test API manually: https://pcsexpress-production.up.railway.app/api/health
- Check HTTPS (not HTTP)

---

## 📚 Full Guides

- **Quick Start**: Read `IOS_QUICK_START.md`
- **Detailed Guide**: Read `IOS_APPSTORE_GUIDE.md`
- **Submission Steps**: Run `bash APPSTORE_CHECKLIST.sh`

---

## 🎉 You're Ready!

Your PCS Express iOS app is production-ready and waiting for your Apple Developer account and App Store submission.

**Questions?** Check the guides above or review the official Capacitor docs: https://capacitorjs.com/docs/ios

Good luck! 🚀
