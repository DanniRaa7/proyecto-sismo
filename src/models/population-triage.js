import {
  assertIntegerInRange,
  assertLookupKey,
  assertNonEmptyText,
  assertRecordObject,
  createUniqueId,
  getSortedLightKeys,
} from '../utils/validators.js';

const DEFAULT_PERSON_PREFIX = 'person';
const URGENT_TRAFFIC_LIGHT = 'red';
const MAX_NAME_LENGTH = 120;

function validateTriageRecord(record, rules) {
  assertRecordObject(record, 'triage');
  assertNonEmptyText(record.fullName, 'fullName', MAX_NAME_LENGTH);
  assertLookupKey(rules.sectors, record.sector, 'sector');
  assertLookupKey(rules.populationGroups, record.group, 'group');
  assertIntegerInRange(record.age, rules.limits.minAge, rules.limits.maxAge, 'age');
}

function extractCareFlags(record, flagKeys) {
  return Object.fromEntries(
    flagKeys.map((flagKey) => [flagKey, Boolean(record[flagKey])])
  );
}

export class PopulationTriage {
  constructor(record, rules) {
    validateTriageRecord(record, rules);
    this.id = record.id || createUniqueId(DEFAULT_PERSON_PREFIX);
    this.fullName = record.fullName.trim();
    this.sector = record.sector;
    this.age = record.age;
    this.group = record.group;
    this.flags = extractCareFlags(record, Object.keys(rules.vulnerabilityFlags));
    this.rules = rules;
  }

  getAgeBracket() {
    const entries = Object.entries(this.rules.ageBrackets);
    const matched = entries.find(
      ([, rule]) => this.age >= rule.minAge && this.age <= rule.maxAge
    );
    return { key: matched[0], ...matched[1] };
  }

  getGroupProtocol() {
    const rule = this.rules.populationGroups[this.group];
    return { key: this.group, ...rule };
  }

  getActiveFlags() {
    return Object.keys(this.flags).filter((flagKey) => this.flags[flagKey]);
  }

  getPriorityScore() {
    const flagScore = this.getActiveFlags().reduce(
      (sum, flagKey) => sum + this.rules.vulnerabilityFlags[flagKey].score,
      0
    );
    return this.getAgeBracket().score + this.getGroupProtocol().score + flagScore;
  }

  getTrafficLight() {
    const score = this.getPriorityScore();
    const thresholds = this.rules.triageThresholds;
    const orderedLights = getSortedLightKeys(this.rules.trafficLights);
    return orderedLights.find((light) => score >= thresholds[light].minScore);
  }

  needsAmbulance() {
    return Boolean(this.flags.hasSpecialNeeds);
  }

  needsImmediateHelp() {
    return this.getTrafficLight() === URGENT_TRAFFIC_LIGHT;
  }

  getIdentityFields() {
    return {
      id: this.id,
      fullName: this.fullName,
      sector: this.sector,
      age: this.age,
      needsAmbulance: this.needsAmbulance(),
      ...this.flags,
    };
  }

  toSummary() {
    return {
      ...this.getIdentityFields(),
      ageBracket: this.getAgeBracket(),
      groupProtocol: this.getGroupProtocol(),
      activeFlags: this.getActiveFlags(),
      priorityScore: this.getPriorityScore(),
      trafficLight: this.getTrafficLight(),
      needsImmediateHelp: this.needsImmediateHelp(),
    };
  }
}
