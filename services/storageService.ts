import React from 'react';

// A simple abstraction over localStorage for type safety and easier refactoring.

export const storageService = {
  get<T>(key: string, initialValue: T): T {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  },
  
  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  },
};

export const usePersistentState = <T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = React.useState<T>(() => storageService.get(key, initialValue));

  React.useEffect(() => {
    storageService.set(key, state);
  }, [key, state]);

  return [state, setState];
};