# PCS Express - Complete Demo Walkthrough

## Quick Start

### Web/Browser
```bash
# Local
http://localhost:3001
# or deployed
https://your-pcs-express.railway.app

# Click "🎯 Demo" button in header
```

### Docker
```bash
docker run -e ANTHROPIC_API_KEY=sk-ant-... \
  -p 3001:3001 \
  pcs-express:demo

# Open http://localhost:3001
# Demo auto-opens on first visit
```

### iOS
```bash
open pcs-express/ios/App/App.xcodeproj
# Select simulator
# Product → Run (⌘R)
# Demo auto-opens on first launch
```

## Complete Feature Tour (18 Steps)

### Step 1: Welcome
**Content:** Introduction to PCS Express
**Action:** Next to continue

**What you'll learn:**
- PCS Express is an all-in-one military relocation assistant
- Five main features to explore
- This tour takes 5-10 minutes

---

### Step 2: Chat Assistant Introduction
**Content:** AI chat for PCS questions
**Action:** Click "Go to Chat" to navigate

**Then you can:**
- Ask "What is a PCS?"
- Ask "How long does it take?"
- Ask "What documents do I need?"
- Get instant military-specific answers

**On all platforms:**
- Web: Type in text box
- Docker: Same interface
- iOS: Native keyboard

---

### Step 3: Chat Examples
**Content:** Sample questions to try

Try these questions:
1. "What are the main steps in a PCS move?" (Timeline)
2. "How long does a typical PCS take?" (Duration)
3. "What documents do I need?" (Prep)
4. "How does BAH work?" (Allowances)

**Platform tip:**
- Web: Copy-paste from guide
- iOS: Type from keypad
- Docker: Same as web

---

### Step 4: Employment Tab Introduction
**Content:** Resume matching for jobs
**Action:** Click "Go to Employment"

**Two features:**
1. **Match Resume** - Analyze fit (0-100%)
2. **Refine Resume** - AI rewrites it

**Perfect for:**
- Job hunting during/after PCS
- Career transitions
- Proving qualifications

---

### Step 5: Resume Matching Details
**Content:** How to use resume matching

**Steps:**
1. Upload resume (PDF, TXT, DOC)
2. Paste job description
3. Click "🔍 Match Resume"
4. Get results:
   - Match %
   - Your strengths
   - Skill gaps
   - Improvements needed

**Result Example:**
```
Match: 78%
Strengths:
- 4+ years logistics experience ✓
- Leadership experience ✓
Gaps:
- No data analysis mentioned
- Budget management not highlighted
Recommendations:
- Add Power BI or Excel skills
- Highlight project budget numbers
```

---

### Step 6: Resume Refinement Details
**Content:** AI resume rewriting

**Steps:**
1. Upload same resume
2. Paste same job description
3. Click "✏️ Refine Resume"
4. Download refined version

**What AI does:**
- Rewrites with better keywords
- Highlights relevant experience
- Uses stronger action verbs
- Improves job match

**Platform tips:**
- **Web:** Download button saves instantly
- **Docker:** Same download capability
- **iOS:** Share via AirDrop or email

---

### Step 7: Daycare Tab Introduction
**Content:** Find family childcare
**Action:** Click "Go to Daycare"

**Search by:**
- Installation (Fort Bragg, JBSA-San Antonio, Ramstein)
- City name
- Region

**Get information about:**
- On-base CDC centers
- Civilian daycare options
- Military benefits
- Family resources

---

### Step 8: Daycare Resources Explained
**Content:** What you'll find in results

**Information provided:**
- Facility Types: CDC, FCC, civilian
- Cost range: $/month by rank
- Benefits: Subsidies, FSA, backup care
- Tips: When to search, what to check

**To use:**
1. Enter "Fort Bragg" (example)
2. Click "🔍 Search"
3. AI provides location-specific guidance
4. Shows military benefits available

**Search results show:**
- Available options at that base
- Cost estimates
- Family support resources
- Enrollment tips

