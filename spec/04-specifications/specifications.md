# Technical Specifications - Cali Quake Relief System

## 1. Configuration Contract (`config/city-rules.yaml`)

All rules and constants live in `config/city-rules.yaml` and are parsed by `src/utils/yaml-parser.js`:

- `trafficLights`: `green`, `yellow`, `red` with `label`, `meaning`, `action`, `rank`.
- `sectors`: `economy`, `health`, `infrastructure`, `education`, `logistics`, `housing` with `label`, `description`.
- `propertyTypes`: `housing`, `commercial` with `label`.
- `damageLevels`:
  - `none` -> `trafficLight: green`, `isHabitable: true`, `needsEvacuation: false`
  - `minor` -> `trafficLight: green`, `isHabitable: true`, `needsEvacuation: false`
  - `moderate` -> `trafficLight: yellow`, `isHabitable: false`, `needsEvacuation: false`
  - `severe` -> `trafficLight: red`, `isHabitable: false`, `needsEvacuation: true`
  - `collapse` -> `trafficLight: red`, `isHabitable: false`, `needsEvacuation: true`
- `insuranceStatuses`:
  - `insured` -> direct insurer claim route
  - `mortgage` -> bank lender disaster policy route
  - `leasing` -> leasing company protection route
  - `uninsured` -> UDGR public relief fund route
- `ageBrackets`:
  - `underTen`: `minAge: 0`, `maxAge: 9`, `ruleTag: <10`, `score: 3`
  - `youth`: `minAge: 10`, `maxAge: 17`, `ruleTag: >10`, `score: 1`
  - `adult`: `minAge: 18`, `maxAge: 59`, `ruleTag: >=18`, `score: 0`
  - `senior`: `minAge: 60`, `maxAge: 120`, `ruleTag: >=60`, `score: 3`
- `vulnerabilityFlags`:
  - `hasDisability`: `score: 3`
  - `isVulnerable`: `score: 2`
  - `hasSpecialNeeds`: `score: 3`
- `populationGroups`:
  - `civilian`: `score: 0`, municipal UDGR civilian aid protocol
  - `military`: `score: 0`, military joint command medical/housing protocol
  - `prison`: `score: 1`, penitentiary secure-transfer protocol
- `triageThresholds`:
  - `red`: `minScore: 3`
  - `yellow`: `minScore: 1`
  - `green`: `minScore: 0`

## 2. Module Contracts

### 2.1 `src/utils/yaml-parser.js`
- `parseYaml(yamlText)` -> returns a nested JavaScript object parsed from 2-space indented YAML with string, number, and boolean scalar conversion.

### 2.2 `src/models/property-inspection.js`
- `class PropertyInspection(record, rules)`
  - Input `record`: `{ id, propertyName, sector, propertyType, damageLevel, insuranceStatus }`
  - Validation: throws `Error` if `propertyName` is blank or if `sector`, `propertyType`, `damageLevel`, or `insuranceStatus` is absent from `rules`.
  - Methods:
    - `getDamageAssessment()` -> `{ trafficLight, isHabitable, needsEvacuation, guidance }`
    - `getTrafficLight()` -> `'green' | 'yellow' | 'red'`
    - `getInsurancePlan()` -> `{ status, claimRoute, responsibleAgency, priorityTier, nextStep }`
    - `toSummary()` -> `{ id, propertyName, sector, propertyType, damageLevel, trafficLight, isHabitable, needsEvacuation, guidance, insurancePlan }`

### 2.3 `src/models/population-triage.js`
- `class PopulationTriage(record, rules)`
  - Input `record`: `{ id, fullName, sector, age, group, hasDisability, isVulnerable, hasSpecialNeeds }`
  - Validation: throws `Error` if `fullName` is blank, `sector` or `group` is absent from `rules`, or `age` is not a number between `0` and `120`.
  - Methods:
    - `getAgeBracket()` -> `{ key, label, ruleTag, minAge, maxAge, score }`
    - `getGroupProtocol()` -> `{ key, label, protocol, authority, score }`
    - `getActiveFlags()` -> array of active boolean flag keys
    - `getPriorityScore()` -> sum of age bracket score, active flag scores, and group score
    - `getTrafficLight()` -> `'red' | 'yellow' | 'green'`
    - `needsImmediateHelp()` -> boolean (`true` when traffic light is `'red'`)
    - `toSummary()` -> complete summary object including all computed fields

