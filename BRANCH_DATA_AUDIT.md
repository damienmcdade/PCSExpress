# Branch Data And Local Prompt Audit

## Findings
- The reusable status indicator displayed a local-device save prompt in multiple category tabs.
- Move Aid displayed every branch relief society in the full resource list after the selected-branch section.
- The Resources category could show Army-only portal cards to non-Army users.
- The Resources category family support fallback could show an Air Force-style support label to Space Force or Coast Guard users.
- Spiritual Readiness online fallback links showed every chaplain corps instead of filtering to the selected branch family.

## Fixes Applied
- Removed the visible local-device save prompt by making the old status indicator render nothing.
- Removed local-save wording from the default category description.
- Rebuilt Move Aid so it shows the selected branch relief organization plus universal PCS resources only.
- Added explicit family support resources for Army, Navy, Marine Corps, Air Force, Space Force, and Coast Guard.
- Filtered branch-only resource cards so users do not see another branch's portals or branch-only support cards.
- Filtered Spiritual Readiness online fallback links to the selected branch family plus universal resources.

## Verification
- A text scan is run after the patch to catch removed local-save prompts.
- A Move Aid scan is run after the patch to catch the old all-branch list rendering pattern.
- The application build is run after the patch.
