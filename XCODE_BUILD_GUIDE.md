# Xcode Build & Run Guide

## Prerequisites

1. **Xcode 15+**
   ```bash
   xcode-select --install
   ```

2. **iOS Simulator**
   - Xcode → Settings → Platforms → iOS
   - Download latest simulator

3. **Dependencies**
   ```bash
   cd pcs-express
   npm install
   npx cap add ios
   ```

## Open Project

```bash
cd pcs-express/ios/App
open App.xcodeproj
```

## Build Steps

1. **Select Target**
   - Product → Destination → iPhone 15 Pro Max (or preferred simulator)

2. **Configure Signing** (for physical device)
   - Select "App" target
   - General tab → Signing & Capabilities
   - Team: Select your Apple ID or "Sign to Run Locally"

3. **Build**
   - Product → Build (⌘B)
   - Or Run (⌘R) to build and launch

## Troubleshooting

### Build fails with "App.app not found"
```bash
cd pcs-express/ios/App
xcodebuild clean
xcodebuild -scheme App -configuration Debug build
```

### Simulator crashes on launch
- Close simulator: `xcrun simctl shutdown all`
- Restart: `open /Applications/Simulator.app`
- Or select new simulator in Xcode

### Missing CocoaPods dependencies
```bash
cd pcs-express/ios/App
pod install --repo-update
```

### Port 8100 already in use
```bash
lsof -i :8100
kill -9 <PID>
```

## Running on Device

1. Connect iPhone
2. Select device in Xcode (not simulator)
3. General tab:
   - Team: Select your Apple account
   - Bundle ID: com.yourcompany.pcsexpress
4. Product → Run

## Logs

**View device logs:**
```bash
# Connect device, then:
xcode-select -p
open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app
# Or: Window → Devices and Simulators → [Device] → View Device Logs
```

**Console output:**
- Xcode bottom panel (⌘⇧C)
- Scroll to see app logs

## Web Assets

App pulls from Express backend (port 3001).

**Local testing:**
```bash
npm start  # Starts at localhost:3001
# iOS app will connect to localhost:3001
```

**Remote deployment:**
Update `capacitor.config.json`:
```json
{
  "server": {
    "url": "https://your-railway-app.railway.app"
  }
}
```

Then rebuild:
```bash
npm run build
npx cap sync
# Rebuild in Xcode
```

## Performance

- Release build: Product → Scheme → Release
- Profile: Product → Profile (⌘I)
- Memory: Xcode → Debug → Memory Graph

## Common Build Settings

In Xcode → Build Settings:
- iOS Deployment Target: 14.0+
- Swift Language Version: 5.9+
- Minimum Deployment Target: 14.0
