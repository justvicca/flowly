// Module-level cache: displayCurrency → { walletCurrency: rate }
// rate = how many walletCurrency units equal 1 displayCurrency unit
// (Frankfurter response with from=displayCurrency)
const rateCache = new Map<string, Record<string, number>>();

interface FrankfurterResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

/**
 * Fetches exchange rates from Frankfurter API.
 * `displayCurrency` is the base (from); `walletCurrencies` are the targets (to).
 * Returns cached result if available.
 */
export async function fetchRates(
  displayCurrency: string,
  walletCurrencies: string[]
): Promise<Record<string, number>> {
  if (rateCache.has(displayCurrency)) {
    return rateCache.get(displayCurrency)!;
  }

  const targets = walletCurrencies.filter((c) => c !== displayCurrency);
  if (targets.length === 0) {
    const empty: Record<string, number> = {};
    rateCache.set(displayCurrency, empty);
    return empty;
  }

  const url = `https://api.frankfurter.app/latest?from=${displayCurrency}&to=${targets.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Frankfurter API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json() as FrankfurterResponse;
  const rates = data.rates ?? {};
  rateCache.set(displayCurrency, rates);
  return rates;
}

/**
 * Converts `amount` from `fromCurrency` to `toCurrency`.
 * `rates` must have been fetched with `from=toCurrency` (base = toCurrency).
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

/** Clears the rate cache (useful for testing or when display currency changes) */
export function clearRateCache(): void {
  rateCache.clear();
}
