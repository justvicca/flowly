import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export type Tema = 'claro' | 'escuro' | 'creme';

export type Moeda = {
  codigo: string;   // BRL, USD, EUR…
  simbolo: string;  // R$, $, €…
  nome: string;
};

export const MOEDAS: Moeda[] = [
  { codigo: 'BRL', simbolo: 'R$', nome: 'Real Brasileiro' },
  { codigo: 'USD', simbolo: '$',  nome: 'Dólar Americano' },
  { codigo: 'EUR', simbolo: '€',  nome: 'Euro' },
  { codigo: 'GBP', simbolo: '£',  nome: 'Libra Esterlina' },
  { codigo: 'JPY', simbolo: '¥',  nome: 'Iene Japonês' },
  { codigo: 'ARS', simbolo: '$',  nome: 'Peso Argentino' },
  { codigo: 'CLP', simbolo: '$',  nome: 'Peso Chileno' },
  { codigo: 'MXN', simbolo: '$',  nome: 'Peso Mexicano' },
];

export interface Preferences {
  tema: Tema;
  moeda: Moeda;
}

const DEFAULT: Preferences = {
  tema: 'claro',
  moeda: MOEDAS[0],
};

// ── Persistence ────────────────────────────────────────────────────────────

const KEY = 'flowly:preferences';

function load(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      tema: parsed.tema ?? DEFAULT.tema,
      moeda: parsed.moeda ?? DEFAULT.moeda,
    };
  } catch {
    return DEFAULT;
  }
}

function save(p: Preferences) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

// ── Reducer ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_TEMA'; payload: Tema }
  | { type: 'SET_MOEDA'; payload: Moeda };

function reducer(state: Preferences, action: Action): Preferences {
  switch (action.type) {
    case 'SET_TEMA':  return { ...state, tema: action.payload };
    case 'SET_MOEDA': return { ...state, moeda: action.payload };
    default: return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────

interface PreferencesContextValue extends Preferences {
  setTema(t: Tema): void;
  setMoeda(m: Moeda): void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => { save(state); }, [state]);

  // Apply CSS variables for theme
  useEffect(() => {
    const root = document.documentElement;
    const themes: Record<Tema, Record<string, string>> = {
      claro: {
        '--bg': '#f5f7fa',
        '--surface': '#ffffff',
        '--surface2': '#f0f2f5',
        '--text': '#1a1a2e',
        '--text2': '#555',
        '--border': '#e0e0e0',
        '--primary': '#8b5e6d',
        '--primary-text': '#ffffff',
        '--nav-bg': '#1565c0',
        '--nav-text': '#ffffff',
      },
      escuro: {
        '--bg': '#121212',
        '--surface': '#1e1e1e',
        '--surface2': '#2a2a2a',
        '--text': '#e8e8e8',
        '--text2': '#aaa',
        '--border': '#333',
        '--primary': '#c48b9f',
        '--primary-text': '#1a1a1a',
        '--nav-bg': '#1a1a1a',
        '--nav-text': '#e8e8e8',
      },
      creme: {
        '--bg': '#faf6f0',
        '--surface': '#fffdf8',
        '--surface2': '#f5efe6',
        '--text': '#3d2b1f',
        '--text2': '#7a6050',
        '--border': '#e8ddd0',
        '--primary': '#9b6b4a',
        '--primary-text': '#ffffff',
        '--nav-bg': '#7a5c3e',
        '--nav-text': '#fffdf8',
      },
    };
    const vars = themes[state.tema];
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [state.tema]);

  return (
    <PreferencesContext.Provider value={{
      ...state,
      setTema: (t) => dispatch({ type: 'SET_TEMA', payload: t }),
      setMoeda: (m) => dispatch({ type: 'SET_MOEDA', payload: m }),
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences deve ser usado dentro de PreferencesProvider');
  return ctx;
}
