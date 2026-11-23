import {
  assertLookupKey,
  assertNonEmptyText,
  assertOptionalMaxLength,
  assertRecordObject,
  createUniqueId,
} from '../utils/validators.js';

const DEFAULT_PROPERTY_PREFIX = 'prop';
const DEFAULT_INSPECTOR_ROLE = 'civilEngineer';
const MAX_NAME_LENGTH = 120;
const MAX_INVENTORY_LENGTH = 240;

const PENDING_ASSESSMENT = {
  trafficLight: 'yellow',
  isHabitable: false,
  needsEvacuation: false,
  guidance: 'Pending Engineer and UDGR field inspection - do not assume safe',
};

function assertOptionalKey(lookupMap, value, fieldName) {
  const hasValue = value !== null && value !== undefined && value !== '';
  if (hasValue) assertLookupKey(lookupMap, value, fieldName);
}

function pickUpdatedValue(nextValue, currentValue) {
  return nextValue !== undefined ? nextValue : currentValue;
}

function validatePropertyBase(record, rules) {
  assertRecordObject(record, 'property');
  assertNonEmptyText(record.propertyName, 'propertyName', MAX_NAME_LENGTH);
  assertLookupKey(rules.sectors, record.sector, 'sector');
  assertLookupKey(rules.propertyTypes, record.propertyType, 'propertyType');
  assertLookupKey(rules.occupantRoles, record.occupantRole, 'occupantRole');
  assertLookupKey(rules.insuranceStatuses, record.insuranceStatus, 'insuranceStatus');
}

function validateInspectionFields(details, rules) {
  assertRecordObject(details, 'inspection');
  assertOptionalKey(rules.inspectorRoles, details.inspectorRole, 'inspectorRole');
  assertOptionalKey(rules.damageLevels, details.damageLevel, 'damageLevel');
  assertOptionalKey(rules.habitabilityStatuses, details.habitabilityStatus, 'habitabilityStatus');
  assertOptionalMaxLength(details.evidencePhoto, 'evidencePhoto', MAX_NAME_LENGTH);
  assertOptionalMaxLength(details.damageInventory, 'damageInventory', MAX_INVENTORY_LENGTH);
}

function buildPendingPlan(status, rules) {
  const strategy = rules.insuranceStatuses[status];
  return {
    isApproved: false,
    status,
    claimRoute: 'Pending Inspection',
    responsibleAgency: 'Engineer and UDGR Required',
    isHighFinancialRisk: Boolean(strategy && strategy.isHighFinancialRisk),
    nextStep: 'Requires both Engineer damage and UDGR habitability reports first',
  };
}

function buildApprovedPlan(inspection, rules) {
  const strategy = rules.insuranceStatuses[inspection.insuranceStatus];
  const occupantLabel = rules.occupantRoles[inspection.occupantRole].label;
  return {
    isApproved: true,
    status: inspection.insuranceStatus,
    ...strategy,
    nextStep: `${strategy.nextStep} (${occupantLabel})`,
  };
}

export class InsuranceClaimReconciler {
  static reconcile(inspection, rules) {
    return inspection.isInspectionComplete()
      ? buildApprovedPlan(inspection, rules)
      : buildPendingPlan(inspection.insuranceStatus, rules);
  }
}

export class PropertyInspection {
  constructor(record, rules) {
    validatePropertyBase(record, rules);
    validateInspectionFields(record, rules);
    this.rules = rules;
    this.assignIdentity(record);
    this.assignInitialInspection(record);
  }

  assignIdentity(record) {
    this.id = record.id || createUniqueId(DEFAULT_PROPERTY_PREFIX);
    this.propertyName = record.propertyName.trim();
    this.sector = record.sector;
    this.propertyType = record.propertyType;
    this.occupantRole = record.occupantRole;
    this.insuranceStatus = record.insuranceStatus;
  }

  assignInitialInspection(details) {
    this.inspectorRole = details.inspectorRole || DEFAULT_INSPECTOR_ROLE;
    this.damageLevel = details.damageLevel || null;
    this.habitabilityStatus = details.habitabilityStatus || null;
    this.evidencePhoto = String(details.evidencePhoto || '').trim();
    this.damageInventory = String(details.damageInventory || '').trim();
  }

  recordInspection(details) {
    validateInspectionFields(details, this.rules);
    this.inspectorRole = pickUpdatedValue(details.inspectorRole, this.inspectorRole) || DEFAULT_INSPECTOR_ROLE;
    this.damageLevel = pickUpdatedValue(details.damageLevel, this.damageLevel);
    this.habitabilityStatus = pickUpdatedValue(details.habitabilityStatus, this.habitabilityStatus);
    this.evidencePhoto = String(pickUpdatedValue(details.evidencePhoto, this.evidencePhoto) || '').trim();
    this.damageInventory = String(pickUpdatedValue(details.damageInventory, this.damageInventory) || '').trim();
  }

  isInspectionComplete() {
    return Boolean(this.damageLevel && this.habitabilityStatus);
  }

  hasPhotoEvidence() {
    return this.evidencePhoto.length > 0;
  }

  getHabitabilityAssessment() {
    const rule = this.rules.habitabilityStatuses[this.habitabilityStatus];
    return rule ? { ...rule } : { ...PENDING_ASSESSMENT };
  }

  getTrafficLight() {
    return this.getHabitabilityAssessment().trafficLight;
  }

  getInsurancePlan() {
    return InsuranceClaimReconciler.reconcile(this, this.rules);
  }

  getCoreSummary() {
    const { id, propertyName, sector, propertyType, occupantRole } = this;
    const { inspectorRole, damageLevel, habitabilityStatus } = this;
    return {
      id, propertyName, sector, propertyType,
      occupantRole, inspectorRole, damageLevel, habitabilityStatus,
    };
  }

  toSummary() {
    return {
      ...this.getCoreSummary(),
      evidencePhoto: this.evidencePhoto,
      damageInventory: this.damageInventory,
      hasPhotoEvidence: this.hasPhotoEvidence(),
      isInspectionComplete: this.isInspectionComplete(),
      ...this.getHabitabilityAssessment(),
      insurancePlan: this.getInsurancePlan(),
    };
  }
}