---

### Step 9: Checklist Features
**Content:** Track your PCS tasks
**Action:** Click "Go to Checklist"

**Before You Move:**
- ☐ Notify chain of command
- ☐ Gather medical records
- ☐ Update driver's license
- ☐ Arrange household shipment
- ☐ Schedule home inspection

**After You Arrive:**
- ☐ In-process at new unit
- ☐ Register with housing
- ☐ Enroll kids in school
- ☐ Update military ID
- ☐ Attend newcomer's brief

**Features:**
- Check off items (saves in browser)
- Print for reference
- Monthly reminders (set on your phone)

---

### Step 10: FAQ Resource
**Content:** Quick answers
**Action:** Click "Go to FAQ"

**Questions answered:**
- "How long does PCS take?" → 30-60 days
- "What is BAH?" → Housing allowance
- "Can I refuse?" → Usually mandatory
- "School records?" → Request transcripts

**Use when:**
- Need quick answer
- No time for chat
- Familiar with PCS process

---

### Step 11: Web/Browser Platform Guide
**Content:** Using on desktop or mobile browser

**Access points:**
- Local: `http://localhost:3001`
- Deployed: `https://your-app.railway.app`
- Mobile browser: Full responsive design

**Best for:**
- Resume file uploads
- Downloading refined resumes
- Detailed searches
- Large screen usage

**Features available:**
- All 5 tabs functional
- File upload for resumes
- Download buttons
- Copy-paste results
- Chat history preserved

---

### Step 12: Docker Container Platform Guide
**Content:** Running in a container

**Quick start:**
```bash
docker pull pcs-express:latest
docker run -e ANTHROPIC_API_KEY=sk-ant-... \
  -p 3001:3001 \
  pcs-express:latest
```

**Access:** `http://localhost:3001`

**Best for:**
- Teams sharing a server
- Consistent environment
- Automatic restarts
- No local setup needed

**Features:**
- Same as web version
- Persistent across restarts
- Scalable deployment
- Easy to update

---

### Step 13: iOS App Platform Guide
**Content:** Native iPhone/iPad app

**Setup:**
```bash
open pcs-express/ios/App/App.xcodeproj
# Select simulator/device
Product → Run (⌘R)
```

**Best for:**
- Mobile-first users
- On-the-go access
- Integration with iOS features
- AirDrop file sharing

**iOS-specific features:**
- Native keyboard
- Files app access
- Share results button
- App icon (military-themed)
- Notification support
- Offline partial support

---

### Step 14: Deployment & Infrastructure
**Content:** Getting to production

**Railway (recommended for beginners):**
1. Connect GitHub repo
2. Set `ANTHROPIC_API_KEY`
3. Push to `main`
4. Auto-deploys in 2-3 minutes
5. URL: `https://your-app.railway.app`

**GitHub Actions:**
- Auto-builds Docker image
- Tests before deployment
- Pushes to Docker Hub
- CI/CD pipeline included

**iOS App Store:**
- Xcode build ready
- Testflight available
- App Store ready (with signing)

---

### Step 15: Pro Tips for All Users
**Content:** Best practices

**General tips:**
- Start with Chat tab for questions
- Use Employment tab 2-3 months before move
- Search Daycare 3-6 months early
- Check Checklist monthly
- Save FAQ for quick reference

**Platform-specific tips:**
- **Web:** Upload files for batch processing
- **Docker:** Deploy for team use
- **iOS:** Use while traveling
- **Mix platforms:** Sync results via email/cloud

**Military-specific tips:**
- Military OneSource has free counseling
- Most bases offer PCS support
- Family readiness groups help
- Housing office handles relocation
- TMO (Transportation Management Office) plans moves

---

### Step 16: Resume Matching Example
**Content:** Interactive demo

**Pre-loaded example:**
- Resume: Military logistics specialist
- Job: Supply chain analyst
- Expected match: 75-85%

