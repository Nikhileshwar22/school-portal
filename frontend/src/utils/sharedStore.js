/**
 * Shared Data Store
 * Single source of truth for mock data across all dashboards.
 * Uses localStorage to persist data between page navigations.
 */
import { generateAllMockData } from './mockData';

const STORE_KEY = 'school_portal_data';

/**
 * Get shared data - loads from localStorage or generates fresh
 */
export const getSharedData = () => {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore parse errors
  }

  // Generate fresh data and store it
  const data = generateAllMockData(45);
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  return data;
};

/**
 * Save data back to store
 */
export const saveSharedData = (data) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save shared data:', e);
  }
};

/**
 * Update a specific collection in the store
 */
export const updateCollection = (collectionName, newData) => {
  const data = getSharedData();
  data[collectionName] = newData;
  saveSharedData(data);
  return data;
};

/**
 * Add item to a collection
 */
export const addToCollection = (collectionName, item) => {
  const data = getSharedData();
  if (!data[collectionName]) data[collectionName] = [];
  data[collectionName].push(item);
  saveSharedData(data);
  return data[collectionName];
};

/**
 * Reset all data (regenerate)
 */
export const resetSharedData = () => {
  localStorage.removeItem(STORE_KEY);
  return getSharedData();
};

export default {
  getSharedData,
  saveSharedData,
  updateCollection,
  addToCollection,
  resetSharedData,
};
