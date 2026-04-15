// Module-level cache: displayCurrency → { walletCurrency: rate }
// rate = how many walletCurrency units equal 1 displayCurrency unit
const rateCache = new Map<string, Record<string, number>>();

interface FrankfurterResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Frankfurter only supports ECB currencies as base (EUR, USD, GBP, etc.)
// BRL, ARS, CLP, COP, PEN, MXN are NOT supported as base currency.
// Strategy: always fetch with base=EUR, then derive cross-rates.
const FRANKFURTER_BASE = 'EUR';

/**
 * Fetches exchange rates from Frankfurter API.
 * Always uses EUR as base to avoid unsupported base currency errors.
 * Returns rates where rate[currency] = how many units of `currency` equal 1 EUR.
 * Caches per session.
 */
async function fetchEurRates(currencies: string[]): Promise<Record<string, number>> {
  const cacheKey = '__EUR_BASE__';
  if (rateCache.has(cacheKey)) {
    return rateCache.get(cacheKey)!;
  }

  const targets = [...new Set(currencies)].filter((c) => c !== FRANKFURTER_BASE);
  if (targets.length === 0) {
    const empty: Record<string, number> = {};
    rateCache.set(cacheKey, empty);
    return empty;
  }

  const url = `https://api.frankfurter.dev/v1/latest?from=${FRANKFURTER_BASE}&to=${targets.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Frankfurter API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json() as FrankfurterResponse;
  const rates = data.rates ?? {};
  // Add EUR itself with rate 1
  rates[FRANKFURTER_BASE] = 1;
  rateCache.set(cacheKey, rates);
  return rates;
}

/**
 * Fetches exchange rates needed to convert wallet currencies to display currency.
 * Uses EUR as intermediate base for cross-rate calculation.
 * Returns rates object for use with convertAmount().
 */
export async function fetchRates(
  displayCurrency: string,
  walletCurrencies: string[]
): Promise<Record<string, number>> {
  const cacheKey = displayCurrency;
  if (rateCache.has(cacheKey)) {
    return rateCache.get(cacheKey)!;
  }

  const allCurrencies = [...new Set([displayCurrency, ...walletCurrencies])];
  const eurRates = await fetchEurRates(allCurrencies);

  // Build cross-rates: how many walletCurrency units = 1 displayCurrency
  // eurRates[X] = how many X per 1 EUR
  // To convert A → B: amount_in_A / eurRates[A] * eurRates[B]
  // But convertAmount does: amount / rates[fromCurrency]
  // So rates[fromCurrency] should = eurRates[fromCurrency] / eurRates[displayCurrency]
  const displayRate = eurRates[displayCurrency] ?? 1;
  const crossRates: Record<string, number> = {};

  for (const currency of allCurrencies) {
    const currencyRate = eurRates[currency] ?? 1;
    // crossRates[currency] = how many currency units equal 1 displayCurrency
    crossRates[currency] = currencyRate / displayRate;
  }

  rateCache.set(cacheKey, crossRates);
  return crossRates;
}

/**
 * Converts `amount` from `fromCurrency` to `toCurrency`.
 * `rates` must have been fetched via fetchRates(toCurrency, ...).
 * rates[fromCurrency] = how many fromCurrency units equal 1 toCurrency unit.
 *
 * If fromCurrency === toCurrency, returns amount unchanged.
 * Otherwise: convertedAmount = amount / rates[fromCurrency]
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  const rate = rates[fromCurrency];
  if (rate === undefined || rate === 0) return NaN;
  return amount / rate;
}

/** Clears the rate cache (useful for testing) */
export function clearRateCache(): void {
  rateCache.clear();
}
