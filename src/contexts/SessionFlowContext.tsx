import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SessionFlowState } from '@/types/session-flow';

interface SessionFlowContextValue {
  flowState: SessionFlowState;
  setFlowState: (state: SessionFlowState) => void;
  /** Сбросить waiting_for_connector в idle (смена станции, повторный запуск) */
  dismissConnectorBanner: () => void;
}

const SessionFlowContext = createContext<SessionFlowContextValue | undefined>(undefined);

export function SessionFlowProvider({ children }: { children: ReactNode }) {
  const [flowState, setFlowState] = useState<SessionFlowState>('idle');

  const handleSetFlowState = useCallback((state: SessionFlowState) => {
    setFlowState(state);
  }, []);

  const dismissConnectorBanner = useCallback(() => {
    setFlowState((prev) => (prev === 'waiting_for_connector' ? 'idle' : prev));
  }, []);

  return (
    <SessionFlowContext.Provider value={{ flowState, setFlowState: handleSetFlowState, dismissConnectorBanner }}>
      {children}
    </SessionFlowContext.Provider>
  );
}

export function useSessionFlow() {
  const ctx = useContext(SessionFlowContext);
  if (!ctx) throw new Error('useSessionFlow must be used within SessionFlowProvider');
  return ctx;
}
