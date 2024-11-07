export function getLocalStorageItem(key) {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  export function setLocalStorageItem(key, value) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  export function removeLocalStorageItem(key) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
