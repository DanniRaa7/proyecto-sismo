import { assertLookupKey, assertNonEmptyText } from '../utils/validators.js';

const DEFAULT_PROPERTY_PREFIX = 'prop';
const DEFAULT_INSPECTOR_ROLE = 'civilEngineer';

const PENDING_ASSESSMENT = {
  trafficLight: 'green',
  isHabitable: true,
  needsEvacuation: false,
  guidance: 'Pending Engineer and UDGR field inspection',
};

function assertOptionalKey(lookupMap, value, fieldName) {
  const hasValue = value !== null && value !== undefined && value !== '';
  if (hasValue) assertLookupKey(lookupMap, value, fieldName);
}

function validatePropertyBase(record, rules) {
  assertNonEmptyText(record.propertyName, 'propertyName');
  assertLookupKey(rules.sectors, record.sector, 'sector');
  assertLookupKey(rules.propertyTypes, record.propertyType, 'propertyType');
  assertLookupKey(rules.occupantRoles, record.occupantRole, 'occupantRole');
  assertLookupKey(rules.insuranceStatuses, record.insuranceStatus, 'insuranceStatus');
}

function validateInspectionFields(details, rules) {
  assertOptionalKey(rules.inspectorRoles, details.inspectorRole, 'inspectorRole');
  assertOptionalKey(rules.damageLevels, details.damageLevel, 'damageLevel');
  assertOptionalKey(rules.habitabilityStatuses, details.habitabilityStatus, 'habitabilityStatus');
}

function buildPendingPlan(status) {
  return {
    isApproved: false,
    status,
    claimRoute: 'Pending Inspection',
    responsibleAgency: 'Engineer and UDGR Required',
    isHighFinancialRisk: false,
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
      : buildPendingPlan(inspection.insuranceStatus);
  }
}

export class PropertyInspection {
  constructor(record, rules) {
    validatePropertyBase(record, rules);
    validateInspectionFields(record, rules);
    this.rules = rules;
    this.assignIdentity(record);
    this.assignInspectionFields(record);
  }

  assignIdentity(record) {
    this.id = record.id || `${DEFAULT_PROPERTY_PREFIX}-${Date.now()}`;
    this.propertyName = record.propertyName.trim();
    this.sector = record.sector;
    this.propertyType = record.propertyType;
    this.occupantRole = record.occupantRole;
    this.insuranceStatus = record.insuranceStatus;
  }

  assignInspectionFields(details) {
    this.inspectorRole = details.inspectorRole || DEFAULT_INSPECTOR_ROLE;
    this.damageLevel = details.damageLevel || null;
    this.habitabilityStatus = details.habitabilityStatus || null;
    this.evidencePhoto = String(details.evidencePhoto || '').trim();
    this.damageInventory = String(details.damageInventory || '').trim();
  }

  recordInspection(details) {
    validateInspectionFields(details, this.rules);
    this.assignInspectionFields(details);
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
