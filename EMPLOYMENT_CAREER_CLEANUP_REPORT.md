# Employment Career Cleanup Report

Completed changes:
- Removed the old EmploymentModule static local job dataset.
- Removed the industry filter from Job Search.
- Removed search radius controls from Job Search.
- Removed obsolete skills and recommendations job matching panels.
- Added Employment and Career Center tabs: Job Search, Job Resources, Resume Assistance, Internships, Employment Education Workshops, Certifications, Mentorship, Spouse Preferred, Connections, LinkedIn Workshop, and Entrepreneurship.
- Replaced stale static job cards with live source links tailored to the gaining installation or remote options.
- Marked official, affiliated, and external resources clearly.
- Added language-managed employment UI so selected onboarding language does not blend partial English replacements inside this module.
- Confirmed app-wide language runtime remains exact-match only, which prevents broken mixed-language word replacement.
- Added selected-language generic fallback copy for category and demo descriptions that were previously falling back to English.
- Removed obsolete demo wording that referenced file uploads for resume matching.

Official and affiliated sources used:
- USAJOBS and USAJOBS Help Center
- Military OneSource, MySECO, SECO, and MSEP
- Department of Labor and CareerOneStop
- Department of State Virtual Student Federal Service
- Hiring Our Heroes
- American Corporate Partners
- U.S. Small Business Administration, VBOC, SCORE, and IVMF

Security note:
- This patch does not add document upload capability.
- Employment links open source sites directly; users should verify every external job posting at the source before applying.
