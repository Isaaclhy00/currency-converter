const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW']);

export function getDecimalPlaces(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

export function convert(
  amount: number,
  fromRate: number,
  toRate: number,
  toCurrency: string,
): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError('Amount must be a finite, non-negative number');
  }
  if (!Number.isFinite(fromRate) || fromRate <= 0) {
    throw new RangeError('From rate must be a finite number greater than zero');
  }
  if (!Number.isFinite(toRate) || toRate <= 0) {
    throw new RangeError('To rate must be a finite number greater than zero');
  }

  const decimalPlaces = getDecimalPlaces(toCurrency);
  const result = (amount / fromRate) * toRate;
  const factor = 10 ** decimalPlaces;

  return Math.round((result + Number.EPSILON) * factor) / factor;
}
