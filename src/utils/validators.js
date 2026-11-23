const ID_STATE = { sequence: 0 };
const DEFAULT_MAX_TEXT_LENGTH = 240;

const REQUIRED_RULE_SECTIONS = [
  'trafficLights',
  'sectors',
  'propertyTypes',
  'occupantRoles',
  'inspectorRoles',
  'damageLevels',
  'habitabilityStatuses',
  'insuranceStatuses',
  'ageBrackets',
  'vulnerabilityFlags',
  'populationGroups',
  'triageThresholds',
  'limits',
];

export function createUniqueId(prefix) {
  ID_STATE.sequence += 1;
  return `${prefix}-${Date.now()}-${ID_STATE.sequence}`;
}

export function assertRecordObject(record, label) {
  const isObject = Boolean(record && typeof record === 'object' && !Array.isArray(record));
  if (!isObject) {
    throw new Error(`Invalid ${label} record`);
  }
}

export function assertLookupKey(lookupMap, key, fieldName) {
  const hasKey = Boolean(lookupMap && Object.hasOwn(lookupMap, key));
  if (!hasKey) {
    throw new Error(`Invalid ${fieldName}: ${key}`);
  }
}

export function assertNonEmptyText(value, fieldName, maxLength = DEFAULT_MAX_TEXT_LENGTH) {
  const isString = typeof value === 'string';
  const trimmed = isString ? value.trim() : '';
  const isWithinLimit = trimmed.length > 0 && trimmed.length <= maxLength;
  if (!isWithinLimit) {
    throw new Error(`Missing or invalid ${fieldName}`);
  }
}

export function assertOptionalMaxLength(value, fieldName, maxLength = DEFAULT_MAX_TEXT_LENGTH) {
  const isTooLong = String(value || '').trim().length > maxLength;
  if (isTooLong) {
    throw new Error(`Field ${fieldName} exceeds max length of ${maxLength}`);
  }
}

export function assertIntegerInRange(value, minValue, maxValue, fieldName) {
  const isInteger = Number.isInteger(value);
  const isInRange = isInteger && value >= minValue && value <= maxValue;
  if (!isInRange) {
    throw new Error(`Invalid ${fieldName}: ${value}`);
  }
}

export function assertInstance(candidate, ExpectedClass, className) {
  const isMatchingInstance = candidate instanceof ExpectedClass;
  if (!isMatchingInstance) {
    throw new Error(`Expected a valid ${className} instance`);
  }
}

export function assertRulesSchema(rules) {
  assertRecordObject(rules, 'city rules YAML');
  const missingSection = REQUIRED_RULE_SECTIONS.find((section) => !Object.hasOwn(rules, section));
  if (missingSection) {
    throw new Error(`Invalid city rules YAML: missing ${missingSection}`);
  }
}

export function getSortedLightKeys(trafficLights) {
  return Object.entries(trafficLights)
    .sort(([, firstRule], [, secondRule]) => secondRule.rank - firstRule.rank)
    .map(([lightKey]) => lightKey);
}
