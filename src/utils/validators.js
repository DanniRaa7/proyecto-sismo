export function assertLookupKey(lookupMap, key, fieldName) {
  const hasKey = Boolean(lookupMap && Object.hasOwn(lookupMap, key));
  if (!hasKey) {
    throw new Error(`Invalid ${fieldName}: ${key}`);
  }
}

export function assertNonEmptyText(value, fieldName) {
  const isValidText = typeof value === 'string' && value.trim().length > 0;
  if (!isValidText) {
    throw new Error(`Missing required ${fieldName}`);
  }
}

export function assertNumberInRange(value, minValue, maxValue, fieldName) {
  const isValidNumber = typeof value === 'number' && !Number.isNaN(value);
  const isInRange = isValidNumber && value >= minValue && value <= maxValue;
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

export function getSortedLightKeys(trafficLights) {
  return Object.entries(trafficLights)
    .sort(([, firstRule], [, secondRule]) => secondRule.rank - firstRule.rank)
    .map(([lightKey]) => lightKey);
}
