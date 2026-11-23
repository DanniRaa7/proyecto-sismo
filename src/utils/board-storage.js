import { PropertyInspection } from '../models/property-inspection.js';
import { PopulationTriage } from '../models/population-triage.js';

const BOARD_STORAGE_KEY = 'cali-quake-relief-board-v1';

function serializeProperty(item) {
  const { id, propertyName, sector, propertyType, occupantRole, insuranceStatus } = item;
  const { inspectorRole, damageLevel, habitabilityStatus, evidencePhoto, damageInventory } = item;
  return {
    id, propertyName, sector, propertyType, occupantRole, insuranceStatus,
    inspectorRole, damageLevel, habitabilityStatus, evidencePhoto, damageInventory,
  };
}

function serializeTriage(item) {
  return {
    id: item.id,
    fullName: item.fullName,
    sector: item.sector,
    age: item.age,
    group: item.group,
    ...item.flags,
  };
}

function parseStoredJson(storageRef) {
  const hasStorage = Boolean(storageRef && typeof storageRef.getItem === 'function');
  if (!hasStorage) return null;
  try {
    const raw = storageRef.getItem(BOARD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBoardState(storageRef, inspections, triages) {
  const hasStorage = Boolean(storageRef && typeof storageRef.setItem === 'function');
  if (!hasStorage) return;
  const payload = {
    inspections: inspections.map(serializeProperty),
    triages: triages.map(serializeTriage),
  };
  storageRef.setItem(BOARD_STORAGE_KEY, JSON.stringify(payload));
}

export function loadBoardState(storageRef, rules) {
  const parsed = parseStoredJson(storageRef);
  if (!parsed) return { inspections: [], triages: [] };
  const rawProperties = Array.isArray(parsed.inspections) ? parsed.inspections : [];
  const rawTriages = Array.isArray(parsed.triages) ? parsed.triages : [];
  return {
    inspections: rawProperties.map((record) => new PropertyInspection(record, rules)),
    triages: rawTriages.map((record) => new PopulationTriage(record, rules)),
  };
}

export function clearBoardState(storageRef) {
  const hasStorage = Boolean(storageRef && typeof storageRef.removeItem === 'function');
  if (hasStorage) storageRef.removeItem(BOARD_STORAGE_KEY);
}
