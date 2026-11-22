import { PropertyInspection } from '../models/property-inspection.js';
import { PopulationTriage } from '../models/population-triage.js';

const TRAFFIC_LIGHT_ORDER = ['red', 'yellow', 'green'];

function createZeroCounters(keys) {
  return Object.fromEntries(keys.map((key) => [key, 0]));
}

function countByField(items, keys, getKey) {
  const counts = createZeroCounters(keys);
  items.forEach((item) => {
    const value = getKey(item);
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

function pickWorstLight(lights) {
  return TRAFFIC_LIGHT_ORDER.find((light) => lights.includes(light)) || 'green';
}

function buildSectorCounts(lights) {
  const counts = countByField(lights, TRAFFIC_LIGHT_ORDER, (light) => light);
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

function assertInstance(item, ExpectedClass, label) {
  const isValid = item instanceof ExpectedClass;
  if (!isValid) {
    throw new Error(`Expected a valid ${label} instance`);
  }
}

export class CityAnalytics {
  constructor(rules) {
    this.rules = rules;
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
    const propertyLights = this.inspections
      .filter((item) => item.sector === sectorKey)
      .map((item) => item.getTrafficLight());
    const triageLights = this.triages
      .filter((item) => item.sector === sectorKey)
      .map((item) => item.getTrafficLight());
    return [...propertyLights, ...triageLights];
  }

  getSectorStatus(sectorKey) {
    const sectorRule = this.rules.sectors[sectorKey];
    const lights = this.getSectorLights(sectorKey);
    return {
      sectorKey,
      label: sectorRule.label,
      description: sectorRule.description,
      trafficLight: pickWorstLight(lights),
      ...buildSectorCounts(lights),
    };
  }

  getAllSectorStatuses() {
    return Object.keys(this.rules.sectors).map((key) => this.getSectorStatus(key));
  }

  getCityTrafficLight() {
    const sectorLights = this.getAllSectorStatuses().map((item) => item.trafficLight);
    return pickWorstLight(sectorLights);
  }

  getPropertyReport() {
    const items = this.inspections.map((item) => item.toSummary());
    return {
      total: items.length,
      evacuationCount: items.filter((item) => item.needsEvacuation).length,
      trafficLight: countByField(items, TRAFFIC_LIGHT_ORDER, (item) => item.trafficLight),
      propertyType: countByField(items, Object.keys(this.rules.propertyTypes), (item) => item.propertyType),
      insuranceStatus: countByField(items, Object.keys(this.rules.insuranceStatuses), (item) => item.insurancePlan.status),
    };
  }

  getPopulationReport() {
    const items = this.triages.map((item) => item.toSummary());
    return {
      total: items.length,
      trafficLight: countByField(items, TRAFFIC_LIGHT_ORDER, (item) => item.trafficLight),
      ageBracket: countByField(items, Object.keys(this.rules.ageBrackets), (item) => item.ageBracket.key),
      group: countByField(items, Object.keys(this.rules.populationGroups), (item) => item.groupProtocol.key),
      flags: countCareFlags(items, Object.keys(this.rules.vulnerabilityFlags)),
    };
  }

  getPriorityQueue() {
    return this.triages
      .map((item) => item.toSummary())
      .sort((first, second) => second.priorityScore - first.priorityScore);
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
