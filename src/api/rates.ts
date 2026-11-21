export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface PrimaryResponse {
  date: string;
  usd?: Record<string, number>;
  [currency: string]: unknown;
}

export const PRIMARY_RATES_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
export const FALLBACK_RATES_URL = 'https://api.frankfurter.app/latest?from=USD';

function validateRates(base: unknown, date: unknown, rates: unknown): ExchangeRates {
  if (typeof base !== 'string' || base.trim() === '') {
    throw new Error('Exchange-rate response has no valid base currency');
  }
  if (typeof date !== 'string' || date.trim() === '') {
    throw new Error('Exchange-rate response has no valid date');
  }
  if (!rates || typeof rates !== 'object' || Array.isArray(rates)) {
    throw new Error('Exchange-rate response has no valid rates');
  }

  const normalized = Object.entries(rates).reduce<Record<string, number>>(
    (validRates, [currency, rate]) => {
      if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
        validRates[currency.toUpperCase()] = rate;
      }
      return validRates;
    },
    {},
  );

  if (Object.keys(normalized).length === 0) {
    throw new Error('Exchange-rate response contains no valid rates');
  }

  normalized[base.toUpperCase()] = 1;

  return { base: base.toUpperCase(), date, rates: normalized };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Rate API request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export function normalizePrimaryResponse(response: PrimaryResponse): ExchangeRates {
  if (!response.usd) {
    throw new Error('Primary exchange-rate response has no USD rates');
  }
  return validateRates('USD', response.date, response.usd);
}

export function normalizeFallbackResponse(response: unknown): ExchangeRates {
  if (
    !response ||
    typeof response !== 'object' ||
    Array.isArray(response) ||
    !('base' in response) ||
    !('date' in response) ||
    !('rates' in response)
  ) {
    throw new Error('Fallback exchange-rate response has an invalid format');
  }
  return validateRates(response.base, response.date, response.rates);
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    const primary = await fetchJson<PrimaryResponse>(PRIMARY_RATES_URL);
    return normalizePrimaryResponse(primary);
  } catch {
    try {
      const fallback = await fetchJson<unknown>(FALLBACK_RATES_URL);
      return normalizeFallbackResponse(fallback);
    } catch (fallbackError) {
      throw new Error('Unable to fetch exchange rates from any data source', {
        cause: fallbackError,
      });
    }
  }
}
