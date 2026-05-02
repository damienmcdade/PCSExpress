# 📱 Submit Your App to the App Store - Complete Steps

Your app is built. Now submit it to the App Store in 4 simple steps.

---

## Step 1: Create Your App in App Store Connect (5 minutes)

**If you haven't already:**

1. Go to https://appstoreconnect.apple.com
2. Click **"My Apps"** (top left)
3. Click **"+"** button → **"New App"**
4. Fill in:
   - **Platform**: iOS
   - **Name**: PCS Express
   - **Bundle ID**: com.pcsexpress.app
   - **SKU**: pcsexpress-v1
   - **User Access**: Full Access
5. Click **"Create"**

Done! Your app is created in App Store Connect.

---

## Step 2: Create Archive in Xcode (5 minutes)

**Back in Xcode:**

1. Click **"Product"** (top menu)
2. Click **"Destination"** → **"Generic iOS Device"**
3. Click **"Product"** again
4. Click **"Archive"** (⌘⇧B)

Wait for it to finish. You'll see:
```
Archive succeeded
```

A window will open showing your archive. **Keep this window open.**

---

## Step 3: Upload to App Store (5 minutes)

**In the Archive window:**

1. Select your archive (should be highlighted)
2. Click **"Distribute App"** button (right side)
3. Choose **"App Store Connect"** (top option)
4. Click **"Next"**
5. Select **"Upload"** (not "Export")
6. Click **"Next"**
7. Select your **Team** (your Apple ID)
8. Check **"Automatically manage signing"** ✓
9. Click **"Next"**
10. Review and click **"Upload"**

Wait for:
```
Upload Successful
```

**Your app is now uploaded to App Store Connect!**

---

## Step 4: Complete Metadata & Submit (15 minutes)

**Go to App Store Connect:**
https://appstoreconnect.apple.com

### 4A: Add Screenshots

1. Find your app → Click it
2. Click **"Screenshots"** section
3. Click **"+"** to add screenshot
4. **Screenshot size**: 1242 x 2208 (iPhone 15 Pro Max)
5. Add 2-5 screenshots showing:
   - Main screen
   - Chat/AI feature
   - Any other key features

**How to get screenshots:**
- Back in Xcode: Product → Run
- In simulator: Press Cmd+S to screenshot
- Save to Desktop, then upload to App Store Connect

### 4B: Fill App Description

1. Click **"Description"** section
2. Fill in:
```
PCS Express provides AI-powered personalized guidance for U.S. military service members during their Permanent Change of Station (PCS) moves.

Get branch-aware checklists, base information, spouse resources, and real-time answers to your PCS questions powered by Claude AI.

Features:
- Personalized PCS guidance
- Military branch-specific information
- AI-powered Q&A
- Base relocation resources
```

### 4C: Add Keywords

1. Click **"Keywords"** section
2. Enter: `military, PCS, relocation, AI, military life`

### 4D: Add URLs

1. **Support URL**: https://pcsexpress-production.up.railway.app/
2. **Privacy Policy**: Create one or use: https://pcsexpress-production.up.railway.app/privacy

**If you need a privacy policy:**
- Use free template: https://termly.io (free tier)
- Or simple text: "We do not collect personal data. Questions sent to Anthropic's Claude API."

### 4E: Content Rating

1. Click **"General App Information"**
2. Click **"Content Rating"**
3. Fill out **Content Rating Questionnaire**
4. For PCS Express: Most answers will be "None" or "Infrequent/Mild"
5. Submit

### 4F: Add Build

1. Scroll down to **"Build"** section
2. Click **"Select a build"**
3. Your build should appear (may take 5-10 min after upload)
4. Select it

### 4G: Add Version Info

1. **Version Number**: 1.0.0
2. **Release Date**: Automatic (or pick date)
3. **What's New in This Version**: 
```
Initial release of PCS Express - AI-powered PCS guidance for military service members
```

---

## Step 5: Submit for Review (1 minute)

1. Scroll to bottom of page
2. Click blue **"Submit for Review"** button
3. Confirm submission

**Done!** 🎉

Your app is now:
- ✅ Submitted to Apple for review
- ✅ In the review queue
- ✅ Waiting for approval

---

## What Happens Next

### Review Timeline
- **24 hours - 5 days** (usually 1-2 days)
- Apple tests your app
- Checks functionality & safety
- Reviews App Store guidelines

### You'll Get Email

**If Approved ✅:**
- App goes live immediately
- Available in App Store
- Searchable by "PCS Express"
- Users can download for free

**If Rejected ❌:**
- Email explains why
- You fix and resubmit
- No penalty, just resubmit

### Monitor Status

App Store Connect → Your App → Version → Check status
- "Waiting for Review" → In queue
- "In Review" → Apple reviewing
- "Ready for Sale" → Approved! 🚀
- "Rejected" → Fix and resubmit

---

## Complete Checklist

Before submitting, verify:

```
BEFORE ARCHIVE:
☐ App runs without crashing in Xcode
☐ All features work
☐ No error messages

BEFORE UPLOAD:
☐ App created in App Store Connect
☐ Bundle ID matches: com.pcsexpress.app
☐ Archive successful in Xcode

BEFORE SUBMIT:
☐ 2-5 screenshots added (1242x2208)
☐ Description filled in
☐ Keywords added
☐ Support URL added
☐ Privacy Policy URL added
☐ Content Rating completed
☐ Build selected
☐ Version info filled in

SUBMITTING:
☐ Clicked "Submit for Review"
☐ Confirmation email received

AFTER SUBMIT:
☐ Monitor email for Apple response
☐ Check App Store Connect daily
☐ Celebrate when approved! 🎉
```

---

## Troubleshooting

### "Build doesn't appear in App Store Connect"
- Wait 10-15 minutes after upload
- Refresh the page
- It will appear

### "Need to create Privacy Policy"
- Go to: https://termly.io
- Free version available
- Answer questions, generate policy
- Publish on your website
- Add URL to App Store Connect

### "App Rejected"
- Check email for reason
- Make changes locally
- Create new Archive
- Upload new build
- Resubmit

### "Can't find Upload button"
- Make sure you selected your archive
- Click "Distribute App" button
- Select "App Store Connect"
- Click "Upload"

---

## After Approval

### Celebrate! 🎉
Your app is live in the App Store!

### Share
- Post on social media
- Email to service members
- Tell your network

### Monitor
- Check reviews daily
- Respond to user feedback
- Track downloads in Analytics

### Update
To submit version 2.0:
1. Make changes to your app
2. Increment version number
3. Create new Archive
4. Upload and submit same process

---

## Quick Reference

| Task | Time |
|------|------|
| Create archive | 5 min |
| Upload to App Store | 5 min |
| Add screenshots | 10 min |
| Fill metadata | 10 min |
| Submit for review | 1 min |
| **Apple review** | **1-5 days** |
| **App goes live** | **Within 48 hours** |

---

## Need Help?

- Apple Support: https://developer.apple.com/support/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Your GitHub repo: https://github.com/damienmcdade/PCSExpress

---

## You Did It! 🚀

Your PCS Express app is on its way to the App Store!

**Timeline:**
- Today: Submit for review
- Tomorrow-Friday: Apple reviews (usually 1-2 days)
- Within 48 hours: App goes live

Service members will be able to download your app!
