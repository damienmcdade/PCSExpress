# iOS App Store Submission Guide for PCS Express

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - Have your Apple ID ready

2. **macOS with Xcode** (free from App Store)
   - Xcode 15+
   - iOS SDK 17+

3. **App Store Connect account**
   - Automatically created with Developer account

---

## Step 1: Configure App Icons & Splash Screen

### App Icon
- Size: 1024x1024 PNG (square, no rounded corners)
- Save to: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Replace `Icon-App-*.png` files
- Must have no transparency on transparent background

### Create Icon Quickly
```bash
# Option 1: Use an online tool
https://www.appicon.co/

# Option 2: Use ImageMagick
convert logo-1024.png -resize 1024x1024 icon.png
```

### Splash Screen
- Size: 2732x2732 PNG
- Save to: `ios/App/App/Assets.xcassets/Splash.imageset/`
- Edit `ios/App/App/Assets.xcassets/Splash.imageset/Contents.json`

---

## Step 2: Update Bundle ID (Optional)

Current: `com.pcsexpress.app`

To change it:
```bash
# Edit capacitor.config.json
{
  "appId": "com.yourcompany.pcsexpress"
}

# Then rebuild
npx cap sync ios
```

---

## Step 3: Build for App Store

### Update Build Version
```bash
# Increment version in capacitor.config.json
{
  "version": "1.0.0"
}
```

### Sync Dependencies
```bash
cd pcs-express
npm run build
npx cap sync ios
```

### Open Xcode
```bash
open ios/App/App.xcworkspace
```

⚠️ **IMPORTANT**: Open `.xcworkspace`, NOT `.xcodeproj`

---

## Step 4: Configure in Xcode

1. **Select Target**: "App" (not "App Clip")
2. **General Tab**:
   - Bundle ID: `com.pcsexpress.app`
   - Version: `1.0.0`
   - Build: `1`
   - Supported Destinations: iPhone, iPad
   - Minimum iOS: 14.0

3. **Signing & Capabilities**:
   - Team: Select your Apple ID
   - Automatically manage signing ✓

4. **Build Settings**:
   - Search "Bitcode": Set to NO
   - Search "Build Active": Ensure Release selected

---

## Step 5: Test Build Locally

```bash
# In Xcode:
# 1. Product → Scheme → App
# 2. Product → Destination → Generic iOS Device
# 3. Product → Build (⌘B)

# Or via command line:
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -arch arm64 \
  -derivedDataPath build
```

---

## Step 6: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. **Platforms**: iOS
4. **Name**: PCS Express
5. **Bundle ID**: com.pcsexpress.app (must match)
6. **SKU**: pcsexpress-v1 (any unique ID)
7. **Full User Access**: No (unless team)

---

## Step 7: Fill App Store Metadata

### Required Info:
- **Name**: PCS Express
- **Subtitle**: Personalized PCS Guidance
- **Description**: 
  ```
  PCS Express provides AI-powered personalized guidance for U.S. military service members during their Permanent Change of Station (PCS) moves. Get branch-aware checklists, base information, spouse resources, and real-time answers to your PCS questions.
  ```
- **Keywords**: military, PCS, relocation, AI, military life
- **Category**: Lifestyle or Reference
- **Privacy Policy URL**: https://yoursite.com/privacy (create one)
- **Support URL**: https://yoursite.com/support

### Screenshots (2-5 per language)
- Size: 1242x2208 (iPhone 15 Pro Max)
- Show key features of the app
- Can use Simulator screenshots

### App Preview Video (Optional)
- Max 30 seconds
- Shows app in action

### Rating (Content Rating Questionnaire)
- Select appropriate ratings for content
- PCS Express: Likely just informational

---

## Step 8: Build for Distribution

### In Xcode:

1. **Update Version/Build**:
   - General → Version: 1.0.0
   - General → Build: 1

2. **Archive**:
   - Product → Destination → Generic iOS Device
   - Product → Archive
   - Wait for "Archive Succeeded"

3. **Distribute to App Store**:
   - Xcode → Window → Organizer
   - Select Archive
   - Click "Distribute App"
   - Select "App Store Connect"
   - Upload Options: Automatic Signing
   - Review & Upload

### Or via Command Line:
```bash
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -derivedDataPath build \
  -archivePath build/App.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build/ipa \
  -exportOptionsPlist ExportOptions.plist
```

---

## Step 9: Submit for Review

1. **App Store Connect** → Your App
2. **Build**: Select the build you uploaded
3. **Version Release**: Fill remaining info
4. **Review Information**:
   - Notes for Reviewers
   - Demo Account (if needed)
   - Contact Info
5. **Save**
6. **Submit for Review** (blue button)

---

## Step 10: Wait for Review

- **Timeline**: 24 hours - 5 days typically
- **Check Status**: App Store Connect → Your App → Activity
- **If Rejected**: Read feedback, fix, resubmit

---

## Common Issues & Fixes

### "Signing Certificate Not Found"
```
Xcode → Settings → Accounts → Manage Certificates
Click "+" → iOS Development Certificate
```

### "Incompatible Architecture"
- In Xcode Build Settings:
  - ARCHS = arm64
  - VALID_ARCHS = arm64

### "App crashes on launch"
- Check Capacitor config
- Verify API endpoints are HTTPS
- Test on iOS device via Xcode

### "Privacy Policy Required"
- Add privacy policy to your website
- URL format: https://yoursite.com/privacy

---

## After Launch

### Updates
```bash
# Increment version in capacitor.config.json
npm run build
npx cap sync ios
# Archive & submit same process
```

### Monitor
- App Store Connect → Analytics
- Reviews & Ratings
- Crash logs & performance

---

## Quick Checklist

- [ ] Apple Developer Account created
- [ ] App icon (1024x1024) ready
- [ ] Splash screen (2732x2732) ready
- [ ] App Store Connect entry created
- [ ] Metadata filled in
- [ ] Screenshots added
- [ ] Privacy policy URL ready
- [ ] Local build tested on device
- [ ] Archive created & uploaded
- [ ] Build processed in App Store Connect
- [ ] Version metadata completed
- [ ] Submitted for review
- [ ] Monitoring after approval

---

## Support

- Capacitor iOS docs: https://capacitorjs.com/docs/ios
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Xcode Help: Help → Xcode Help
