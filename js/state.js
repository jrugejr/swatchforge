import { loadData, saveData } from './storage.js';

export const state = {
  route: 'home',
  params: {},
  data: loadData(),
  filters: {
    itemSearch: '',
    itemType: 'All',
    colorFamily: 'All',
    finish: 'All'
  }
};

export function persist() {
  saveData(state.data);
}

export function uid(prefix) {
  if (crypto?.randomUUID) return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
