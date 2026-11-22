# Functional & Non-Functional Requirements List

## Functional Requirements (FR)

| ID | Area | Requirement Description |
| --- | --- | --- |
| FR-01 | Configuration | Load all city sectors, traffic lights, damage rules, insurance strategies, age brackets, care flags, group protocols, and thresholds from `config/city-rules.yaml`. |
| FR-02 | City Sectors | Track and display live status for all 6 sectors: `economy`, `health`, `infrastructure`, `education`, `logistics`, and `housing`. |
| FR-03 | UDGR Inspections | Register `housing` and `commercial` property inspections with damage grades (`none`, `minor`, `moderate`, `severe`, `collapse`). |
| FR-04 | Building Safety Light | Map each damage grade to a traffic light (`green`, `yellow`, `red`), `isHabitable`, and `needsEvacuation` using a dictionary lookup. |
| FR-05 | Insurance Claims | Route every inspected property through the matching claim strategy: `insured`, `mortgage`, `leasing`, or `uninsured`. |
| FR-06 | Age Brackets | Classify people into four non-overlapping age brackets matching `<10` (`0-9`), `>10` (`10-17`), `>=18` (`18-59`), and `>=60` (`60-120`). |
| FR-07 | Vulnerability Flags | Apply priority weights for `hasDisability`, `isVulnerable`, and `hasSpecialNeeds`. |
| FR-08 | Population Groups | Assign the correct response protocol and authority for `civilian`, `military`, and `prison` records. |
| FR-09 | Triage Traffic Light | Compute total priority score and map it to `red`, `yellow`, or `green` based on thresholds in `config/city-rules.yaml`. |
| FR-10 | City Analytics | Aggregate property reports, population reports, per-sector traffic lights, overall city traffic light, and a sorted rescue priority queue. |
| FR-11 | Traffic-Light UI | Provide a child-friendly traffic-light web dashboard (`index.html`, `styles.css`, `src/app.js`) with simple forms, color badges, practice drill loader, and reset button. |
| FR-12 | Input Validation | Reject unknown sectors, invalid damage levels, invalid insurance types, invalid groups, or out-of-range ages with clear error messages. |

## Non-Functional Requirements (NFR)

| ID | Category | Standard |
| --- | --- | --- |
| NFR-01 | Language | 100% simple English across folders, files, docs, code, comments, UI, and Git commits. |
| NFR-02 | Naming | `PascalCase` classes, `camelCase` functions/variables (booleans prefixed `is`/`has`/`needs`), `UPPER_SNAKE_CASE` constants, `kebab-case` folders/files. |
| NFR-03 | Simplicity | Zero `switch` statements, zero nested `if/else` statements, and every function strictly under 12 lines. |
| NFR-04 | SOLID | Strict Single Responsibility Principle per class and module, with Dependency Injection for rules and DOM references. |
| NFR-05 | Portability | Zero external npm dependencies; runs directly on Linux (Ubuntu/Mint), macOS, and Windows in modern browsers and Node.js. |
| NFR-06 | Verification | Unit, UX, and Connection tests in `tests/quake-system.test.js` must all pass cleanly. |
