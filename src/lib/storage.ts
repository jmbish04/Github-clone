// src/lib/storage.ts
const NAMESPACE = 'forge-gitclone';
const getNamespacedKey = (key: string): string => `${NAMESPACE}:${key}`;

const hasLocalStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage = {
  get: <T>(key: string): T | null => {
    if (!hasLocalStorage) {
      // In SSR or environments without localStorage, return null rather than throwing.
      return null;
    }
    try {
      const item = window.localStorage.getItem(getNamespacedKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage`, error);
      return null;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (!hasLocalStorage) {
      // No-op in non-browser environments.
      return;
    }
    try {
      const item = JSON.stringify(value);
      window.localStorage.setItem(getNamespacedKey(key), item);
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage`, error);
    }
  },
  remove: (key: string): void => {
    if (!hasLocalStorage) {
      // No-op in non-browser environments.
      return;
    }
    try {
      window.localStorage.removeItem(getNamespacedKey(key));
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage`, error);
    }
  },
};