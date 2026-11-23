# 04 - Technical Specifications

## SPEC-01: Dual-Verdict Property Inspection & Insurance Reconciliation

- **Who**: Civil Engineer, Architect, Topographer, UDGR Inspector, Insurance Analyst.
- **How**:
  - `PropertyInspection(record, rules)` validates `propertyName`, `sector`, `propertyType` (`residential`, `commercial`), `occupantRole` (`owner`, `tenant`), `insuranceStatus` (`insured`, `mortgage`, `leasing`, `uninsured`), and optional `inspectorRole`, `damageLevel` (`superficial`, `chronic`, `structural`), `habitabilityStatus` (`safe`, `atRisk`, `uninhabitable`), `evidencePhoto`, and `damageInventory`.
  - `recordInspection(details)` records or updates technical and UDGR findings.
  - `InsuranceClaimReconciler.reconcile(inspection, rules)` blocks payout with `isApproved: false` until `isInspectionComplete()` is `true`, then resolves via dictionary lookup in `rules.insuranceStatuses`.
- **Result**: Verified traffic-light status (`green`, `yellow`, `red`), `isHabitable`, `needsEvacuation`, `hasPhotoEvidence`, `isHighFinancialRisk`, and clear insurance action step naming the `owner` or `tenant` and responsible bank/insurer/UDGR fund.
- **Complements**: Evidence photo reference, damage inventory text, and occupant tenure verification.
- **Tests**:
  - *Unit*: Verify all 3 damage levels, all 3 UDGR habitability verdicts, both occupant roles, incomplete inspection blocking, and all 4 insurance strategies (`insured`, `mortgage`, `leasing`, `uninsured`).
  - *UX*: Verify Green/Yellow/Red badges and Private Inspector form labels render clearly.
  - *Connection*: Verify saved inspections update `CityAnalytics` sector cards, uninsured counters, and Public BI search results immediately.

## SPEC-02: Population Triage & Ambulance Dispatch

- **Who**: Emergency Health Operator and UDGR Coordinator.
- **How**:
  - `PopulationTriage(record, rules)` validates `fullName`, `sector`, `age` (`0..120`), `group` (`civilian`, `military`, `prison`), and care flags (`hasDisability`, `isVulnerable`, `hasSpecialNeeds`).
  - Computes age bracket (`<10`, `>10`, `>=18`, `>=60`), `needsAmbulance()` (`true` when `hasSpecialNeeds` is active), priority score, and traffic-light urgency from `config/city-rules.yaml`.
- **Result**: Accurate age classification, ambulance flag, authority protocol, and sorted rescue priority score.
- **Complements**: Accessibility notes (wheelchair, visual guide, ambulance-only transport, secure transfer).
- **Tests**:
  - *Unit*: Verify age boundaries (`0`, `9`, `10`, `17`, `18`, `59`, `60`, `120`), all 3 care flags, `needsAmbulance()`, and all 3 population groups.
  - *UX*: Verify triage cards display age tag, care flags, and `Ambulance Needed` badge clearly.
  - *Connection*: Verify `PopulationTriage` registrations update `CityAnalytics` ambulance counters and Public BI priority queue.

## SPEC-03: Public BI Dashboard & Private Inspector Interface

- **Who**: General Public (Public BI Tab) and Technical Inspectors (Private Inspector Tab).
- **How**:
  - `CityAnalytics(rules)` aggregates 6 sector traffic lights, sector alerts, property/insurance totals, ambulance totals, and `findPropertiesByQuery(query)`.
  - `TrafficLightView(documentRef, rules)` and `QuakeReliefApp` manage two tabs (`tab-public-btn`, `tab-private-btn`, `public-panel`, `private-panel`), practice drill loader, reset button, and citizen claim lookup (`claim-search-input`, `claim-search-results`).
- **Result**: Clean separation of Public BI monitoring and Private field evidence entry in one accessible traffic-light UI.
- **Complements**: Required DOM IDs (`city-light-badge`, `city-light-text`, `bi-kpi-grid`, `sector-grid`, `traffic-legend`, `status-banner`, `tab-public-btn`, `tab-private-btn`, `public-panel`, `private-panel`, `load-drill-btn`, `clear-board-btn`, `claim-search-input`, `claim-search-results`, `property-form`, `property-name`, `property-sector`, `property-type`, `property-occupant`, `property-insurance`, `property-inspector`, `property-damage`, `property-habitability`, `property-photo`, `property-inventory`, `triage-form`, `person-name`, `person-sector`, `person-age`, `person-group`, `flag-disability`, `flag-vulnerable`, `flag-special-needs`, `property-summary`, `population-summary`, `property-list`, `priority-list`) and CSS classes (`.light-green`, `.light-yellow`, `.light-red`).
- **Tests**:
  - *Unit*: Verify `CityAnalytics` 6-sector aggregation, uninsured high-risk count, ambulance count, and property search filtering.
  - *UX*: Verify all required DOM IDs, two-tab controls, traffic-light legend, and CSS classes exist and toggle cleanly.
  - *Connection*: Verify `config/city-rules.yaml` drives `bootstrapApp` end-to-end across both tabs.
