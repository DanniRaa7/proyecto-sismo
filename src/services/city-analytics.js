import { PropertyInspection } from '../models/property-inspection.js';
import { PopulationTriage } from '../models/population-triage.js';
import { assertInstance, getSortedLightKeys } from '../utils/validators.js';

const DEFAULT_SAFE_LIGHT = 'green';

function createZeroCounters(keys) {
  return Object.fromEntries(keys.map((key) => [key, 0]));
}

function countByField(items, keys, extractKey) {
  const counts = createZeroCounters(keys);
  items.forEach((item) => {
    const value = extractKey(item);
    if (value) counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

function collectSectorLights(records, sectorKey) {
  return records
    .filter((record) => record.sector === sectorKey)
    .map((record) => record.getTrafficLight());
}

function pickWorstLight(lights, orderedLights) {
  return orderedLights.find((light) => lights.includes(light)) || DEFAULT_SAFE_LIGHT;
}

function buildSectorCounts(lights, orderedLights) {
  const counts = countByField(lights, orderedLights, (light) => light);
  return {
    redCount: counts.red,
    yellowCount: counts.yellow,
    greenCount: counts.green,
    totalReports: lights.length,
  };
}

function countCareFlags(summaries, flagKeys) {
  return Object.fromEntries(
    flagKeys.map((key) => [key, summaries.filter((item) => item[key]).length])
  );
}

function countPropertyDimensions(items, rules, orderedLights) {
  return {
    trafficLight: countByField(items, orderedLights, (item) => item.trafficLight),
    propertyType: countByField(items, Object.keys(rules.propertyTypes), (item) => item.propertyType),
    occupantRole: countByField(items, Object.keys(rules.occupantRoles), (item) => item.occupantRole),
    damageLevel: countByField(items, Object.keys(rules.damageLevels), (item) => item.damageLevel),
    habitability: countByField(items, Object.keys(rules.habitabilityStatuses), (item) => item.habitabilityStatus),
    insuranceStatus: countByField(items, Object.keys(rules.insuranceStatuses), (item) => item.insurancePlan.status),
  };
}

function countPopulationDimensions(items, rules, orderedLights) {
  return {
    trafficLight: countByField(items, orderedLights, (item) => item.trafficLight),
    ageBracket: countByField(items, Object.keys(rules.ageBrackets), (item) => item.ageBracket.key),
    group: countByField(items, Object.keys(rules.populationGroups), (item) => item.groupProtocol.key),
    flags: countCareFlags(items, Object.keys(rules.vulnerabilityFlags)),
  };
}

export class CityAnalytics {
  constructor(rules) {
    this.rules = rules;
    this.orderedLights = getSortedLightKeys(rules.trafficLights);
    this.inspections = [];
    this.triages = [];
  }

  addPropertyInspection(inspection) {
    assertInstance(inspection, PropertyInspection, 'PropertyInspection');
    this.inspections.push(inspection);
    return inspection.toSummary();
  }

  addPopulationTriage(triage) {
    assertInstance(triage, PopulationTriage, 'PopulationTriage');
    this.triages.push(triage);
    return triage.toSummary();
  }

  clearAll() {
    this.inspections = [];
    this.triages = [];
  }

  getSectorLights(sectorKey) {
    return [
      ...collectSectorLights(this.inspections, sectorKey),
      ...collectSectorLights(this.triages, sectorKey),
    ];
  }

  getSectorStatus(sectorKey) {
    const sectorRule = this.rules.sectors[sectorKey];
    const lights = this.getSectorLights(sectorKey);
    return {
      sectorKey,
      ...sectorRule,
      trafficLight: pickWorstLight(lights, this.orderedLights),
      ...buildSectorCounts(lights, this.orderedLights),
    };
  }

  getAllSectorStatuses() {
    return Object.keys(this.rules.sectors).map((key) => this.getSectorStatus(key));
  }

  getCityTrafficLight() {
    const sectorLights = this.getAllSectorStatuses().map((item) => item.trafficLight);
    return pickWorstLight(sectorLights, this.orderedLights);
  }

  getPropertyReport() {
    const items = this.inspections.map((item) => item.toSummary());
    return {
      total: items.length,
      evacuationCount: items.filter((item) => item.needsEvacuation).length,
      uninsuredHighRiskCount: items.filter((item) => item.insurancePlan.isHighFinancialRisk).length,
      withEvidenceCount: items.filter((item) => item.hasPhotoEvidence).length,
      ...countPropertyDimensions(items, this.rules, this.orderedLights),
    };
  }

  getPopulationReport() {
    const items = this.triages.map((item) => item.toSummary());
    return {
      total: items.length,
      ambulanceCount: items.filter((item) => item.needsAmbulance).length,
      highPriorityCount: items.filter((item) => item.needsImmediateHelp).length,
      ...countPopulationDimensions(items, this.rules, this.orderedLights),
    };
  }

  getPriorityQueue() {
    return this.triages
      .map((item) => item.toSummary())
      .sort((first, second) => second.priorityScore - first.priorityScore);
  }

  findPropertiesByQuery(queryText) {
    const term = String(queryText || '').trim().toLowerCase();
    const summaries = this.inspections.map((item) => item.toSummary());
    if (!term) return summaries;
    return summaries.filter((item) =>
      item.propertyName.toLowerCase().includes(term) ||
      item.sector.toLowerCase().includes(term)
    );
  }

  getDashboardSnapshot() {
    return {
      cityTrafficLight: this.getCityTrafficLight(),
      sectors: this.getAllSectorStatuses(),
      propertyReport: this.getPropertyReport(),
      populationReport: this.getPopulationReport(),
      priorityQueue: this.getPriorityQueue(),
      inspections: this.inspections.map((item) => item.toSummary()),
    };
  }
}
