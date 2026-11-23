import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parseYaml } from '../src/utils/yaml-parser.js';
import { PropertyInspection, InsuranceClaimReconciler } from '../src/models/property-inspection.js';
import { PopulationTriage } from '../src/models/population-triage.js';
import { CityAnalytics } from '../src/services/city-analytics.js';
import { TrafficLightView } from '../src/ui/traffic-light-view.js';
import { loadCityRules, bootstrapApp } from '../src/app.js';

const ROOT_DIR = resolve(process.cwd());
const YAML_RULES_PATH = resolve(ROOT_DIR, 'config/city-rules.yaml');
const INDEX_HTML_PATH = resolve(ROOT_DIR, 'index.html');
const STYLES_CSS_PATH = resolve(ROOT_DIR, 'styles.css');

const EXPECTED_SECTORS = [
  'economy',
  'health',
  'infrastructure',
  'education',
  'logistics',
  'housing',
];

const EXPECTED_INSURANCE_ROUTES = [
  'Direct Insurance Payout',
  'Bank Mortgage Disaster Policy',
  'Bank Leasing Structural Policy',
  'UDGR Emergency Relief Subsidy',
];

const DEFAULT_PROPERTY_BASE = {
  id: 'prop-1',
  propertyName: 'La Luna Hotel',
  sector: 'economy',
  propertyType: 'commercial',
  occupantRole: 'owner',
  insuranceStatus: 'insured',
  inspectorRole: 'civilEngineer',
  damageLevel: 'structural',
  habitabilityStatus: 'atRisk',
  evidencePhoto: 'lobby-column.jpg',
  damageInventory: 'Front lobby column cracked',
};

const DEFAULT_TRIAGE_BASE = {
  id: 'person-1',
  fullName: 'Alice Carter',
  sector: 'health',
  age: 30,
  group: 'civilian',
  hasDisability: false,
  isVulnerable: false,
  hasSpecialNeeds: false,
};

const REQUIRED_DOM_IDS = [
  'city-light-badge',
  'city-light-text',
  'bi-kpi-grid',
  'sector-grid',
  'traffic-legend',
  'status-banner',
  'tab-public-btn',
  'tab-private-btn',
  'public-panel',
  'private-panel',
  'load-drill-btn',
  'clear-board-btn',
  'claim-search-input',
  'claim-search-results',
  'property-form',
  'property-name',
  'property-sector',
  'property-type',
  'property-occupant',
  'property-insurance',
  'property-inspector',
  'property-damage',
  'property-habitability',
  'property-photo',
  'property-inventory',
  'triage-form',
  'person-name',
  'person-sector',
  'person-age',
  'person-group',
  'flag-disability',
  'flag-vulnerable',
  'flag-special-needs',
  'property-summary',
  'population-summary',
  'property-list',
  'priority-list',
];

function readWorkspaceFile(filePath) {
  return readFileSync(filePath, 'utf8');
}

function loadParsedRules() {
  return parseYaml(readWorkspaceFile(YAML_RULES_PATH));
}

function createFakeFetch(yamlText, isOk = true) {
  return async () => ({
    ok: isOk,
    text: async () => yamlText,
  });
}

class MockStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return Object.hasOwn(this.store, key) ? this.store[key] : null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

class MockElement {
  constructor(id) {
    this.id = id;
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.attributes = {};
    this.listeners = {};
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  addEventListener(eventName, handler) {
    this.listeners[eventName] = handler;
  }

  trigger(eventName, eventPayload = {}) {
    const handler = this.listeners[eventName];
    return handler ? handler(eventPayload) : undefined;
  }

  reset() {
    this.value = '';
    this.checked = false;
  }
}

class MockDocument {
  constructor(ids) {
    this.elements = Object.fromEntries(
      ids.map((id) => [id, new MockElement(id)])
    );
  }

