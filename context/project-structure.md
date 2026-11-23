# Project Structure: Cali Quake Relief System

Simple post-earthquake management platform built with Vanilla JavaScript, YAML configuration, Clean Code, and SOLID principles (Refactoring.guru).
Designed so even a child can understand the traffic-light status across two views: a **Public BI Dashboard** and a **Private Field Inspector Tool**.

## Project Tree

```text
cali-quake-relief/
│
├── context/                          # Global project context and architecture map
│   └── project-structure.md          # Folder tree, module roles, and coding rules
│
├── spec/                             # Spec-Driven Development (SDD) documentation
│   ├── 01-requirement/               # General problem statement and scope
│   │   └── requirements.md
│   ├── 02-fr/                        # Functional (FR), Non-Functional (NFR), Issues, Tasks
│   │   └── requirements-list.md
│   ├── 03-user-stories/              # Epics and 5-line User Stories
│   │   └── user-stories.md
│   └── 04-specifications/            # 5-field Technical Specs and test checklists
│       └── specifications.md
│
├── config/                           # Externalized YAML rules (zero magic literals)
│   └── city-rules.yaml               # Sectors, UDGR, engineer damage, insurance, triage rules
│
├── src/                              # Vanilla JavaScript source (Clean Code + SOLID)
│   ├── utils/                        # Pure reusable helpers
│   │   ├── board-storage.js          # Safe localStorage persistence for board reload recovery
│   │   ├── validators.js             # Input validation guards, unique IDs, and YAML schema checks
│   │   └── yaml-parser.js            # Zero-dependency YAML parser
│   ├── models/                       # Single-responsibility domain classes
│   │   ├── property-inspection.js    # Dual-verdict UDGR + Engineer inspection and claim reconciler
│   │   └── population-triage.js      # Age brackets, care flags, ambulance, and group triage
│   ├── services/                     # Business Intelligence (BI) analytics
│   │   └── city-analytics.js         # 6-sector metrics, ambulance counters, and claim search
│   ├── ui/                           # Presentation layer
│   │   └── traffic-light-view.js     # Two-tab Public BI and Private Inspector DOM renderer
│   └── app.js                        # Main controller, YAML loader, and event wiring
│
├── tests/                            # Test-Driven Development (TDD) suite
│   └── quake-system.test.js          # Unit, UX, and Connection tests
│
├── index.html                        # Two-tab traffic-light web interface
├── styles.css                        # High-contrast traffic-light styles
├── package.json                      # ES Module setup and test script
└── .gitignore                        # Git ignore rules
```

## Coding Rules (Clean Code & SOLID)

1. **100% Simple English**: Folders, files, docs, code, comments, UI, and Git commits.
2. **Strict Naming Conventions**:
   - `PascalCase` for Classes (`PropertyInspection`, `InsuranceClaimReconciler`, `PopulationTriage`)
   - `camelCase` for functions and variables (booleans start with `is`, `has`, `needs`)
   - `UPPER_SNAKE_CASE` for constants (`DEFAULT_RULES_PATH`, `URGENT_TRAFFIC_LIGHT`)
   - `kebab-case` for folders and files (`city-rules.yaml`, `property-inspection.js`)
3. **Zero Code Smells**: No `switch` statements, no nested `if/else` blocks (Strategy Pattern / Dictionary Lookups), and every function strictly under 12 lines.
4. **Target Environment**: Linux (Ubuntu/Mint), Git, Markdown, YAML, and zero runtime npm dependencies.
