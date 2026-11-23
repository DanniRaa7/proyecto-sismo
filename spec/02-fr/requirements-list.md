# 02 - Functional & Non-Functional Requirements

## Functional Requirements (FR)

- **FR-01 (Dual-Verdict Property Inspection)**: Register `residential` and `commercial` properties with `occupantRole` (`owner`, `tenant`), `insuranceStatus` (`insured`, `mortgage`, `leasing`, `uninsured`), `inspectorRole` (`civilEngineer`, `architect`, `topographer`, `udgrOfficer`), `damageLevel` (`superficial`, `chronic`, `structural`), `habitabilityStatus` (`safe`, `atRisk`, `uninhabitable`), `evidencePhoto`, and `damageInventory`.
- **FR-02 (Insurance Claim Reconciliation)**: Cross-check both the engineer `damageLevel` and the UDGR `habitabilityStatus` before approving claims via Strategy Pattern (`insured`, `mortgage`, `leasing`, `uninsured`). Flag `uninsured` properties as high financial risk.
- **FR-03 (Population Triage & Ambulance Dispatch)**: Classify people across four age brackets (`<10`, `>10`, `>=18`, `>=60`), three care flags (`hasDisability`, `isVulnerable`, `hasSpecialNeeds`), and three population groups (`civilian`, `military`, `prison`). Expose `needsAmbulance()` when `hasSpecialNeeds` is active.
- **FR-04 (Public BI Dashboard & Citizen Search)**: Display real-time counts across all 6 city sectors (`economy`, `health`, `infrastructure`, `education`, `logistics`, `housing`), sector alerts, uninsured risk totals, ambulance needs, and a citizen property search bar.
- **FR-05 (Private Inspector Workspace)**: Provide a dedicated Private Inspector tab with simple forms for field evidence capture, UDGR evaluation, and citizen triage registration.

## Non-Functional Requirements (NFR - Automated Verification)

- **NFR-01 (Clean Code & Naming)**: 100% simple English across all files, docs, identifiers, and Git commits (`PascalCase`, `camelCase` with `is`/`has`/`needs` booleans, `UPPER_SNAKE_CASE`, `kebab-case`).
- **NFR-02 (Zero Code Smells)**: Automated static audit verifying zero `switch` statements, zero nested `if/else` blocks, and every function under 12 lines.
- **NFR-03 (TDD & Linux Portability)**: Automated `node --test` suite (`Unit`, `UX`, `Connection`) passing 100% before commits, running natively on Linux (Ubuntu/Mint) with rules externalized in `config/city-rules.yaml`.

## Git Issue Categories

- **Feature**: New user-story capability (example: `Feature: Reconcile engineer and UDGR verdicts for mortgage and leasing claims`).
- **Bug**: Wrong business-rule behavior (example: `Bug: Age 60 scored as adult instead of senior`).
- **Error**: Technical runtime or configuration error (example: `Error: Failed to load config/city-rules.yaml`).

## Team Tasks (5-6 Members)

1. **Task 1 (Config & SDD)**: Author `context/`, `spec/`, and `config/city-rules.yaml`.
2. **Task 2 (Property & Insurance)**: Implement TDD tests and `src/models/property-inspection.js`.
3. **Task 3 (Population Triage)**: Implement TDD tests and `src/models/population-triage.js`.
4. **Task 4 (Public BI Service)**: Implement TDD tests and `src/services/city-analytics.js`.
5. **Task 5 (Two-Tab Traffic-Light UI)**: Build `index.html`, `styles.css`, `src/ui/traffic-light-view.js`, and `src/app.js`.
6. **Task 6 (QA & Clean Code Audit)**: Verify Unit, UX, and Connection tests plus Clean Code rules.
