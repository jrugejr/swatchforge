import { seedData } from './data/seed-data.js';

const STORAGE_KEY = 'swatchforge:data:v0.1.0';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = clone(seedData);
    saveData(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw);
    return migrateData(parsed);
  } catch (error) {
    console.error('Failed to parse SwatchForge data. Loading seed data.', error);
    return clone(seedData);
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    const isQuota = error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    if (isQuota) {
      throw new Error('Storage is full. Try smaller photos, remove a few photos, or export a backup before adding more.');
    }
    throw error;
  }
}

export function resetData() {
  const seeded = clone(seedData);
  saveData(seeded);
  return seeded;
}

export function exportData(data) {
  const payload = {
    appName: 'SwatchForge',
    version: data.version || '0.1.0',
    exportedAt: new Date().toISOString(),
    ...data
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `swatchforge-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDataFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const migrated = migrateData(parsed);
        saveData(migrated);
        resolve(migrated);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function migrateData(data) {
  return {
    version: data.version || '0.1.0',
    settings: data.settings || clone(seedData.settings),
    items: Array.isArray(data.items) ? data.items : [],
    looks: Array.isArray(data.looks) ? data.looks : [],
    lookSteps: Array.isArray(data.lookSteps) ? data.lookSteps : []
  };
}
