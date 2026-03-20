"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);
  
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValueRef.current;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(initialValueRef.current);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const newValue = readValue();
    setStoredValue((prev) => {
      const prevStr = JSON.stringify(prev);
      const newStr = JSON.stringify(newValue);
      return prevStr !== newStr ? newValue : prev;
    });
    setIsHydrated(true);

    const handleStorageChange = (e: Event | StorageEvent) => {
      if (e.type === "storage" && (e as StorageEvent).key !== key) return;
      
      const changedValue = readValue();
      setStoredValue((prev) => {
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(changedValue);
        return prevStr !== newStr ? changedValue : prev;
      });
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleStorageChange);
    };
  }, [key, readValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        setTimeout(() => {
          window.dispatchEvent(new Event("local-storage"));
        }, 0);
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, isHydrated] as const;
}
