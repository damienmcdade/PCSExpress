# 🔨 Build PCS Express in Xcode - Complete Guide

Everything is ready. Follow these exact steps to build your app in Xcode.

---

## Step 1: Open Terminal on Your Mac

```bash
# Navigate to your project
cd ~/path/to/PCSExpress/pcs-express

# Open the iOS project in Xcode
open ios/App/App.xcworkspace
```

**Replace `~/path/to/PCSExpress`** with your actual path. Examples:
```bash
# If on Desktop
cd ~/Desktop/PCSExpress/pcs-express
open ios/App/App.xcworkspace

# If you cloned from GitHub
cd ~/Documents/PCSExpress/pcs-express
open ios/App/App.xcworkspace
```

Xcode will open automatically.

---

## Step 2: Wait for Xcode to Load (1-2 minutes)

Once Xcode opens:
- It will analyze the project
- Download dependencies (CocoaPods)
- Show "Indexing" at top
- **Wait for indexing to complete** (you'll see a checkmark)

⚠️ **DO NOT click anything while indexing**

---

## Step 3: Sign In with Your Apple ID (2 minutes)

1. Click the **"App"** target (left sidebar, under "Targets")
2. Click the **"General"** tab
3. Look for **"Signing & Capabilities"** section
4. Find the **"Team"** dropdown
5. Click dropdown and select **"Add an Account..."**
6. Enter your **Apple ID email**
7. Enter your **Apple ID password**
8. Xcode will create a signing certificate automatically

You should see:
```
Team: [Your Name] (Personal Team)
Bundle Identifier: com.pcsexpress.app
```

---

## Step 4: Choose Where to Build

### Option A: Build on iPhone Simulator (No Device Needed)

```
Product → Destination → iPhone 15 Pro Max
```

Then click:
```
Product → Run (⌘R)
```

**Simulator will launch and your app will open** - takes 2-3 minutes first time

### Option B: Build on Your Physical iPhone (Need Device + USB Cable)

1. **Connect your iPhone via USB cable**
2. Xcode will detect it
3. Go to:
   ```
   Product → Destination → [Your iPhone Name]
   ```
4. Click:
   ```
   Product → Run (⌘R)
   ```

**The app will install on your phone** - takes 2-3 minutes first time

---

## Step 5: Wait for Build to Complete

Xcode will show:
- "Building..." message
- Progress bar at top
- File-by-file compilation

**This takes 2-5 minutes the first time** (faster on subsequent builds)

You'll see in the bottom status bar:
```
Build Succeeded
```

---

## Step 6: App Launches! 🎉

Once build succeeds:
- **Simulator:** The app opens in the iPhone simulator
- **Physical iPhone:** The app installs and opens on your phone

You should see:
- "PCS EXPRESS" header
- Chat interface
- AI input box

---

## Testing the App

Once the app is running, test:

✅ **App loads without crashing**
- Screen displays
- No error messages
- Text is readable

✅ **Can interact with UI**
- Tap buttons
- Scroll content
- Type in input box

✅ **API calls work** (if WiFi available)
- Type a question
- Send to AI
- Get response back

---

## Common Issues & Fixes

### "No signing certificate found"
```
Xcode → Settings → Accounts
Click your Apple ID
Click "Manage Certificates"
Click "+" → "iOS Development"
Xcode creates certificate automatically
```

### "Module not found" error
```
Product → Clean Build Folder (⇧⌘K)
Product → Build (⌘B)
Wait for completion
```

### "Cannot find iPhone" (if using physical device)
```
1. Disconnect USB cable
2. Reconnect
3. Trust device on your iPhone
4. Product → Destination → [Your iPhone]
```

### Build takes forever (hanging)
```
Product → Clean Build Folder
Wait for completion
Product → Build again
```

### "Indexing" stuck
```
Xcode → Preferences → Locations
Click "Derived Data" folder (opens in Finder)
Delete everything in that folder
Restart Xcode
```

---

## Next Steps After Build Succeeds

### Option 1: Test More (Recommended)
- Test on simulator with different screen sizes
- Test on physical device if you have one
- Make sure app doesn't crash

### Option 2: Create Archive for App Store
Once you're confident the app works:

```
Product → Destination → Generic iOS Device
Product → Archive (⌘⇧B)
```

Then submit using:
```bash
bash submit-to-appstore.sh
```

See `SUBMIT_NOW.md` for full submission steps.

---

## Build Commands Reference

| Task | Command |
|------|---------|
| Open Xcode | `open ios/App/App.xcworkspace` |
| Clean build | Product → Clean Build Folder |
| Build for simulator | Product → Destination → iPhone 15 Pro Max, then Build |
| Run on simulator | Product → Run (⌘R) |
| Build for device | Product → Destination → [Your iPhone], then Build |
| Create archive | Product → Destination → Generic iOS Device, Product → Archive |
| View build log | View → Navigators → Show Report Navigator (⌘9) |

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Build | ⌘B |
| Run | ⌘R |
| Stop | ⌘. (period) |
| Clean | ⇧⌘K |
| Archive | ⌘⇧B |
| Open Console | ⇧⌘C |
| Toggle Simulator | ⌘1 |

---

## Troubleshooting Build Errors

**If you get an error:**

1. **Read the error message** at bottom of screen
2. **Click the error** - it shows which file has the problem
3. **Try Fix 1:** Clean and rebuild
   ```
   Product → Clean Build Folder
   Product → Build
   ```
4. **Try Fix 2:** Delete derived data
   ```
   Xcode → Preferences → Locations
   Click Derived Data folder
   Delete everything
   Restart Xcode
   ```
5. **Try Fix 3:** Resync iOS project
   ```bash
   cd ~/path/to/pcs-express
   npx cap sync ios
   open ios/App/App.xcworkspace
   ```

---

## After You Build Successfully

### To submit to App Store:
1. Follow `SUBMIT_NOW.md` instructions
2. Or run: `bash submit-to-appstore.sh`

### To make changes:
1. Edit files in `src/` folder
2. Rebuild:
   ```bash
   npm run build
   npx cap sync ios
   ```
3. Back in Xcode: Product → Run

### To share with testers:
1. Use TestFlight (in App Store Connect)
2. Or email .ipa file to testers
3. See `SUBMIT_NOW.md` for details

---

## Quick Command Copy-Paste

**1. Navigate to project:**
```bash
cd ~/Desktop/PCSExpress/pcs-express
```

**2. Open Xcode:**
```bash
open ios/App/App.xcworkspace
```

**3. In Xcode, select simulator and run:**
- Product → Destination → iPhone 15 Pro Max
- Product → Run (⌘R)

**Done!** Your app will build and launch in 2-5 minutes.

---

## Need Help?

If you get stuck:
1. Check the error message in Xcode
2. Try the fixes in "Troubleshooting Build Errors"
3. See `FIX_ENROLLMENT_TIMEOUT.md` if account issues
4. Contact Apple Support: https://developer.apple.com/support/

**You've got this!** 🚀