### 2.4 `src/services/city-analytics.js`
- `class CityAnalytics(rules)`
  - Methods:
    - `addPropertyInspection(inspection)` -> validates `instanceof PropertyInspection`, stores, returns summary
    - `addPopulationTriage(triage)` -> validates `instanceof PopulationTriage`, stores, returns summary
    - `clearAll()` -> empties stored collections
    - `getSectorStatus(sectorKey)` -> `{ sectorKey, label, description, trafficLight, redCount, yellowCount, greenCount, totalReports }`
    - `getAllSectorStatuses()` -> array of 6 sector status objects
    - `getCityTrafficLight()` -> highest severity light across all 6 sectors (`red` > `yellow` > `green`)
    - `getPropertyReport()` -> totals by traffic light, property type, insurance status, and `evacuationCount`
    - `getPopulationReport()` -> totals by traffic light, age bracket, group, care flags, and `total`
    - `getPriorityQueue()` -> triage summaries sorted by `priorityScore` descending
    - `getDashboardSnapshot()` -> combined state snapshot for the UI

### 2.5 `src/ui/traffic-light-view.js` & `src/app.js`
- `class TrafficLightView(documentRef, rules)` renders snapshots into the DOM without touching business logic.
- `class QuakeReliefApp(analytics, view, rules)` connects UI events, sample drill data, and analytics.
- Exports from `src/app.js`: `QuakeReliefApp`, `loadCityRules`, `createSampleDrill`, `bootstrapApp`.

## 3. UI & UX Contract (`index.html` & `styles.css`)

Required DOM Element IDs:
- City status: `city-light-badge`, `city-light-text`, `sector-grid`, `traffic-legend`
- Feedback & controls: `status-banner`, `load-drill-btn`, `clear-board-btn`
- Building form: `property-form`, `property-name`, `property-sector`, `property-type`, `property-damage`, `property-insurance`
- People form: `triage-form`, `person-name`, `person-sector`, `person-age`, `person-group`, `flag-disability`, `flag-vulnerable`, `flag-special-needs`
- Summary & lists: `property-summary`, `population-summary`, `property-list`, `priority-list`

Required Traffic-Light CSS Classes:
- `.light-green`, `.light-yellow`, `.light-red`

## 4. Test Coverage Matrix (`tests/quake-system.test.js`)

1. **Unit Tests**:
   - YAML parser accuracy against `config/city-rules.yaml`.
   - `PropertyInspection`: housing/commercial types, all 5 damage levels, all 4 insurance strategies, invalid input guards.
   - `PopulationTriage`: all 4 age brackets (`<10`, `>10`, `>=18`, `>=60`), all 3 care flags, all 3 population groups (`civilian`, `military`, `prison`), priority scoring, invalid input guards.
   - `CityAnalytics`: all 6 sectors, worst-case sector & city traffic lights, insurance & triage counts, priority queue ordering, reset behavior.
2. **UX Tests**:
   - `index.html` contains kid-friendly traffic-light legend, clear headings, labels for all inputs, and every required DOM ID.
   - `styles.css` defines accessible high-contrast `.light-green`, `.light-yellow`, and `.light-red` traffic-light rules.
   - `TrafficLightView` renders clear English labels and color classes for Green, Yellow, and Red states.
3. **Connection Tests**:
   - `config/city-rules.yaml` connects directly into `loadCityRules`, `PropertyInspection`, `PopulationTriage`, and `CityAnalytics`.
   - `bootstrapApp` wires mock DOM forms, buttons, `CityAnalytics`, and `TrafficLightView` end-to-end (submitting building + person forms, loading practice drill, and resetting board).
