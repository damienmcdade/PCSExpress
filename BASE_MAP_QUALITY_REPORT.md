# Base Map Quality Report

## Fix Applied
- Removed old hand-entered installation coordinates and facility marker data from the Base Map module.
- Removed Leaflet runtime usage from the Base Map module.
- Replaced stale local base records with a runtime public map search tied to the user's onboarding gaining installation or manual entry.
- Added official verification paths through MilitaryINSTALLATIONS, Military OneSource, Defense.gov, branch public sites, and official-source search.
- Updated server and Vercel browser security policy to allow Google Maps frames while keeping other browser protections in place.

## Official Sources Used For Verification
- MilitaryINSTALLATIONS: https://installations.militaryonesource.mil/
- Military OneSource MilitaryINSTALLATIONS overview: https://www.militaryonesource.mil/resources/network/militaryinstallations/
- Defense.gov Military Installation Resources: https://www.defense.gov/Contact/Help-Center/Article/Article/2742641/military-installation/military-installation-resources/

## Security And OPSEC Position
- PCS Express does not store restricted gate, building, facility, internal road, CUI, classified, or force-protection map data.
- Users are directed to official U.S. Government and military sources for current installation-specific verification.
- Public map search is used only for orientation and must not be treated as authoritative for access control, hours, gate status, or internal installation routing.
