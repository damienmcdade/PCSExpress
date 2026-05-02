# 🚀 FINAL: Submit Your iOS App to App Store

Your PCS Express app is **100% ready**. Here's exactly what to do:

## Step 1: Create App in App Store Connect (5 minutes)

Go to: https://appstoreconnect.apple.com

1. Click **"My Apps"** (top left)
2. Click **"+"** button → **"New App"**
3. Fill in:
   - **Platform**: iOS
   - **Name**: PCS Express
   - **Bundle ID**: com.pcsexpress.app (must match exactly)
   - **SKU**: pcsexpress-v1
   - **User Access**: Full Access

4. Click **"Create"**

Wait for page to load. Your app is now created.

---

## Step 2: Upload Your Build (10 minutes)

**On your Mac**, open Terminal and run:

```bash
cd ~/path/to/pcs-express
bash submit-to-appstore.sh
```

Replace `~/path/to/pcs-express` with your actual path. Example:
```bash
cd ~/Desktop/PCSExpress/pcs-express
bash submit-to-appstore.sh
```

**When prompted:**
- Apple ID: `damienmcdade17@gmail.com`
- Password: Your Apple ID password (Xcode uses it securely, then forgets it)

The script will:
- ✓ Build your app (2 min)
- ✓ Create archive (1 min)
- ✓ Upload to App Store (3 min)
- ✓ Print "✅ UPLOAD SUCCESSFUL!"

---

## Step 3: Complete Metadata (15 minutes)

Back in App Store Connect:

1. Your build will appear in **"Builds"** section (wait 5-10 min)
2. Click your build → **"Select for testing"** → **"TestFlight"** (optional, or skip)
3. Go to **"App Information"** tab:
   - Category: **Lifestyle** or **Reference**
   - Privacy Policy: Add a URL (see below)
   - Support URL: Your website or `https://pcsexpress-production.up.railway.app`

4. Go to **"Pricing and Availability"**:
   - Price: **Free**
   - Regions: Select all or your target regions
   - Release: **Automatic** or **Manual**

5. Go to **"Version Information"**:
   - Version: **1.0.0**
   - Build: Select your build
   - Description:
     ```
     PCS Express provides AI-powered personalized guidance for U.S. military 
     service members during their Permanent Change of Station (PCS) moves.
     
     Get branch-aware checklists, base information, spouse resources, and 
     real-time answers to your PCS questions powered by Claude AI.
     
     Features:
     - Personalized PCS guidance
     - Military branch-specific information
     - AI-powered Q&A
     - Base relocation resources
     ```
   - Keywords: `military, PCS, relocation, AI, military life`
   - Support URL: (already set above)
   - Marketing URL: (optional)

6. Go to **"General App Information"** → Add Screenshots:
   - Need: 2-5 screenshots
   - Size: **1242 x 2208** (iPhone 15 Pro Max)
   - Tips:
     - Screenshot 1: Main app screen
     - Screenshot 2: Chat/AI feature
     - Screenshot 3: Help/resources
     - Include text captions showing features

   **To create screenshots:**
   ```bash
   # On your Mac:
   cd ~/path/to/pcs-express
   open ios/App/App.xcworkspace
   # Product → Run (⌘R)
   # In simulator: Cmd+S to screenshot
   # Save to Desktop, resize to 1242x2208
   ```

7. Go to **"Content Rating"**:
   - Fill out Content Rating Questionnaire
   - For PCS Express: Most likely all "None" or "Infrequent/Mild"

---

## Step 4: Submit for Review (1 minute)

1. Go back to your app version
2. Scroll to bottom
3. Click blue **"Submit for Review"** button
4. Confirm submission

**Done!** 🎉

---

## Privacy Policy (Required)

Create a simple privacy policy. Options:

**Option 1: Use a free template**
- https://termly.io/products/privacy-policy-generator/ (free tier)
- Select "Web App"
- Generate, publish on your website

**Option 2: Simple one-liner**
```
We do not collect or store any personal information. 
Your questions and responses are sent to Anthropic's Claude API 
and are subject to their privacy policy.
```

Add to: `https://yoursite.com/privacy` or `https://pcsexpress-production.up.railway.app/privacy`

---

## Timeline

| Step | Time |
|------|------|
| Create app in ASC | 5 min |
| Run submission script | 10 min |
| Complete metadata | 15 min |
| **Apple Review** | **1-5 days** |
| **App Live** | **~48 hours** |

---

## What Happens After Submit

**Apple Review Process (1-5 days):**
- They test your app
- Check functionality
- Verify it follows App Store guidelines
- Check for malware/security issues

**You'll get an email:**
- ✅ **Approved** → App goes live immediately
- ❌ **Rejected** → Email explains why, you fix and resubmit

**If Approved:**
- App appears in App Store
- Searchable by "PCS Express"
- Users can download for free
- You can monitor downloads & reviews in App Store Connect

---

## Complete Checklist

```
BEFORE RUNNING SCRIPT:
☐ Apple Developer account active
☐ App created in App Store Connect (Bundle ID: com.pcsexpress.app)

RUNNING SCRIPT:
☐ Terminal open on Mac
☐ Run: bash submit-to-appstore.sh
☐ Sign in with Apple ID when prompted
☐ Wait for "✅ UPLOAD SUCCESSFUL!"

AFTER UPLOAD:
☐ Go to App Store Connect
☐ Wait for build to appear (5-10 min)
☐ Add screenshots (2-5)
☐ Fill description, keywords, URLs
☐ Complete content rating
☐ Click "Submit for Review"

WAITING:
☐ Monitor email for Apple's response
☐ Check status in App Store Connect
☐ Review takes 1-5 days (usually 1-2)

LIVE:
☐ App appears in App Store
☐ Share link with service members!
```

---

## Quick Copy-Paste Commands

**1. Clone repo (if needed):**
```bash
git clone https://github.com/damienmcdade/PCSExpress.git
```

**2. Navigate and submit:**
```bash
cd PCSExpress/pcs-express
bash submit-to-appstore.sh
```

**3. Open Xcode to test/screenshot:**
```bash
cd PCSExpress/pcs-express
open ios/App/App.xcworkspace
```

---

## Support

Need help? Check:
- `SECURE_SUBMISSION.md` - Security details
- `IOS_APPSTORE_GUIDE.md` - Detailed reference
- `APPSTORE_CHECKLIST.sh` - Step-by-step checklist

Apple support: https://developer.apple.com/support/

---

## 🎯 You're Ready!

Your app is production-ready. Just:

1. Create app in App Store Connect
2. Run the submission script
3. Add screenshots & metadata
4. Submit for review

**That's it!** Your PCS Express app will be in the App Store within 1-2 days.

```bash
bash submit-to-appstore.sh
```

Good luck! 🚀
