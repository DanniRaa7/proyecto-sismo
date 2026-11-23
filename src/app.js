import { parseYaml } from './utils/yaml-parser.js';
import { PropertyInspection } from './models/property-inspection.js';
import { PopulationTriage } from './models/population-triage.js';
import { CityAnalytics } from './services/city-analytics.js';
import { TrafficLightView } from './ui/traffic-light-view.js';

const DEFAULT_RULES_PATH = './config/city-rules.yaml';

const APP_ELEMENT_IDS = {
  tabPublicButton: 'tab-public-btn',
  tabPrivateButton: 'tab-private-btn',
  claimSearchInput: 'claim-search-input',
  propertyForm: 'property-form',
  propertyName: 'property-name',
  propertySector: 'property-sector',
  propertyType: 'property-type',
  propertyOccupant: 'property-occupant',
  propertyInsurance: 'property-insurance',
  propertyInspector: 'property-inspector',
  propertyDamage: 'property-damage',
  propertyHabitability: 'property-habitability',
  propertyPhoto: 'property-photo',
  propertyInventory: 'property-inventory',
  triageForm: 'triage-form',
  personName: 'person-name',
  personSector: 'person-sector',
  personAge: 'person-age',
  personGroup: 'person-group',
  flagDisability: 'flag-disability',
  flagVulnerable: 'flag-vulnerable',
  flagSpecialNeeds: 'flag-special-needs',
  loadDrillButton: 'load-drill-btn',
  clearBoardButton: 'clear-board-btn',
  statusBanner: 'status-banner',
};

const SAMPLE_PROPERTY_RECORDS = [
  { id: 'drill-property-1', propertyName: 'La Luna Hotel', sector: 'economy', propertyType: 'commercial', occupantRole: 'owner', insuranceStatus: 'insured', inspectorRole: 'civilEngineer', damageLevel: 'structural', habitabilityStatus: 'atRisk', evidencePhoto: 'hotel-column.jpg', damageInventory: 'Lobby columns and glass facade' },
  { id: 'drill-property-2', propertyName: 'Central Hospital Annex', sector: 'health', propertyType: 'commercial', occupantRole: 'owner', insuranceStatus: 'insured', inspectorRole: 'architect', damageLevel: 'superficial', habitabilityStatus: 'safe', evidencePhoto: 'er-wing.jpg', damageInventory: 'Minor wall plaster cracks' },
  { id: 'drill-property-3', propertyName: 'Perimeter Road Depot', sector: 'infrastructure', propertyType: 'commercial', occupantRole: 'tenant', insuranceStatus: 'leasing', inspectorRole: 'topographer', damageLevel: 'chronic', habitabilityStatus: 'atRisk', evidencePhoto: 'road-slope.jpg', damageInventory: 'Side road curbing shifted' },
  { id: 'drill-property-4', propertyName: 'School Block 6', sector: 'education', propertyType: 'commercial', occupantRole: 'owner', insuranceStatus: 'insured', inspectorRole: 'civilEngineer', damageLevel: 'structural', habitabilityStatus: 'uninhabitable', evidencePhoto: 'block6-stairs.jpg', damageInventory: 'Second-floor classrooms closed' },
  { id: 'drill-property-5', propertyName: 'South Supply Warehouse', sector: 'logistics', propertyType: 'commercial', occupantRole: 'tenant', insuranceStatus: 'leasing', inspectorRole: 'udgrOfficer', damageLevel: 'superficial', habitabilityStatus: 'safe', evidencePhoto: 'storage-bay.jpg', damageInventory: 'Cement pallets intact' },
  { id: 'drill-property-6', propertyName: 'Hillside Family Home', sector: 'housing', propertyType: 'residential', occupantRole: 'owner', insuranceStatus: 'uninsured', inspectorRole: 'udgrOfficer', damageLevel: 'structural', habitabilityStatus: 'uninhabitable', evidencePhoto: 'home-roof.jpg', damageInventory: 'Roof truss and bedrooms damaged' },
];

