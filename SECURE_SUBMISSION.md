# 🔐 Secure App Store Submission

Your app has been set up for **secure, automated submission** to the Apple App Store.

## ⚠️ Security First

We do NOT store your Apple ID password. Instead, we use:
- ✓ Xcode's built-in credential management
- ✓ One-time sign-in prompts
- ✓ Encrypted storage by macOS Keychain
- ✓ No credentials saved to disk

---

## 🚀 Submission Steps (Run on Your Mac)

### Prerequisites
1. Apple Developer Account ($99/year)
   - Sign up: https://developer.apple.com/account

2. macOS with Xcode 15+
   ```bash
   # Verify Xcode is installed
   xcodebuild -version
   ```

3. Create App in App Store Connect
   - https://appstoreconnect.apple.com
   - Click "My Apps" → "+" → "New App"
   - Bundle ID: `com.pcsexpress.app`
   - Name: `PCS Express`

---

## 📋 Running the Submission Script

### On Your Mac:

1. **Clone or pull latest code:**
   ```bash
   cd ~/path/to/PCSExpress/pcs-express
   git pull origin main
   ```

2. **Run the automated submit script:**
   ```bash
   bash submit-to-appstore.sh
   ```

3. **When prompted:**
   - Enter your Apple ID (email)
   - Xcode will securely prompt for password
   - Password is **NOT stored** - only used for this session

4. **Script will:**
   - Build your web app
   - Sync to iOS
   - Create archive (1-2 min)
   - Validate app
   - Upload to App Store
   - Print success message

---

## 📱 After Upload

### Complete Metadata in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "Your App" → "Builds"
3. Your build should appear (may take 5-10 min)
4. Select your build
5. Fill in metadata:
   - ✓ Screenshots (1242x2208) - minimum 2
   - ✓ Description
   - ✓ Keywords
   - ✓ Support URL
   - ✓ Privacy Policy URL
   - ✓ Rating (Content Rating form)
6. Click "Submit for Review"

### Generate Screenshots

**Option 1: Use iOS Simulator**
```bash
# In Xcode
Product → Run (⌘R)
# Simulator opens
# Press Cmd+S to screenshot
# Save to Desktop
```

**Option 2: Use iPhone**
- Build to physical device
- Take screenshots with Power + Volume Up
- Email to yourself

**Required sizes:**
- iPhone 15 Pro Max: 1242x2208
- iPad Pro 12.9": 2048x2732

---

## ✅ Checklist Before Running Script

- [ ] Apple Developer Account active
- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.pcsexpress.app`
- [ ] Xcode installed and updated
- [ ] Internet connection available
- [ ] At least 5GB free disk space

---

## 🆘 Troubleshooting

### "xcrun: command not found"
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

### "Archive creation failed"
```bash
# Clean and try again
rm -rf build
bash submit-to-appstore.sh
```

### "Signing certificate error"
```bash
# Open Xcode and sign in with Apple ID
open ios/App/App.xcworkspace
# General tab → Account → Sign In
```

### "Upload failed: Invalid IPA"
- Check app doesn't reference invalid APIs
- Verify iOS 14+ compatibility
- Try submitting through Xcode Organizer:
  ```bash
  open ios/App/App.xcworkspace
  # Window → Organizer → [latest] → Distribute
  ```

---

## 📊 Timeline

| Action | Time |
|--------|------|
| Run submission script | 5-10 min |
| Apple processes build | 5-15 min |
| Complete metadata | 10-15 min |
| Submit for review | 1 min |
| Apple review | 24h - 5 days |
| **Total to App Store** | **~1-2 days** |

---

## 🎯 What Happens After Submit

1. **Apple Reviews Your App** (1-5 days)
   - Check functionality
   - Verify App Store guidelines
   - Check for malware

2. **You Receive Email:**
   - ✅ Approved → App goes live immediately
   - ❌ Rejected → Email explains why, you can fix and resubmit

3. **If Approved:**
   - App appears in App Store
   - Available to download by service members worldwide
   - Monitor reviews and ratings
   - Track downloads in App Store Connect Analytics

---

## 🔄 Future Updates

To submit an update:

```bash
# Make changes to app
git add . && git commit -m "Update for v1.1"
git push origin main

# Increment version in capacitor.config.json
# "version": "1.1.0"

# Run submission again
bash submit-to-appstore.sh
```

---

## ❓ Questions?

- **Capacitor docs**: https://capacitorjs.com/docs/ios
- **App Store guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Apple support**: https://developer.apple.com/support/

---

## ✨ You're Ready!

Your app is fully configured. Just run the script and you'll be in the App Store within 1-2 days!

```bash
bash submit-to-appstore.sh
```

Good luck! 🚀
