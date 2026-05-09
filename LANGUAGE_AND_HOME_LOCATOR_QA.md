# Language And Home Locator QA

## Language Fix
- Removed partial word-by-word translation because it created mixed English/non-English sentences that were hard to read.
- Replaced it with exact whole-label translations for navigation, controls, category labels, tab labels, and common app actions.
- Text that does not have an exact approved translation is left unchanged instead of being partially merged with another language.
- The selected onboarding language still sets page language and right-to-left direction for Arabic.

## Home Locator Fix
- Removed housing type/category selector cards from Home Locator.
- Removed square footage, bedroom, bathroom, and selected housing profile display from Home Locator.
- Kept only active official public housing links and official-source searches tied to the onboarding gaining installation or manual user entry.

## Official Housing Sources Used
- HOMES.mil / HEAT: https://www.homes.mil/homes/DispatchServlet/HomesEntry
- MilitaryINSTALLATIONS: https://installations.militaryonesource.mil/
- Army Housing Directory: https://home.army.mil/imcom/customers/housing-directory
- Navy Housing: https://ffr.cnic.navy.mil/Navy-Housing/
- Department of the Air Force Housing: https://www.housing.af.mil/
- DoD BAH rate lookup: https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/
