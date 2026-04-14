import type { Idioma } from '../../contexts/PreferencesContext';

// ── Types ──────────────────────────────────────────────────────────────────

export type Region = 'brazil' | 'europe';

export interface BelvoAccount {
  id: string;
  name: string;
  institution: { name: string };
  type: string;
  balance: { current: number };
  currency: string;
}

export interface BelvoTransaction {
  id: string;
  description: string;
  amount: number;
  value_date: string;
  type: 'INFLOW' | 'OUTFLOW';
  account: { id: string };
}

export interface GoCardlessInstitution {
  id: string;
  name: string;
  logo: string;
  countries: string[];
}

export interface GoCardlessRequisition {
  id: string;
  link: string;
  status: string;
  accounts: string[];
}

export interface GoCardlessTransaction {
  transactionId: string;
  bookingDate: string;
  transactionAmount: {
    amount: string; // e.g. "-42.50" or "1200.00"
    currency: string;
  };
  remittanceInformationUnstructured?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const BELVO_WIDGET_SCRIPT = 'https://cdn.belvo.com/belvo-widget-1-stable.js';
export const GOCARDLESS_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';
export const BELVO_BASE_URL = 'https://sandbox.belvo.com/api/v2';

// ── Pure functions ─────────────────────────────────────────────────────────

/** Maps Idioma to Region: 'pt' → 'brazil', all others → 'europe' */
export function detectRegion(idioma: Idioma): Region {
  return idioma === 'pt' ? 'brazil' : 'europe';
}

/** Returns date range: from = first day of previous month, to = today */
export function getDateRange(): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
}

/** Maps Belvo transaction type to Flowly tipo */
export function detectBelvoTransactionType(type: 'INFLOW' | 'OUTFLOW'): 'entrada' | 'saida' {
  return type === 'INFLOW' ? 'entrada' : 'saida';
}

/** Maps GoCardless transaction amount string to Flowly tipo */
export function detectGoCardlessTransactionType(amount: string): 'entrada' | 'saida' {
  return parseFloat(amount) >= 0 ? 'entrada' : 'saida';
}
