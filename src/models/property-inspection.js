const DEFAULT_PROPERTY_PREFIX = 'prop';

function assertLookupKey(map, key, fieldName) {
  const isPresent = Boolean(map && Object.hasOwn(map, key));
  if (!isPresent) {
    throw new Error(`Invalid ${fieldName}: ${key}`);
  }
}

function assertNonEmptyText(value, fieldName) {
  const isValidText = typeof value === 'string' && value.trim().length > 0;
  if (!isValidText) {
    throw new Error(`Missing required ${fieldName}`);
  }
}

function validatePropertyRecord(record, rules) {
  assertNonEmptyText(record.propertyName, 'propertyName');
  assertLookupKey(rules.sectors, record.sector, 'sector');
  assertLookupKey(rules.propertyTypes, record.propertyType, 'propertyType');
  assertLookupKey(rules.damageLevels, record.damageLevel, 'damageLevel');
  assertLookupKey(rules.insuranceStatuses, record.insuranceStatus, 'insuranceStatus');
}

export class PropertyInspection {
  constructor(record, rules) {
    validatePropertyRecord(record, rules);
    this.id = record.id || `${DEFAULT_PROPERTY_PREFIX}-${Date.now()}`;
    this.propertyName = record.propertyName.trim();
    this.sector = record.sector;
    this.propertyType = record.propertyType;
    this.damageLevel = record.damageLevel;
    this.insuranceStatus = record.insuranceStatus;
    this.rules = rules;
  }

  getDamageAssessment() {
    const damageRule = this.rules.damageLevels[this.damageLevel];
    return {
      trafficLight: damageRule.trafficLight,
      isHabitable: damageRule.isHabitable,
      needsEvacuation: damageRule.needsEvacuation,
      guidance: damageRule.guidance,
    };
  }

  getTrafficLight() {
    return this.getDamageAssessment().trafficLight;
  }

  getInsurancePlan() {
    const strategy = this.rules.insuranceStatuses[this.insuranceStatus];
    return {
      status: this.insuranceStatus,
      claimRoute: strategy.claimRoute,
      responsibleAgency: strategy.responsibleAgency,
      priorityTier: strategy.priorityTier,
      nextStep: strategy.nextStep,
    };
  }

  toSummary() {
    return {
      id: this.id,
      propertyName: this.propertyName,
      sector: this.sector,
      propertyType: this.propertyType,
      damageLevel: this.damageLevel,
      ...this.getDamageAssessment(),
      insurancePlan: this.getInsurancePlan(),
    };
  }
}
