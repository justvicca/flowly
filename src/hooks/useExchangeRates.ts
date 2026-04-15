import { useState, useEffect } from 'react';
import { fetchRates } from '../services/exchangeRateService';

interface UseExchangeRatesResult {
  rates: Record<string, number> | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches exchange rates from Frankfurter API for the given display currency.
 * Skips fetch if all wallet currencies match the display currency.
 * Caches results per display currency for the session.
 */
export function useExchangeRates(
  displayCurrency: string,
  walletCurrencies: string[]
): UseExchangeRatesResult {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const effectiveCurrencies = walletCurrencies.map((c) => c || 'BRL');
    const diffCurrencies = effectiveCurrencies.filter((c) => c !== displayCurrency);

    if (diffCurrencies.length === 0) {
      setRates(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRates(displayCurrency, effectiveCurrencies)
      .then((r) => {
        if (!cancelled) {
          setRates(r);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao buscar taxas de câmbio');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayCurrency, walletCurrencies.join(',')]);

  return { rates, loading, error };
}
