# User Stories - Cali Quake Relief System

## Story 1: Child-Friendly City Overview

**As a** neighborhood helper or student,
**I want** to see a simple traffic-light board for all 6 parts of Cali,
**So that** I can tell in one glance which parts of the city are Green (safe), Yellow (wait and check), or Red (need help now).

### Acceptance Criteria
- All 6 sectors (`Economy`, `Health`, `Infrastructure`, `Education`, `Logistics`, `Housing`) appear on screen.
- A visible legend explains Green, Yellow, and Red in simple words.
- An overall city traffic light updates automatically whenever a report is added.

## Story 2: UDGR Building Safety & Insurance Check

**As a** UDGR field inspector,
**I want** to record a home or shop inspection with its damage level and insurance status,
**So that** families and business owners immediately know if the building is safe and which insurance or public-aid step to take next.

### Acceptance Criteria
- Accepts `housing` and `commercial` property types.
- Maps damage levels (`none`, `minor`, `moderate`, `severe`, `collapse`) to `green`, `yellow`, or `red`, plus habitability and evacuation flags.
- Displays the exact claim pathway for `insured`, `mortgage`, `leasing`, or `uninsured`.

## Story 3: Population Priority Triage

**As an** emergency triage coordinator,
**I want** to register each affected person with their age, care flags, and group (`civilian`, `military`, or `prison`),
**So that** young children (`<10`), older adults (`>=60`), and people with disabilities, vulnerability, or special needs receive urgent Red-light care first.

### Acceptance Criteria
- Automatically assigns the correct age bracket (`<10`, `>10`, `>=18`, `>=60`).
- Adds priority weight for `hasDisability`, `isVulnerable`, and `hasSpecialNeeds`.
- Attaches the right authority protocol for `civilian`, `military`, and `prison`.
- Places Red-light people at the very top of the live priority queue.

## Story 4: One-Click Practice Drill & Reset

**As a** teacher or city volunteer,
**I want** a button to load sample Cali earthquake data and a button to clear the board,
**So that** anyone can practice using the relief board safely in seconds.

### Acceptance Criteria
- Clicking **Load Practice Drill** populates realistic building and people examples across all 6 sectors.
- Clicking **Clear Board** resets all counters and returns every sector light to Green.
