import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SessionFlowState } from '@/types/session-flow';

interface SessionFlowContextValue {
  /** Текущее UI-состояние сценария зарядки (приходит от сервера) */
  flowState: SessionFlowState;
  /** Установить состояние (в проде — по данным сервера, в деве — вручную) */
  setFlowState: (state: SessionFlowState) => void;
}

const SessionFlowContext = createContext<SessionFlowContextValue | undefined>(undefined);

export function SessionFlowProvider({ children }: { children: ReactNode }) {
  const [flowState, setFlowState] = useState<SessionFlowState>('idle');

  const handleSetFlowState = useCallback((state: SessionFlowState) => {
    setFlowState(state);
  }, []);

  return (
    <SessionFlowContext.Provider value={{ flowState, setFlowState: handleSetFlowState }}>
      {children}
    </SessionFlowContext.Provider>
  );
}

export function useSessionFlow() {
  const ctx = useContext(SessionFlowContext);
  if (!ctx) throw new Error('useSessionFlow must be used within SessionFlowProvider');
  return ctx;
}