  getElementById(id) {
    return this.elements[id] || null;
  }
}

function createInspection(overrides, rules) {
  return new PropertyInspection({ ...DEFAULT_PROPERTY_BASE, ...overrides }, rules);
}

function createTriage(overrides, rules) {
  return new PopulationTriage({ ...DEFAULT_TRIAGE_BASE, ...overrides }, rules);
}

function fillPropertyForm(doc) {
  doc.getElementById('property-name').value = '44th & 9th Avenue Hotel';
  doc.getElementById('property-sector').value = 'housing';
  doc.getElementById('property-type').value = 'residential';
  doc.getElementById('property-occupant').value = 'tenant';
  doc.getElementById('property-insurance').value = 'mortgage';
  doc.getElementById('property-inspector').value = 'architect';
  doc.getElementById('property-damage').value = 'structural';
  doc.getElementById('property-habitability').value = 'uninhabitable';
  doc.getElementById('property-photo').value = 'roof-crack.jpg';
  doc.getElementById('property-inventory').value = 'Roof beam and kitchen wall';
}

function fillTriageForm(doc) {
  doc.getElementById('person-name').value = 'Noah Brooks';
  doc.getElementById('person-sector').value = 'education';
  doc.getElementById('person-age').value = '7';
  doc.getElementById('person-group').value = 'civilian';
  doc.getElementById('flag-disability').checked = false;
  doc.getElementById('flag-vulnerable').checked = false;
  doc.getElementById('flag-special-needs').checked = true;
}

describe('Unit Tests - YAML Parser and Rules Config', () => {
  it('parses all 6 city sectors and professor rule sections from YAML', () => {
    const rules = loadParsedRules();
    assert.deepEqual(Object.keys(rules.sectors), EXPECTED_SECTORS);
    assert.deepEqual(Object.keys(rules.damageLevels), ['superficial', 'chronic', 'structural']);
    assert.deepEqual(Object.keys(rules.habitabilityStatuses), ['safe', 'atRisk', 'uninhabitable']);
    assert.deepEqual(Object.keys(rules.occupantRoles), ['owner', 'tenant']);
  });

  it('parses booleans, numbers, inline comments, and rejects malformed YAML', () => {
    const rules = loadParsedRules();
    assert.equal(rules.habitabilityStatuses.uninhabitable.needsEvacuation, true);
    assert.equal(rules.ageBrackets.underTen.ruleTag, '<10');
    const inlineParsed = parseYaml('triageThresholds:\n  red:\n    minScore: 3 # urgent\n');
    assert.equal(inlineParsed.triageThresholds.red.minScore, 3);
    assert.throws(() => parseYaml('sectors:\n  broken line without colon\n'));
    assert.throws(() => parseYaml('   '));
  });
});

describe('Unit Tests - Dual-Verdict PropertyInspection and Insurance', () => {
  it('blocks payout when pending and marks uninspected building as yellow non-habitable', () => {
    const rules = loadParsedRules();
    const pendingHome = createInspection({ damageLevel: null, habitabilityStatus: null }, rules);
    const plan = InsuranceClaimReconciler.reconcile(pendingHome, rules);
    assert.equal(pendingHome.isInspectionComplete(), false);
    assert.equal(pendingHome.getTrafficLight(), 'yellow');
    assert.equal(pendingHome.getHabitabilityAssessment().isHabitable, false);
    assert.equal(plan.isApproved, false);
  });

  it('preserves prior engineer damage and evidence during two-step UDGR recordInspection', () => {
    const rules = loadParsedRules();
    const home = createInspection({ habitabilityStatus: null, evidencePhoto: 'beam.jpg' }, rules);
    home.recordInspection({ inspectorRole: 'udgrOfficer', habitabilityStatus: 'uninhabitable' });
    assert.equal(home.isInspectionComplete(), true);
    assert.equal(home.damageLevel, 'structural');
    assert.equal(home.evidencePhoto, 'beam.jpg');
    assert.equal(home.getTrafficLight(), 'red');
  });

  it('routes all four insurance statuses and flags uninsured high risk', () => {
    const rules = loadParsedRules();
    const statuses = ['insured', 'mortgage', 'leasing', 'uninsured'];
    const plans = statuses.map((insuranceStatus) =>
      createInspection({ insuranceStatus, occupantRole: 'tenant' }, rules).getInsurancePlan()
    );
    assert.deepEqual(plans.map((item) => item.claimRoute), EXPECTED_INSURANCE_ROUTES);
    assert.equal(plans[3].isHighFinancialRisk, true);
    assert.equal(plans[0].isHighFinancialRisk, false);
  });

  it('generates unique IDs in same millisecond and rejects null or overlong records', () => {
    const rules = loadParsedRules();
    const ids = [1, 2, 3].map(() => createInspection({ id: '' }, rules).id);
    assert.equal(new Set(ids).size, 3);
    assert.throws(() => new PropertyInspection(null, rules), /Invalid property record/);
    assert.throws(() => createInspection({ propertyName: 'A'.repeat(250) }, rules));
    assert.throws(() => createInspection({ sector: 'space' }, rules));
    assert.throws(() => createInspection({ habitabilityStatus: 'closed' }, rules));
  });
});

describe('Unit Tests - PopulationTriage and Ambulance Dispatch', () => {
  it('classifies all four age brackets (<10, >10, >=18, >=60) without gaps', () => {
    const rules = loadParsedRules();
    const tags = [5, 9, 10, 14, 18, 59, 60, 82].map((age) =>
      createTriage({ age }, rules).getAgeBracket().ruleTag
    );
    assert.deepEqual(tags, ['<10', '<10', '>10', '>10', '>=18', '>=18', '>=60', '>=60']);
  });

  it('sets needsAmbulance strictly for specialNeeds and scores care flags', () => {
    const rules = loadParsedRules();
    const ambulancePerson = createTriage({ hasSpecialNeeds: true }, rules);
    const wheelchairPerson = createTriage({ hasDisability: true }, rules);
    const vulnerablePerson = createTriage({ isVulnerable: true }, rules);
    assert.equal(ambulancePerson.needsAmbulance(), true);
    assert.equal(wheelchairPerson.needsAmbulance(), false);
    assert.equal(wheelchairPerson.getTrafficLight(), 'red');
    assert.equal(vulnerablePerson.getTrafficLight(), 'yellow');
  });

  it('applies civilian, military, and prison group protocols', () => {
    const rules = loadParsedRules();
    const civilian = createTriage({ group: 'civilian' }, rules);
    const military = createTriage({ group: 'military' }, rules);
    const prison = createTriage({ group: 'prison' }, rules);
    assert.equal(civilian.getTrafficLight(), 'green');
    assert.equal(military.getGroupProtocol().authority, 'Military Joint Command');
    assert.equal(prison.getGroupProtocol().authority, 'Penitentiary Authority');
    assert.equal(prison.getTrafficLight(), 'yellow');
  });

  it('rejects null, decimal ages, blank names, overlong text, and unknown groups', () => {
    const rules = loadParsedRules();
    assert.throws(() => new PopulationTriage(null, rules), /Invalid triage record/);
    assert.throws(() => createTriage({ age: 9.5 }, rules));
    assert.throws(() => createTriage({ age: 59.5 }, rules));
    assert.throws(() => createTriage({ age: -1 }, rules));
    assert.throws(() => createTriage({ fullName: 'B'.repeat(250) }, rules));
    assert.throws(() => createTriage({ group: 'vip' }, rules));
  });
});

describe('Unit Tests - CityAnalytics BI Service', () => {
  it('tracks 6 sectors, pending counts, uninsured risk, and rejects unknown sectors', () => {
    const rules = loadParsedRules();
    const analytics = new CityAnalytics(rules);
    analytics.addPropertyInspection(createInspection({ damageLevel: null, habitabilityStatus: null, insuranceStatus: 'uninsured' }, rules));
    analytics.addPopulationTriage(createTriage({ hasSpecialNeeds: true }, rules));
    assert.equal(analytics.getPropertyReport().pendingInspectionCount, 1);
    assert.equal(analytics.getPropertyReport().uninsuredHighRiskCount, 1);
    assert.equal(analytics.getPopulationReport().ambulanceCount, 1);
    assert.throws(() => analytics.getSectorStatus('nonexistent'), /Invalid sector/);
  });

  it('blocks duplicate rapid submissions and sorts priority queue highest score first', () => {
    const rules = loadParsedRules();
    const analytics = new CityAnalytics(rules);
    analytics.addPropertyInspection(createInspection({ propertyName: 'School Block 6' }, rules));
    assert.throws(() => analytics.addPropertyInspection(createInspection({ propertyName: 'School Block 6' }, rules)));
    analytics.addPopulationTriage(createTriage({ id: 'low', fullName: 'Sam Lee', age: 30 }, rules));
    analytics.addPopulationTriage(createTriage({ id: 'top', fullName: 'Mia Ross', age: 6, hasSpecialNeeds: true }, rules));
    assert.equal(analytics.findPropertiesByQuery('block 6').length, 1);
    assert.deepEqual(analytics.getPriorityQueue().map((item) => item.id), ['top', 'low']);
  });

  it('rejects non-model objects and resets cleanly on clearAll', () => {
    const analytics = new CityAnalytics(loadParsedRules());
    assert.throws(() => analytics.addPropertyInspection({ propertyName: 'Fake' }));
    assert.throws(() => analytics.addPopulationTriage({ fullName: 'Fake' }));
    analytics.clearAll();
    assert.equal(analytics.getCityTrafficLight(), 'green');
  });
});

describe('UX Tests - Two-Tab Child-Friendly Traffic-Light Interface', () => {
  it('includes all Public BI and Private Inspector DOM IDs and maxlength limits in index.html', () => {
    const html = readWorkspaceFile(INDEX_HTML_PATH);
    REQUIRED_DOM_IDS.forEach((id) => {
      assert.ok(html.includes(`id="${id}"`), `Missing DOM id: ${id}`);
    });
    assert.ok(html.includes('maxlength="120"'));
    assert.ok(html.includes('Public BI Dashboard'));
    assert.ok(html.includes('Private Inspector Tool'));
  });

  it('defines accessible traffic-light, interactive states, and mobile rules in styles.css', () => {
    const css = readWorkspaceFile(STYLES_CSS_PATH);
    assert.ok(css.includes('.light-green') && css.includes('.light-yellow') && css.includes('.light-red'));
    assert.ok(css.includes(':focus-visible') && css.includes(':hover') && css.includes(':disabled'));
    assert.ok(css.includes('--touch-target-min: 44px') && css.includes('@media (max-width: 640px)'));
  });

  it('renders KPI counters, ARIA tabs, clear button state, and non-duplicated search prompt', () => {
    const rules = loadParsedRules();
    const doc = new MockDocument(REQUIRED_DOM_IDS);
    const analytics = new CityAnalytics(rules);
    const view = new TrafficLightView(doc, rules);
    view.renderSnapshot(analytics.getDashboardSnapshot());
    view.setActiveTab('private');
    assert.equal(doc.getElementById('clear-board-btn').disabled, true);
    assert.equal(doc.getElementById('tab-private-btn').attributes['aria-selected'], 'true');
    assert.ok(doc.getElementById('claim-search-results').innerHTML.includes('Type a building name'));
  });
});

describe('Connection Tests - YAML, Persistence, Two-Tab App, and Validation', () => {
  it('loads valid YAML rules and rejects empty or incomplete YAML schema', async () => {
    const rules = await loadCityRules(createFakeFetch(readWorkspaceFile(YAML_RULES_PATH)));
    assert.equal(rules.sectors.education.label, 'Education');
    await assert.rejects(() => loadCityRules(createFakeFetch('')), /Missing required yamlText/);
    await assert.rejects(() => loadCityRules(createFakeFetch('sectors:\n  health:\n    label: Health\n')), /Invalid city rules YAML/);
  });

  it('rejects blank age form submission and connects search and ambulance counters', async () => {
    const doc = new MockDocument(REQUIRED_DOM_IDS);
    const app = await bootstrapApp(doc, createFakeFetch(readWorkspaceFile(YAML_RULES_PATH)));
    doc.getElementById('person-name').value = 'Blank Age';
    doc.getElementById('person-sector').value = 'health';
    doc.getElementById('person-age').value = '';
    doc.getElementById('person-group').value = 'civilian';
    doc.getElementById('triage-form').trigger('submit', { preventDefault: () => {} });
    assert.equal(app.analytics.getPopulationReport().total, 0);
    assert.ok(doc.getElementById('status-banner').className.includes('status-error'));
  });

  it('persists records across reload and includes all 4 insurance types in practice drill', async () => {
    const storage = new MockStorage();
    const yamlText = readWorkspaceFile(YAML_RULES_PATH);
    const docOne = new MockDocument(REQUIRED_DOM_IDS);
    const appOne = await bootstrapApp(docOne, createFakeFetch(yamlText), storage);
    docOne.getElementById('load-drill-btn').trigger('click');
    assert.ok(appOne.analytics.getPropertyReport().insuranceStatus.mortgage >= 1);
    const docTwo = new MockDocument(REQUIRED_DOM_IDS);
    const appTwo = await bootstrapApp(docTwo, createFakeFetch(yamlText), storage);
    assert.equal(appTwo.analytics.getPropertyReport().total, 6);
    docTwo.getElementById('clear-board-btn').trigger('click');
    assert.equal(appTwo.analytics.getPropertyReport().total, 0);
  });

  it('connects Private forms and Public search results end-to-end', async () => {
    const doc = new MockDocument(REQUIRED_DOM_IDS);
    const app = await bootstrapApp(doc, createFakeFetch(readWorkspaceFile(YAML_RULES_PATH)));
    fillPropertyForm(doc);
    doc.getElementById('property-form').trigger('submit', { preventDefault: () => {} });
    fillTriageForm(doc);
    doc.getElementById('triage-form').trigger('submit', { preventDefault: () => {} });
    doc.getElementById('claim-search-input').value = '44th';
    doc.getElementById('claim-search-input').trigger('input');
    assert.equal(app.analytics.getPopulationReport().ambulanceCount, 1);
    assert.ok(doc.getElementById('claim-search-results').innerHTML.includes('44th &amp; 9th Avenue Hotel'));
  });
});
