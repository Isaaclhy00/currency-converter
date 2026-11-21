import {
  CURRENCY_OPTIONS,
  CurrencyOption,
  MOST_USED_CURRENCY_CODES,
} from '../constants/currencies';

export interface CurrencySection {
  title: string;
  data: CurrencyOption[];
}

export function getCurrencySections(
  rates: Record<string, number>,
): CurrencySection[] {
  const available = CURRENCY_OPTIONS.filter(
    ({ code }) => Number.isFinite(rates[code]) && rates[code] > 0,
  ).sort(
    (first, second) =>
      first.country.localeCompare(second.country, 'en') ||
      first.code.localeCompare(second.code),
  );
  const optionsByCode = new Map(available.map((option) => [option.code, option]));
  const mostUsed = MOST_USED_CURRENCY_CODES.flatMap((code) => {
    const option = optionsByCode.get(code);
    return option ? [option] : [];
  });

  return [
    { title: 'Most used', data: mostUsed },
    { title: 'All currencies', data: available },
  ].filter((section) => section.data.length > 0);
}
