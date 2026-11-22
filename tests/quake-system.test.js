import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parseYaml } from '../src/utils/yaml-parser.js';
import { PropertyInspection } from '../src/models/property-inspection.js';
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
  'Direct Insurance Claim',
  'Bank Mortgage Disaster Policy',
  'Leasing Asset Protection',
  'Municipal Relief Subsidy',
];

const DEFAULT_TRIAGE_BASE = {
  id: 'person-1',
  fullName: 'Ana Gomez',
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
  'sector-grid',
  'traffic-legend',
  'status-banner',
  'load-drill-btn',
  'clear-board-btn',
  'property-form',
  'property-name',
  'property-sector',
  'property-type',
  'property-damage',
  'property-insurance',
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

function createFakeFetch(yamlText) {
  return async () => ({
    ok: true,
    text: async () => yamlText,
  });
}

class MockElement {
  constructor(id) {
    this.id = id;
    this.value = '';
    this.checked = false;
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.listeners = {};
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

function buildPropertyRecord(overrides = {}) {
  return {
    id: 'prop-1',
    propertyName: 'San Antonio Bakery',
    sector: 'economy',
    propertyType: 'commercial',
    damageLevel: 'moderate',
    insuranceStatus: 'insured',
    ...overrides,
  };
}

function buildTriageRecord(overrides = {}) {
  return { ...DEFAULT_TRIAGE_BASE, ...overrides };
}

function createInspection(overrides, rules) {
  return new PropertyInspection(buildPropertyRecord(overrides), rules);
}

function createTriage(overrides, rules) {
  return new PopulationTriage(buildTriageRecord(overrides), rules);
}

function fillPropertyForm(doc) {
  doc.getElementById('property-name').value = 'Granada Home';
  doc.getElementById('property-sector').value = 'housing';
  doc.getElementById('property-type').value = 'housing';
  doc.getElementById('property-damage').value = 'severe';
  doc.getElementById('property-insurance').value = 'mortgage';
}

function fillTriageForm(doc) {
  doc.getElementById('person-name').value = 'Mateo Silva';
  doc.getElementById('person-sector').value = 'education';
  doc.getElementById('person-age').value = '7';
  doc.getElementById('person-group').value = 'civilian';
  doc.getElementById('flag-disability').checked = false;
  doc.getElementById('flag-vulnerable').checked = true;
  doc.getElementById('flag-special-needs').checked = false;
}

describe('Unit Tests - YAML Parser and Rules Config', () => {
  it('parses all 6 city sectors from config/city-rules.yaml', () => {
    const rules = loadParsedRules();
    assert.deepEqual(Object.keys(rules.sectors), EXPECTED_SECTORS);
  });

  it('parses booleans, numbers, and quoted age rule tags accurately', () => {
    const rules = loadParsedRules();
    assert.equal(rules.damageLevels.severe.needsEvacuation, true);
    assert.equal(rules.damageLevels.none.isHabitable, true);
    assert.equal(rules.ageBrackets.underTen.ruleTag, '<10');
    assert.equal(rules.ageBrackets.youth.ruleTag, '>10');
    assert.equal(rules.ageBrackets.adult.ruleTag, '>=18');
    assert.equal(rules.ageBrackets.senior.ruleTag, '>=60');
  });
});

describe('Unit Tests - PropertyInspection (UDGR and Insurance)', () => {
  it('maps damage levels to traffic lights and evacuation flags', () => {
    const rules = loadParsedRules();
    const safeHome = createInspection({ propertyType: 'housing', damageLevel: 'minor' }, rules);
    const dangerShop = createInspection({ damageLevel: 'collapse' }, rules);
    assert.equal(safeHome.getTrafficLight(), 'green');
    assert.equal(safeHome.getDamageAssessment().isHabitable, true);
    assert.equal(dangerShop.getTrafficLight(), 'red');
    assert.equal(dangerShop.getDamageAssessment().needsEvacuation, true);
  });

  it('routes all four insurance statuses through lookup strategies', () => {
    const rules = loadParsedRules();
    const statuses = ['insured', 'mortgage', 'leasing', 'uninsured'];
    const routes = statuses.map((insuranceStatus) =>
      createInspection({ insuranceStatus }, rules).getInsurancePlan().claimRoute
    );
    assert.deepEqual(routes, EXPECTED_INSURANCE_ROUTES);
  });

  it('rejects invalid sector, property type, damage, or insurance input', () => {
    const rules = loadParsedRules();
    assert.throws(() => createInspection({ sector: 'space' }, rules));
    assert.throws(() => createInspection({ propertyType: 'boat' }, rules));
    assert.throws(() => createInspection({ damageLevel: 'total' }, rules));
    assert.throws(() => createInspection({ insuranceStatus: 'cash' }, rules));
    assert.throws(() => createInspection({ propertyName: '   ' }, rules));
  });
});

describe('Unit Tests - PopulationTriage (Ages, Flags, Groups)', () => {
  it('classifies all four age brackets (<10, >10, >=18, >=60) without gaps', () => {
    const rules = loadParsedRules();
    const tags = [5, 9, 10, 14, 18, 59, 60, 82].map((age) =>
      createTriage({ age }, rules).getAgeBracket().ruleTag
    );
    assert.deepEqual(tags, ['<10', '<10', '>10', '>10', '>=18', '>=18', '>=60', '>=60']);
  });

  it('scores disability, vulnerable, and special needs flags cleanly', () => {
    const rules = loadParsedRules();
    const lights = [
      createTriage({ hasDisability: true }, rules).getTrafficLight(),
      createTriage({ isVulnerable: true }, rules).getTrafficLight(),
      createTriage({ hasSpecialNeeds: true }, rules).getTrafficLight(),
    ];
    assert.deepEqual(lights, ['red', 'yellow', 'red']);
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

  it('rejects blank names, invalid ages, unknown sectors, and unknown groups', () => {
    const rules = loadParsedRules();
    assert.throws(() => createTriage({ fullName: '' }, rules));
    assert.throws(() => createTriage({ age: -1 }, rules));
    assert.throws(() => createTriage({ age: 121 }, rules));
    assert.throws(() => createTriage({ sector: 'moon' }, rules));
    assert.throws(() => createTriage({ group: 'vip' }, rules));
  });
});

describe('Unit Tests - CityAnalytics Service', () => {
  it('starts with all 6 sectors green and updates worst-case lights', () => {
    const rules = loadParsedRules();
    const analytics = new CityAnalytics(rules);
    assert.equal(analytics.getCityTrafficLight(), 'green');
    assert.equal(analytics.getAllSectorStatuses().length, 6);
    analytics.addPropertyInspection(createInspection({ sector: 'logistics', damageLevel: 'moderate' }, rules));
    assert.equal(analytics.getSectorStatus('logistics').trafficLight, 'yellow');
    assert.equal(analytics.getCityTrafficLight(), 'yellow');
  });

  it('ranks priority queue highest score first', () => {
    const rules = loadParsedRules();
    const analytics = new CityAnalytics(rules);
    analytics.addPopulationTriage(createTriage({ id: 'a', age: 30 }, rules));
    analytics.addPopulationTriage(createTriage({ id: 'b', age: 6, hasDisability: true }, rules));
    analytics.addPopulationTriage(createTriage({ id: 'c', age: 15, isVulnerable: true }, rules));
    const orderedIds = analytics.getPriorityQueue().map((item) => item.id);
    assert.deepEqual(orderedIds, ['b', 'c', 'a']);
  });

  it('aggregates property insurance counts and resets cleanly on clearAll', () => {
    const rules = loadParsedRules();
    const analytics = new CityAnalytics(rules);
    analytics.addPropertyInspection(createInspection({ damageLevel: 'severe', insuranceStatus: 'leasing' }, rules));
    assert.equal(analytics.getPropertyReport().insuranceStatus.leasing, 1);
    assert.equal(analytics.getPropertyReport().evacuationCount, 1);
    analytics.clearAll();
    assert.equal(analytics.getPropertyReport().total, 0);
    assert.equal(analytics.getCityTrafficLight(), 'green');
  });

  it('rejects non-model objects passed into CityAnalytics', () => {
    const analytics = new CityAnalytics(loadParsedRules());
    assert.throws(() => analytics.addPropertyInspection({ propertyName: 'Fake' }));
    assert.throws(() => analytics.addPopulationTriage({ fullName: 'Fake' }));
  });
});

describe('UX Tests - Child-Friendly Traffic-Light Interface', () => {
  it('includes all required DOM IDs and simple traffic-light legend in index.html', () => {
    const html = readWorkspaceFile(INDEX_HTML_PATH);
    REQUIRED_DOM_IDS.forEach((id) => {
      assert.ok(html.includes(`id="${id}"`), `Missing DOM id: ${id}`);
    });
    assert.ok(html.includes('Green'));
    assert.ok(html.includes('Yellow'));
    assert.ok(html.includes('Red'));
  });

  it('defines accessible traffic-light styles in styles.css', () => {
    const css = readWorkspaceFile(STYLES_CSS_PATH);
    assert.ok(css.includes('.light-green'));
    assert.ok(css.includes('.light-yellow'));
    assert.ok(css.includes('.light-red'));
  });

  it('renders traffic-light state and 6 sector cards through TrafficLightView', () => {
    const rules = loadParsedRules();
    const doc = new MockDocument(REQUIRED_DOM_IDS);
    const analytics = new CityAnalytics(rules);
    const view = new TrafficLightView(doc, rules);
    view.renderSnapshot(analytics.getDashboardSnapshot());
    assert.ok(doc.getElementById('city-light-badge').className.includes('light-green'));
    assert.ok(doc.getElementById('sector-grid').innerHTML.includes('Economy'));
    assert.ok(doc.getElementById('sector-grid').innerHTML.includes('Housing'));
  });
});

describe('Connection Tests - YAML, Services, App, and UI Wiring', () => {
  it('loads city rules from config/city-rules.yaml via loadCityRules', async () => {
    const yamlText = readWorkspaceFile(YAML_RULES_PATH);
    const rules = await loadCityRules(createFakeFetch(yamlText));
    assert.equal(rules.sectors.health.label, 'Health');
    assert.equal(rules.insuranceStatuses.uninsured.responsibleAgency, 'UDGR Cali Relief Fund');
  });

  it('connects building form and triage form submissions end-to-end', async () => {
    const doc = new MockDocument(REQUIRED_DOM_IDS);
    const app = await bootstrapApp(doc, createFakeFetch(readWorkspaceFile(YAML_RULES_PATH)));
    fillPropertyForm(doc);
    doc.getElementById('property-form').trigger('submit', { preventDefault: () => {} });
    fillTriageForm(doc);
    doc.getElementById('triage-form').trigger('submit', { preventDefault: () => {} });
    assert.equal(app.analytics.getCityTrafficLight(), 'red');
    assert.ok(doc.getElementById('property-list').innerHTML.includes('Granada Home'));
    assert.ok(doc.getElementById('priority-list').innerHTML.includes('Mateo Silva'));
  });

  it('loads full 6-sector practice drill and resets cleanly via UI buttons', async () => {
    const doc = new MockDocument(REQUIRED_DOM_IDS);
    const app = await bootstrapApp(doc, createFakeFetch(readWorkspaceFile(YAML_RULES_PATH)));
    doc.getElementById('load-drill-btn').trigger('click');
    assert.equal(app.analytics.getPropertyReport().total, 6);
    assert.equal(app.analytics.getPopulationReport().total, 6);
    doc.getElementById('clear-board-btn').trigger('click');
    assert.equal(app.analytics.getCityTrafficLight(), 'green');
    assert.equal(app.analytics.getPropertyReport().total, 0);
  });
});
