import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { IFlowlyRepository } from './IFlowlyRepository';
import { MockFlowlyRepository } from './MockFlowlyRepository';

export const RepositoryContext = createContext<IFlowlyRepository | null>(null);

export function RepositoryProvider({ children }: { children: ReactNode }) {
  // Fase atual: Mock. Futuramente: LocalFlowlyRepository
  const repo = useMemo(() => new MockFlowlyRepository(), []);
  return (
    <RepositoryContext.Provider value={repo}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository(): IFlowlyRepository {
  const repo = useContext(RepositoryContext);
  if (!repo) throw new Error('useRepository deve ser usado dentro de RepositoryProvider');
  return repo;
}
