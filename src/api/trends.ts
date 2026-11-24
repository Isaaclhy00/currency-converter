export type TrendDirection = 'up' | 'down' | 'flat';

export interface CurrencyTrend {
  direction: TrendDirection;
  changePercent: number;
}

export type CurrencyTrends = Record<string, CurrencyTrend>;

const TREND_DAYS = 7;
const TRENDS_API_URL = 'https://api.frankfurter.dev/v2/rates';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isValidDate(date: unknown): date is string {
  return (
    typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00Z`))
  );
}

export function normalizeCurrencyTrends(
  response: unknown,
  base: string,
  quotes: string[],
): CurrencyTrends {
  if (!Array.isArray(response)) {
    throw new Error('Currency trend response has an invalid format');
  }

  const requestedQuotes = new Set(quotes);
  const pointsByQuote = new Map<string, Array<{ date: string; rate: number }>>();

  for (const row of response) {
    if (
      !row ||
      typeof row !== 'object' ||
      !('base' in row) ||
      !('quote' in row) ||
      !('date' in row) ||
      !('rate' in row) ||
      typeof row.base !== 'string' ||
      row.base.toUpperCase() !== base ||
      typeof row.quote !== 'string' ||
      !isValidDate(row.date) ||
      typeof row.rate !== 'number' ||
      !Number.isFinite(row.rate) ||
      row.rate <= 0
    ) {
      throw new Error('Currency trend response contains invalid data');
    }

    const quote = row.quote.toUpperCase();
    if (!requestedQuotes.has(quote)) {
      continue;
    }

    const points = pointsByQuote.get(quote) ?? [];
    points.push({ date: row.date, rate: row.rate });
    pointsByQuote.set(quote, points);
  }

  return Object.fromEntries(
    Array.from(pointsByQuote).flatMap(([quote, points]) => {
      if (points.length < 2) {
        return [];
      }

      points.sort((first, second) => first.date.localeCompare(second.date));
      const firstRate = points[0].rate;
      const lastRate = points[points.length - 1].rate;
      const changePercent = ((lastRate - firstRate) / firstRate) * 100;

      return [[
        quote,
        {
          direction:
            lastRate > firstRate ? 'up' : lastRate < firstRate ? 'down' : 'flat',
          changePercent,
        },
      ]];
    }),
  );
}

export async function fetchCurrencyTrends(
  base: string,
  quotes: string[],
): Promise<CurrencyTrends> {
  if (!/^[A-Z]{3}$/.test(base)) {
    throw new Error('Base currency must be a three-letter uppercase code');
  }
  if (quotes.some((quote) => !/^[A-Z]{3}$/.test(quote))) {
    throw new Error('Quote currencies must be three-letter uppercase codes');
  }

  const uniqueQuotes = [...new Set(quotes)].filter((quote) => quote !== base);
  if (uniqueQuotes.length === 0) {
    return {};
  }

  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - TREND_DAYS);

  const params = new URLSearchParams({
    from: formatDate(start),
    to: formatDate(end),
    base,
  });
  const response = await fetch(`${TRENDS_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Currency trend request failed with status ${response.status}`);
  }

  return normalizeCurrencyTrends(await response.json(), base, uniqueQuotes);
}