**Click "Load Example" to:**
1. Populate Employment tab
2. See sample resume
3. See sample job description
4. Try Match/Refine buttons

**What happens:**
- Analyze button works with sample data
- Refine button shows AI rewriting
- Download refined version
- Learn from results

---

### Step 17: Daycare Search Example
**Content:** Interactive demo

**Pre-loaded example:**
- Location: Fort Bragg
- Shows typical daycare info
- Demonstrates AI responses

**Click "Load Example" to:**
1. Go to Daycare tab
2. Pre-fill search
3. See results format
4. Understand facility types

**What you learn:**
- What to expect from search
- Types of info available
- How to interpret results
- Where to go next

---

### Step 18: Tour Complete
**Content:** Summary and next steps

**What you learned:**
✓ Chat assistant for questions
✓ Resume matching for jobs
✓ Daycare resource finder
✓ PCS checklist tracker
✓ FAQ quick reference

**Next steps:**
1. Explore each tab
2. Try the chat assistant
3. Upload your resume
4. Search daycare near you
5. Deploy to Railway or iOS

**Documentation:**
- `CRASH_FIXES.md` - Technical details
- `RAILWAY_DEPLOY.md` - Deployment guide
- `XCODE_BUILD_GUIDE.md` - iOS building
- `GITHUB_ACTIONS_SETUP.md` - CI/CD setup
- `DEMO_GUIDE.md` - Demo customization

---

## Interactive Demo Buttons

### During Tour
- **Back** - Previous step (disabled on first)
- **Action** - Context-specific (Go to Chat, Load Example, etc.)
- **Next** - Continue tour
- **Skip Tour** - Close anytime

### Progress
- Visual progress bar
- Step counter (e.g., 5/18)
- Smooth transitions

### Resume Matching Example
Sample data:
```
Resume:
John Doe | Military Logistics | 4 years experience

Job:
Supply Chain Analyst | Required: logistics, data analysis
```

Result: 78% match, 3 gaps, 5 recommendations

### Daycare Search Example
```
Search: Fort Bragg
Results: CDC options, costs, military benefits
```

---

## Demo Features by Platform

### Web Browser
- ✓ Full demo with all features
- ✓ File upload/download
- ✓ localStorage persistence
- ✓ Responsive mobile UI
- ✓ Copy-paste content

### Docker
- ✓ Same as web in container
- ✓ Persistent across restarts
- ✓ Team deployment ready
- ✓ No local installation needed

### iOS
- ✓ Native app experience
- ✓ Demo auto-opens first time
- ✓ Files app integration
- ✓ AirDrop sharing
- ✓ Keyboard shortcuts

---

## Measuring Demo Success

**You'll know the demo works if:**
1. ✓ Demo opens on first visit
2. ✓ All 18 steps load
3. ✓ Navigation buttons work
4. ✓ Tab changes work
5. ✓ Examples populate fields
6. ✓ Progress bar advances
7. ✓ All platforms (web/Docker/iOS)

**Users succeed if:**
1. ✓ Understand chat capability
2. ✓ Know how to use resume matching
3. ✓ Can search for daycare
4. ✓ Check items off checklist
5. ✓ Reference FAQ
6. ✓ Know how to deploy

---

## Customization Options

See `DEMO_GUIDE.md` for:
- Adding new tour steps
- Changing trigger conditions
- Custom styling
- Data persistence
- Analytics integration

---

## Troubleshooting Demo

**Demo won't open:**
```javascript
localStorage.removeItem('pcs-demo-shown')
// Refresh page
```

**Demo missing on iOS:**
- Clear app cache
- Reinstall from Xcode

**Steps not loading:**
- Check browser console
- Clear cache and reload
- Verify DemoTour.jsx exists

---

## Resources

- **Live demo:** Click 🎯 Demo button anytime
- **Documentation:** See files listed in Step 18
- **GitHub:** Full source code with comments
- **Support:** Military family resources included

Enjoy exploring PCS Express! 🚀
