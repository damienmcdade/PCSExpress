# PCS Express - Interactive Demo Guide

## Demo Tour Overview

PCS Express includes an interactive guided tour that walks users through all features with platform-specific instructions.

### Starting the Demo

**Web/Browser:**
- Click the **🎯 Demo** button in the top-right corner of the header
- Tour automatically shows on first visit
- Can be reopened anytime by clicking Demo button

**Docker:**
```bash
docker run -e ANTHROPIC_API_KEY=sk-ant-... -p 3001:3001 pcs-express:latest
# Open http://localhost:3001
# Click 🎯 Demo button
```

**iOS:**
- Open app in Xcode
- Demo auto-runs on first launch
- Tap "🎯 Demo" in top-right to restart

## Tour Sections

### 1. Welcome (Step 1)
- Introduces PCS Express
- Overview of all-in-one PCS assistant
- Encourages navigation through tour

### 2. Chat Assistant (Steps 2-3)
**What it does:**
- AI-powered questions about PCS moves
- Practical military relocation advice
- Supports any PCS-related question

**Example questions:**
- "What are the main steps in a PCS move?"
- "How long does a PCS typically take?"
- "What documents do I need?"
- "How does BAH work?"

**Platform notes:**
- Web: Type in chat box, instant responses
- Docker: Same experience, hosted on server
- iOS: Native keyboard input

### 3. Employment Tab (Steps 4-6)
**Resume Matching:**
- Upload resume (PDF/TXT/DOC)
- Paste job description
- Get AI analysis with:
  - Match percentage (0-100%)
  - Strengths
  - Gaps to address
  - Recommendations

**Resume Refinement:**
- Upload same resume and job description
- AI rewrites resume for better alignment
- Download refined version instantly

**Platform-specific tips:**
- **Web:** Direct file upload, instant download
- **Docker:** Same as web, any file type
- **iOS:** Use Files app to access documents, share results via AirDrop

### 4. Daycare Tab (Steps 7-8)
**Search Features:**
- Enter installation name or city
- AI finds local daycare options
- Shows facility types, costs, benefits

**Information provided:**
- On-base CDC options
- Civilian daycare centers
- Military childcare subsidies
- Family resources
- Selection tips

**Platform notes:**
- **Web:** Search box with real-time results
- **Docker:** Same web experience
- **iOS:** Mobile-optimized search interface

### 5. Checklist Tab (Step 9)
**Two sections:**
- Before You Move (5 items)
- After You Arrive (5 items)

**Features:**
- Checkboxes to track progress
- Browser storage saves state
- Portable across sessions

### 6. FAQ Tab (Step 10)
**Quick answers:**
- Timeline of PCS moves
- Dislocation Allowance (BAH)
- Refusing orders
- School records

**Usage:**
- Click questions to expand
- No AI processing needed
- Instant reference

### 7. Platform Guides (Steps 11-13)
**Web/Browser:**
- Full-featured interface
- File uploads for resumes
- Download capabilities
- Responsive mobile design

**Docker:**
- Container deployment
- Run anywhere
- Auto-restart on crash
- Perfect for teams/servers

**iOS:**
- Native app experience
- All features work same
- File access via Files app
- Push notifications ready

### 8. Deployment (Step 14)
**Railway:**
1. Connect GitHub repo
2. Set ANTHROPIC_API_KEY
3. Push to main
4. Auto-deploys

**GitHub Actions:**
- Auto-builds Docker image
- Tests before deployment
- Pushes to Docker Hub

**iOS:**
- Xcode Cloud CI/CD
- App Store ready

### 9. Pro Tips (Step 15)
**Best practices:**
- Start with Chat for quick questions
- Use Employment 2-3 months before PCS
- Search Daycare 3-6 months early
- Check Checklist monthly
- Use FAQ for quick reference

**Platform mixing:**
- Web best for uploads
- Docker best for servers
- iOS best for mobile
- Sync across platforms via cloud

### 10. Interactive Examples (Steps 16-17)
**Resume Matching Example:**
- Pre-loaded sample resume
- Sample job description
- Shows 75-85% match expected
- Demonstrates matching feature

**Daycare Search Example:**
- Pre-populated Fort Bragg search
- Shows AI response format
- Demonstrates facility information

### 11. Conclusion (Step 18)
- Recap of all features
- Next steps
- Documentation links

## Tour Navigation

**Controls:**
- **Next →** - Continue to next step
- **← Back** - Return to previous step
- **[Action Button]** - Jump to feature or load example
- **Skip Tour** - Close demo anytime
- **✕** - Close demo modal

**Progress:**
- Visual progress bar shows completion
- Step counter (e.g., "5 / 18")
- Can skip ahead anytime

## Demo Data

### Sample Resume
```
John Doe
Military Logistics Specialist
4 years supply chain experience

Skills:
- Leadership
- Supply chain management
- Budgeting
- Team coordination
```

### Sample Job
```
Supply Chain Analyst

Requirements:
- 5+ years logistics experience
- Data analysis skills
- Problem-solving abilities
- Budget management

Preferred:
- Military logistics background
- Team leadership experience
```

### Sample Daycare Search
- Installation: Fort Bragg
- AI provides CDC options, costs, benefits
- Shows military family resources

## Browser Storage

**First Visit:**
- Demo opens automatically
- User preference stored: `localStorage.setItem('pcs-demo-shown', 'true')`

**Subsequent Visits:**
- Demo hidden
- User can click 🎯 Demo to restart

**Clear Demo:**
```javascript
localStorage.removeItem('pcs-demo-shown')
```

## Accessibility

**Keyboard Navigation:**
- Tab through buttons
- Enter to activate
- Escape to close (future enhancement)

**Screen Readers:**
- Semantic HTML structure
- ARIA labels on buttons
- Modal announced to screen readers

**Mobile:**
- Touch-friendly buttons
- Responsive modal (90% width)
- Readable on small screens

## Customization

### Add new steps:
Edit `DemoTour.jsx` DEMO_STEPS array:
```jsx
{
  id: 'unique-id',
  title: 'Step Title',
  description: 'What this feature does',
  content: 'How to use it on all platforms',
  highlight: null,
  action: 'Go to Chat',
}
```

### Change demo trigger:
- Auto-show: Modify `useEffect` in App.jsx
- Custom: Add new event listeners
- Persistent: Use database instead of localStorage

## Testing

**Manual testing:**
```bash
# Clear demo and restart
localStorage.removeItem('pcs-demo-shown')
# Refresh page
# Demo should auto-open
```

**All platforms:**
- Web: ✓ Demo works
- Docker: ✓ Works in container
- iOS: ✓ Works in Capacitor

## Metrics (Future)

Potential tracking:
- Demo completion rate
- Steps viewed
- Time per step
- Features used after demo
- Button clicks
- Platform distribution

## Future Enhancements

- [ ] Video tutorials for each feature
- [ ] Animated highlights on app elements
- [ ] Keyboard shortcuts (Escape to close)
- [ ] Multiple demo paths (beginner/advanced)
- [ ] Wizard mode with actual data input
- [ ] Localization for different languages
- [ ] Analytics dashboard
