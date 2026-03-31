import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { IFlowlyRepository } from './IFlowlyRepository';
import { LocalStorageFlowlyRepository } from './LocalStorageFlowlyRepository';

export const RepositoryContext = createContext<IFlowlyRepository | null>(null);

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => new LocalStorageFlowlyRepository(), []);
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
