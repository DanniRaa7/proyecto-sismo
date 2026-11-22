# Cali Quake Relief System - Project Structure

## Purpose (Simple Guide)

The **Cali Quake Relief System** is a simple traffic-light helper board for the city of Cali after an earthquake.
It helps city helpers answer two simple questions fast:

1. **Is this building safe?** (Green = Safe, Yellow = Be Careful, Red = Danger) and how should insurance or city aid help the owner?
2. **Who needs help first?** (Green = Safe, Yellow = Check Soon, Red = Help Now!) based on age, care needs, and group rules.

## Target Environment

- **Runtime**: Vanilla JavaScript (ES Modules, zero external packages)
- **Target OS**: Linux (Ubuntu/Mint) and any modern web browser or Node.js runtime
- **Formats**: Git, Markdown, YAML, HTML5, CSS3

## Folder Layout

```text
cali-quake-relief-system/
├── context/
│   └── project-structure.md          # High-level project map and architecture rules
├── spec/
│   ├── 01-requirement/
│   │   └── requirements.md           # High-level problem statement and system goals
│   ├── 02-fr/
│   │   └── requirements-list.md      # Numbered functional and non-functional requirements
│   ├── 03-user-stories/
│   │   └── user-stories.md           # Simple user stories with acceptance criteria
│   └── 04-specifications/
│       └── specifications.md         # Exact contracts, classes, rules, DOM IDs, and test matrix
├── config/
│   └── city-rules.yaml               # Single source of truth for all rules, weights, and labels
├── src/
│   ├── utils/
│   │   └── yaml-parser.js            # Zero-dependency parser for config/city-rules.yaml
│   ├── models/
│   │   ├── property-inspection.js    # UDGR building inspection and insurance claim strategy model
│   │   └── population-triage.js      # Population age, care flag, and group triage model
│   ├── services/
│   │   └── city-analytics.js         # Six-sector dashboard aggregator and priority queue service
│   ├── ui/
│   │   └── traffic-light-view.js     # Kid-friendly traffic-light DOM renderer
│   └── app.js                        # Application wiring, rules loader, and event controller
├── tests/
│   └── quake-system.test.js          # TDD Unit, UX, and Connection test suite
├── index.html                        # Simple traffic-light web interface
├── styles.css                        # Accessible high-contrast traffic-light styling
├── package.json                      # ES Module declaration and test script
└── .gitignore                        # Standard Git ignore rules
```

## Architecture & Clean Code Rules

1. **100% Simple English**: Every folder, file, symbol, comment, UI label, and Git commit uses simple English.
2. **Strict Naming**:
   - `PascalCase` for Classes (`PropertyInspection`, `PopulationTriage`, `CityAnalytics`)
   - `camelCase` for functions and variables (`isHabitable`, `hasDisability`, `needsEvacuation`)
   - `UPPER_SNAKE_CASE` for constants (`DEFAULT_RULES_PATH`, `TRAFFIC_LIGHT_ORDER`)
   - `kebab-case` for folders and files (`city-rules.yaml`, `property-inspection.js`)
3. **SOLID Single Responsibility**: Each file owns exactly one job.
4. **Zero Code Smells**:
   - No `switch` statements.
   - No nested `if/else` blocks (use Dictionary Lookups and Strategy Maps).
   - Every function stays under 12 lines.
5. **Single Source of Truth**: All city sectors, thresholds, insurance routes, age brackets, and triage weights live in `config/city-rules.yaml`.
