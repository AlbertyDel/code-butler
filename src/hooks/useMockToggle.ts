import { useState, useCallback } from 'react';

export function useMockToggle(storageKey: string) {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });

  const toggle = useCallback((value: boolean) => {
    setEnabled(value);
    try { localStorage.setItem(storageKey, value ? '1' : '0'); } catch {}
  }, [storageKey]);

  return [enabled, toggle] as const;
}
