# System Requirements - Cali Quake Relief System

## 1. Problem Statement

After an earthquake in Cali, emergency teams and neighbors need one clear board to check damaged buildings and find people who need help first. Complex spreadsheets slow down rescue decisions and confuse everyday citizens.

## 2. System Vision

Build a simple, fast, traffic-light relief board in Vanilla JavaScript so clear that even a child can understand the color lights:

- **Green Light**: Safe or standard help.
- **Yellow Light**: Caution, check soon, or minor repair needed.
- **Red Light**: Danger or urgent help right now.

## 3. Core Scope

### 3.1 Six City Sectors

The system monitors six equal city sectors:

1. `economy` - Shops, markets, and local work.
2. `health` - Hospitals, clinics, and medical aid.
3. `infrastructure` - Roads, bridges, water, and power.
4. `education` - Schools and learning centers.
5. `logistics` - Food, water delivery, and supply trucks.
6. `housing` - Homes, apartments, and safe shelters.

### 3.2 UDGR Building Inspections & Insurance Claims

- Inspect both **housing** and **commercial** properties.
- Assign a clear traffic-light safety grade (`green`, `yellow`, `red`) from structural damage (`none`, `minor`, `moderate`, `severe`, `collapse`).
- Route each building to the correct insurance or public-aid path:
  - `insured` - Direct private insurance claim with UDGR report.
  - `mortgage` - Notify lender bank and trigger mandatory mortgage disaster policy.
  - `leasing` - Notify leasing company to activate asset protection and pause terms.
  - `uninsured` - Route to UDGR municipal relief fund and emergency housing aid.

### 3.3 Population Triage

- Classify every person into clear age brackets:
  - `<10` (`underTen`, ages 0 to 9)
  - `>10` (`youth`, ages 10 to 17)
  - `>=18` (`adult`, ages 18 to 59)
  - `>=60` (`senior`, ages 60 to 120)
- Track three care flags:
  - `hasDisability` (disability)
  - `isVulnerable` (vulnerable)
  - `hasSpecialNeeds` (special needs)
- Track three population groups with tailored authority protocols:
  - `civilian`
  - `military`
  - `prison`
- Calculate a priority score and traffic-light urgency (`red`, `yellow`, `green`) from `config/city-rules.yaml`.

## 4. Constraints & Quality Goals

- Built with pure Vanilla JavaScript, HTML, CSS, Markdown, and YAML (no third-party runtime libraries).
- Designed for Linux (Ubuntu/Mint) and cross-platform execution.
- 100% English across all code, docs, UI, and Git history.
- Strict Spec-Driven Development (SDD), Test-Driven Development (TDD), Clean Code, and SOLID design.