const SAMPLE_TRIAGE_RECORDS = [
  { id: 'drill-person-1', fullName: 'Emma Clark', sector: 'education', age: 7, group: 'civilian', hasDisability: false, isVulnerable: false, hasSpecialNeeds: false },
  { id: 'drill-person-2', fullName: 'Lucas Reed', sector: 'housing', age: 14, group: 'civilian', hasDisability: false, isVulnerable: true, hasSpecialNeeds: false },
  { id: 'drill-person-3', fullName: 'Grace Miller', sector: 'health', age: 72, group: 'civilian', hasDisability: true, isVulnerable: true, hasSpecialNeeds: true },
  { id: 'drill-person-4', fullName: 'Daniel Brooks', sector: 'logistics', age: 34, group: 'military', hasDisability: false, isVulnerable: false, hasSpecialNeeds: false },
  { id: 'drill-person-5', fullName: 'Owen Carter', sector: 'infrastructure', age: 41, group: 'prison', hasDisability: false, isVulnerable: false, hasSpecialNeeds: false },
  { id: 'drill-person-6', fullName: 'Hannah Price', sector: 'economy', age: 29, group: 'civilian', hasDisability: false, isVulnerable: false, hasSpecialNeeds: false },
];

export async function loadCityRules(fetchClient, rulesPath = DEFAULT_RULES_PATH) {
  const response = await fetchClient(rulesPath);
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

function readPropertyIdentity(documentRef) {
  return {
    propertyName: documentRef.getElementById(APP_ELEMENT_IDS.propertyName).value,
    sector: documentRef.getElementById(APP_ELEMENT_IDS.propertySector).value,
    propertyType: documentRef.getElementById(APP_ELEMENT_IDS.propertyType).value,
    occupantRole: documentRef.getElementById(APP_ELEMENT_IDS.propertyOccupant).value,
    insuranceStatus: documentRef.getElementById(APP_ELEMENT_IDS.propertyInsurance).value,
  };
}

function readInspectionInput(documentRef) {
  return {
    inspectorRole: documentRef.getElementById(APP_ELEMENT_IDS.propertyInspector).value,
    damageLevel: documentRef.getElementById(APP_ELEMENT_IDS.propertyDamage).value,
    habitabilityStatus: documentRef.getElementById(APP_ELEMENT_IDS.propertyHabitability).value,
    evidencePhoto: documentRef.getElementById(APP_ELEMENT_IDS.propertyPhoto).value,
    damageInventory: documentRef.getElementById(APP_ELEMENT_IDS.propertyInventory).value,
  };
}

function readPropertyForm(documentRef) {
  return { ...readPropertyIdentity(documentRef), ...readInspectionInput(documentRef) };
}

function readTriageForm(documentRef) {
  return {
    fullName: documentRef.getElementById(APP_ELEMENT_IDS.personName).value,
    sector: documentRef.getElementById(APP_ELEMENT_IDS.personSector).value,
    age: Number(documentRef.getElementById(APP_ELEMENT_IDS.personAge).value),
    group: documentRef.getElementById(APP_ELEMENT_IDS.personGroup).value,
    hasDisability: Boolean(documentRef.getElementById(APP_ELEMENT_IDS.flagDisability).checked),
    isVulnerable: Boolean(documentRef.getElementById(APP_ELEMENT_IDS.flagVulnerable).checked),
    hasSpecialNeeds: Boolean(documentRef.getElementById(APP_ELEMENT_IDS.flagSpecialNeeds).checked),
  };
}

function bindListener(documentRef, elementId, eventName, handler) {
  const element = documentRef.getElementById(elementId);
  const hasElement = Boolean(element);
  if (hasElement) element.addEventListener(eventName, handler);
}

function reportBootError(error) {
  const banner = document.getElementById(APP_ELEMENT_IDS.statusBanner);
  const hasBanner = Boolean(banner);
  if (hasBanner) banner.textContent = error.message;
}

export class QuakeReliefApp {
  constructor(documentRef, analytics, view, rules) {
    this.documentRef = documentRef;
    this.analytics = analytics;
    this.view = view;
    this.rules = rules;
  }

  bindNavigationEvents() {
    bindListener(this.documentRef, APP_ELEMENT_IDS.tabPublicButton, 'click', () => this.view.setActiveTab('public'));
    bindListener(this.documentRef, APP_ELEMENT_IDS.tabPrivateButton, 'click', () => this.view.setActiveTab('private'));
    bindListener(this.documentRef, APP_ELEMENT_IDS.claimSearchInput, 'input', () => this.handleClaimSearch());
    bindListener(this.documentRef, APP_ELEMENT_IDS.loadDrillButton, 'click', () => this.handleLoadDrill());
    bindListener(this.documentRef, APP_ELEMENT_IDS.clearBoardButton, 'click', () => this.handleClearBoard());
  }

  init() {
    this.bindNavigationEvents();
    bindListener(this.documentRef, APP_ELEMENT_IDS.propertyForm, 'submit', (event) => this.handlePropertySubmit(event));
    bindListener(this.documentRef, APP_ELEMENT_IDS.triageForm, 'submit', (event) => this.handleTriageSubmit(event));
    this.view.setActiveTab('public');
    this.refreshBoard('Board is ready. Switch tabs to view Public BI or log Private field inspections.');
  }

  refreshBoard(message, isError = false) {
    this.view.renderSnapshot(this.analytics.getDashboardSnapshot());
    this.view.renderFeedback(message, isError);
  }

  handleClaimSearch() {
    const query = this.documentRef.getElementById(APP_ELEMENT_IDS.claimSearchInput).value;
    this.view.renderSearchResults(this.analytics.findPropertiesByQuery(query));
  }

  runFormAction(event, formId, action, successMessage) {
    event.preventDefault();
    try {
      action();
      this.documentRef.getElementById(formId).reset();
      this.refreshBoard(successMessage, false);
    } catch (error) {
      this.view.renderFeedback(error.message, true);
    }
  }

  handlePropertySubmit(event) {
    const addInspection = () => {
      const record = readPropertyForm(this.documentRef);
      this.analytics.addPropertyInspection(new PropertyInspection(record, this.rules));
    };
    this.runFormAction(event, APP_ELEMENT_IDS.propertyForm, addInspection, 'Dual-verdict inspection saved and insurance claim reconciled.');
  }

  handleTriageSubmit(event) {
    const addTriage = () => {
      const record = readTriageForm(this.documentRef);
      this.analytics.addPopulationTriage(new PopulationTriage(record, this.rules));
    };
    this.runFormAction(event, APP_ELEMENT_IDS.triageForm, addTriage, 'Citizen added to the priority triage and ambulance queue.');
  }

  handleLoadDrill() {
    this.analytics.clearAll();
    const drill = createSampleDrill(this.rules);
    drill.inspections.forEach((item) => this.analytics.addPropertyInspection(item));
    drill.triages.forEach((item) => this.analytics.addPopulationTriage(item));
    this.refreshBoard('Cali earthquake practice drill loaded across all 6 sectors.');
  }

  handleClearBoard() {
    this.analytics.clearAll();
    this.refreshBoard('Board cleared. All 6 Cali sectors are back to Green.');
  }
}

export async function bootstrapApp(documentRef, fetchClient) {
  const rules = await loadCityRules(fetchClient);
  const analytics = new CityAnalytics(rules);
  const view = new TrafficLightView(documentRef, rules);
  const app = new QuakeReliefApp(documentRef, analytics, view, rules);
  app.init();
  return app;
}

function autoStartBrowser() {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  if (!isBrowser) return;
  bootstrapApp(document, window.fetch.bind(window)).catch(reportBootError);
}

autoStartBrowser();
