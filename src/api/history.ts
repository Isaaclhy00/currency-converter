export interface RateHistoryPoint {
  date: string;
  rate: number;
}

// const HISTORY_DAYS = 30;
export type HistoryRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';
const HISTORY_API_URL = 'https://api.frankfurter.dev/v2/rates';
function getStartDateForRange(end: Date, range: HistoryRange): Date {
  const start = new Date(end);
  switch (range) {
    case '1W':
      start.setUTCDate(start.getUTCDate() - 7);
      break;
    case '1M':
      start.setUTCMonth(start.getUTCMonth() - 1);
      break;
    case '3M':
      start.setUTCMonth(start.getUTCMonth() - 3);
      break;
    case '6M':
      start.setUTCMonth(start.getUTCMonth() - 6);
      break;
    case '1Y':
      start.setUTCFullYear(start.getUTCFullYear() - 1);
      break;
    case '5Y':
      start.setUTCFullYear(start.getUTCFullYear() - 5);
      break;
  }
  return start;
}

function isValidDate(date: unknown): date is string {
  return (
    typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00Z`))
  );
}

function sortAndValidatePoints(points: unknown): RateHistoryPoint[] {
  if (!Array.isArray(points) || points.length === 0) {
    throw new Error('Rate history response contains no data');
  }

  const normalized = points.map((point: unknown) => {
    if (
      !point ||
      typeof point !== 'object' ||
      !('date' in point) ||
      !('rate' in point) ||
      !isValidDate(point.date) ||
      typeof point.rate !== 'number' ||
      !Number.isFinite(point.rate) ||
      point.rate <= 0
    ) {
      throw new Error('Rate history response contains invalid data');
    }

    return { date: point.date, rate: point.rate };
  });

  return normalized.sort((first, second) => first.date.localeCompare(second.date));
}

export function normalizeRateHistory(
  response: unknown,
  base: string,
  quote: string,
): RateHistoryPoint[] {
  if (!Array.isArray(response) || response.length === 0) {
    throw new Error('Rate history response contains no data');
  }

  const rows = response.map((row: unknown) => {
    if (
      !row ||
      typeof row !== 'object' ||
      !('base' in row) ||
      !('quote' in row) ||
      !('date' in row) ||
      !('rate' in row) ||
      typeof row.base !== 'string' ||
      typeof row.quote !== 'string' ||
      row.base.toUpperCase() !== base ||
      row.quote.toUpperCase() !== quote
    ) {
      throw new Error('Rate history response does not match the requested pair');
    }

    return { date: row.date, rate: row.rate };
  });

  return sortAndValidatePoints(rows);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function makeIdentityHistory(range: HistoryRange): RateHistoryPoint[] {
  const end = new Date();
  const start = getStartDateForRange(end, range);
  const totalDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return Array.from({ length: totalDays + 1 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return { date: formatDate(date), rate: 1 };
  });
}

export async function fetchRateHistory(
  base: string,
  quote: string,
  range: HistoryRange = '1M',
): Promise<RateHistoryPoint[]> {
  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote)) {
    throw new Error('Currency codes must be three uppercase letters');
  }
  if (base === quote) {
    return makeIdentityHistory(range);
  }

  const end = new Date();
  const start = getStartDateForRange(end, range);
  const url = `${HISTORY_API_URL}?from=${formatDate(start)}&to=${formatDate(
    end,
  )}&base=${base}&quotes=${quote}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Rate history request failed with status ${response.status}`);
  }

  const data: unknown = await response.json();
  return normalizeRateHistory(data, base, quote);
}
