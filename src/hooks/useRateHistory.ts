import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { fetchRateHistory, RateHistoryPoint } from '../api/history';

const CACHE_KEY_PREFIX = 'currency-converter.rate-history.v1';
const HISTORY_STALE_TIME = 24 * 60 * 60 * 1000;

export interface RateHistorySnapshot {
  points: RateHistoryPoint[];
  fetchedAt: number;
  source: 'network' | 'cache';
}

interface StoredHistory {
  points: RateHistoryPoint[];
  fetchedAt: number;
}

function cacheKey(base: string, quote: string): string {
  return `${CACHE_KEY_PREFIX}.${base}.${quote}`;
}

function validateCachedPoints(value: unknown): RateHistoryPoint[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Saved rate history contains no data');
  }

  const points = value.map((point: unknown) => {
    if (
      !point ||
      typeof point !== 'object' ||
      !('date' in point) ||
      !('rate' in point) ||
      typeof point.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(point.date) ||
      typeof point.rate !== 'number' ||
      !Number.isFinite(point.rate) ||
      point.rate <= 0
    ) {
      throw new Error('Saved rate history contains invalid data');
    }

    return { date: point.date, rate: point.rate };
  });

  return points.sort((first, second) => first.date.localeCompare(second.date));
}

async function loadCachedHistory(
  base: string,
  quote: string,
): Promise<RateHistorySnapshot | null> {
  const serialized = await AsyncStorage.getItem(cacheKey(base, quote));
  if (serialized === null) {
    return null;
  }

  let stored: unknown;
  try {
    stored = JSON.parse(serialized);
  } catch (error) {
    throw new Error('Saved rate history contains invalid JSON', { cause: error });
  }

  if (
    !stored ||
    typeof stored !== 'object' ||
    !('points' in stored) ||
    !('fetchedAt' in stored) ||
    typeof stored.fetchedAt !== 'number' ||
    !Number.isFinite(stored.fetchedAt)
  ) {
    throw new Error('Saved rate history has an invalid format');
  }

  return {
    points: validateCachedPoints(stored.points),
    fetchedAt: stored.fetchedAt,
    source: 'cache',
  };
}

async function saveHistory(
  base: string,
  quote: string,
  snapshot: StoredHistory,
): Promise<void> {
  await AsyncStorage.setItem(cacheKey(base, quote), JSON.stringify(snapshot));
}

async function getRateHistory(
  base: string,
  quote: string,
): Promise<RateHistorySnapshot> {
  const cachedHistory = await loadCachedHistory(base, quote);
  let points: RateHistoryPoint[];

  try {
    points = await fetchRateHistory(base, quote);
  } catch (error) {
    if (cachedHistory) {
      return cachedHistory;
    }
    throw error;
  }

  const fetchedAt = Date.now();
  await saveHistory(base, quote, { points, fetchedAt });
  return { points, fetchedAt, source: 'network' };
}

export function useRateHistory(
  base: string,
  quote: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['rate-history', base, quote],
    queryFn: () => getRateHistory(base, quote),
    staleTime: HISTORY_STALE_TIME,
    enabled,
    retry: false,
  });
}
