import { parseYaml } from './utils/yaml-parser.js';
import { PropertyInspection } from './models/property-inspection.js';
import { PopulationTriage } from './models/population-triage.js';
import { CityAnalytics } from './services/city-analytics.js';
import { TrafficLightView } from './ui/traffic-light-view.js';

const DEFAULT_RULES_PATH = './config/city-rules.yaml';

const SAMPLE_PROPERTY_RECORDS = [
  { id: 'drill-p1', propertyName: 'Alameda Market', sector: 'economy', propertyType: 'commercial', damageLevel: 'moderate', insuranceStatus: 'leasing' },
  { id: 'drill-p2', propertyName: 'Central Clinic Annex', sector: 'health', propertyType: 'commercial', damageLevel: 'minor', insuranceStatus: 'insured' },
  { id: 'drill-p3', propertyName: 'North Bridge Depot', sector: 'infrastructure', propertyType: 'commercial', damageLevel: 'severe', insuranceStatus: 'insured' },
  { id: 'drill-p4', propertyName: 'Melendez Primary School', sector: 'education', propertyType: 'commercial', damageLevel: 'none', insuranceStatus: 'uninsured' },
  { id: 'drill-p5', propertyName: 'South Aid Warehouse', sector: 'logistics', propertyType: 'commercial', damageLevel: 'minor', insuranceStatus: 'leasing' },
  { id: 'drill-p6', propertyName: 'Siloe Family Home', sector: 'housing', propertyType: 'housing', damageLevel: 'collapse', insuranceStatus: 'mortgage' },
];

const SAMPLE_TRIAGE_RECORDS = [
  { id: 'drill-t1', fullName: 'Sofia Cruz', sector: 'education', age: 7, group: 'civilian', hasDisability: false, isVulnerable: false, hasSpecialNeeds: false },
  { id: 'drill-t2', fullName: 'Lucas Perez', sector: 'housing', age: 14, group: 'civilian', hasDisability: false, isVulnerable: true, hasSpecialNeeds: false },
  { id: 'drill-t3', fullName: 'Elena Ruiz', sector: 'health', age: 72, group: 'civilian', hasDisability: true, isVulnerable: true, hasSpecialNeeds: true },
  { id: 'drill-t4', fullName: 'Carlos Mina', sector: 'logistics', age: 34, group: 'military', hasDisability: false, isVulnerable: false, hasSpecialNeeds: false },
  { id: 'drill-t5', fullName: 'Diego Toro', sector: 'infrastructure', age: 41, group: 'prison', hasDisability: false, isVulnerable: false, hasSpecialNeeds: false },
  { id: 'drill-t6', fullName: 'Marta Leon', sector: 'economy', age: 29, group: 'civilian', hasDisability: false, isVulnerable: false, hasSpecialNeeds: false },
];

export async function loadCityRules(fetchFn, rulesPath = DEFAULT_RULES_PATH) {
  const response = await fetchFn(rulesPath);
  const isResponseOk = Boolean(response && response.ok);
  if (!isResponseOk) {
    throw new Error(`Unable to load city rules from ${rulesPath}`);
  }
  return parseYaml(await response.text());
}

export function createSampleDrill(rules) {
  return {
    inspections: SAMPLE_PROPERTY_RECORDS.map((item) => new PropertyInspection(item, rules)),
    triages: SAMPLE_TRIAGE_RECORDS.map((item) => new PopulationTriage(item, rules)),
  };
}

function readPropertyForm(doc) {
  return {
    propertyName: doc.getElementById('property-name').value,
    sector: doc.getElementById('property-sector').value,
    propertyType: doc.getElementById('property-type').value,
    damageLevel: doc.getElementById('property-damage').value,
    insuranceStatus: doc.getElementById('property-insurance').value,
  };
}

function readTriageForm(doc) {
  return {
    fullName: doc.getElementById('person-name').value,
    sector: doc.getElementById('person-sector').value,
    age: Number(doc.getElementById('person-age').value),
    group: doc.getElementById('person-group').value,
    hasDisability: Boolean(doc.getElementById('flag-disability').checked),
    isVulnerable: Boolean(doc.getElementById('flag-vulnerable').checked),
    hasSpecialNeeds: Boolean(doc.getElementById('flag-special-needs').checked),
  };
}

function bindListener(doc, elementId, eventName, handler) {
  const element = doc.getElementById(elementId);
  if (element) element.addEventListener(eventName, handler);
}

export class QuakeReliefApp {
  constructor(documentRef, analytics, view, rules) {
    this.documentRef = documentRef;
    this.analytics = analytics;
    this.view = view;
    this.rules = rules;
  }

  init() {
    bindListener(this.documentRef, 'property-form', 'submit', (event) => this.handlePropertySubmit(event));
    bindListener(this.documentRef, 'triage-form', 'submit', (event) => this.handleTriageSubmit(event));
    bindListener(this.documentRef, 'load-drill-btn', 'click', () => this.handleLoadDrill());
    bindListener(this.documentRef, 'clear-board-btn', 'click', () => this.handleClearBoard());
    this.view.renderSnapshot(this.analytics.getDashboardSnapshot());
    this.view.renderFeedback('Board is ready. All 6 Cali sectors are currently Green.', false);
  }

  runFormAction(event, formId, action, successMessage) {
    event.preventDefault();
    try {
      action();
      this.documentRef.getElementById(formId).reset();
      this.view.renderSnapshot(this.analytics.getDashboardSnapshot());
      this.view.renderFeedback(successMessage, false);
    } catch (error) {
      this.view.renderFeedback(error.message, true);
    }
  }

  handlePropertySubmit(event) {
    const addInspection = () => {
      const record = readPropertyForm(this.documentRef);
      this.analytics.addPropertyInspection(new PropertyInspection(record, this.rules));
    };
    this.runFormAction(event, 'property-form', addInspection, 'Building inspection added to the relief board.');
  }

  handleTriageSubmit(event) {
    const addTriage = () => {
      const record = readTriageForm(this.documentRef);
      this.analytics.addPopulationTriage(new PopulationTriage(record, this.rules));
    };
    this.runFormAction(event, 'triage-form', addTriage, 'Person added to the priority triage queue.');
  }

  handleLoadDrill() {
    this.analytics.clearAll();
    const drill = createSampleDrill(this.rules);
    drill.inspections.forEach((item) => this.analytics.addPropertyInspection(item));
    drill.triages.forEach((item) => this.analytics.addPopulationTriage(item));
    this.view.renderSnapshot(this.analytics.getDashboardSnapshot());
    this.view.renderFeedback('Practice drill loaded across all 6 Cali sectors.', false);
  }

  handleClearBoard() {
    this.analytics.clearAll();
    this.view.renderSnapshot(this.analytics.getDashboardSnapshot());
    this.view.renderFeedback('Board cleared. All 6 sectors are back to Green.', false);
  }
}

export async function bootstrapApp(documentRef, fetchFn) {
  const rules = await loadCityRules(fetchFn);
  const analytics = new CityAnalytics(rules);
  const view = new TrafficLightView(documentRef, rules);
  const app = new QuakeReliefApp(documentRef, analytics, view, rules);
  app.init();
  return app;
}

function autoStartBrowser() {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  if (!isBrowser) return;
  bootstrapApp(document, window.fetch.bind(window)).catch((error) => {
    const banner = document.getElementById('status-banner');
    if (banner) banner.textContent = error.message;
  });
}

autoStartBrowser();
