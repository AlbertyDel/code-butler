import { createContext, useContext, useState, type ReactNode } from 'react';

export type BusinessState = 'promo' | 'pending' | 'active' | 'rejected';

interface BusinessStateContextValue {
  businessState: BusinessState;
  setBusinessState: (state: BusinessState) => void;
}

const BusinessStateContext = createContext<BusinessStateContextValue | null>(null);

export function BusinessStateProvider({ children }: { children: ReactNode }) {
  const [businessState, setBusinessState] = useState<BusinessState>('promo');

  return (
    <BusinessStateContext.Provider value={{ businessState, setBusinessState }}>
      {children}
    </BusinessStateContext.Provider>
  );
}

export function useBusinessState() {
  const ctx = useContext(BusinessStateContext);
  if (!ctx) throw new Error('useBusinessState must be used within BusinessStateProvider');
  return ctx;
}
