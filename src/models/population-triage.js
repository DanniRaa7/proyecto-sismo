const DEFAULT_PERSON_PREFIX = 'person';
const CARE_FLAG_KEYS = ['hasDisability', 'isVulnerable', 'hasSpecialNeeds'];
const TRAFFIC_LIGHT_PRIORITY = ['red', 'yellow', 'green'];

function assertLookupKey(map, key, fieldName) {
  const isPresent = Boolean(map && Object.hasOwn(map, key));
  if (!isPresent) {
    throw new Error(`Invalid ${fieldName}: ${key}`);
  }
}

function assertValidAge(age, limits) {
  const isNumber = typeof age === 'number' && !Number.isNaN(age);
  const isInRange = isNumber && age >= limits.minAge && age <= limits.maxAge;
  if (!isInRange) {
    throw new Error(`Invalid age: ${age}`);
  }
}

function validateTriageRecord(record, rules) {
  const hasName = typeof record.fullName === 'string' && record.fullName.trim().length > 0;
  if (!hasName) throw new Error('Missing required fullName');
  assertLookupKey(rules.sectors, record.sector, 'sector');
  assertLookupKey(rules.populationGroups, record.group, 'group');
  assertValidAge(record.age, rules.limits);
}

function extractCareFlags(record) {
  return {
    hasDisability: Boolean(record.hasDisability),
    isVulnerable: Boolean(record.isVulnerable),
    hasSpecialNeeds: Boolean(record.hasSpecialNeeds),
  };
}

export class PopulationTriage {
  constructor(record, rules) {
    validateTriageRecord(record, rules);
    this.id = record.id || `${DEFAULT_PERSON_PREFIX}-${Date.now()}`;
    this.fullName = record.fullName.trim();
    this.sector = record.sector;
    this.age = record.age;
    this.group = record.group;
    this.flags = extractCareFlags(record);
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
    return CARE_FLAG_KEYS.filter((flagKey) => this.flags[flagKey]);
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
    return TRAFFIC_LIGHT_PRIORITY.find(
      (light) => score >= thresholds[light].minScore
    );
  }

  needsImmediateHelp() {
    return this.getTrafficLight() === 'red';
  }

  getIdentityFields() {
    return {
      id: this.id,
      fullName: this.fullName,
      sector: this.sector,
      age: this.age,
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
