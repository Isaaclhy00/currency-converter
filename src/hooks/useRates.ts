import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import {
  ExchangeRates,
  fetchExchangeRates,
  normalizeFallbackResponse,
} from '../api/rates';

const CACHE_KEY = 'currency-converter.exchange-rates.v1';

export const ratesQueryKey = ['exchange-rates', 'USD'] as const;

export interface RatesSnapshot extends ExchangeRates {
  fetchedAt: number;
  source: 'network' | 'cache';
}

interface StoredRates {
  data: ExchangeRates;
  fetchedAt: number;
}

export async function loadCachedRates(): Promise<RatesSnapshot | null> {
  const serialized = await AsyncStorage.getItem(CACHE_KEY);
  if (serialized === null) {
    return null;
  }

  let stored: unknown;
  try {
    stored = JSON.parse(serialized);
  } catch (error) {
    throw new Error('Saved exchange rates contain invalid JSON.', { cause: error });
  }

  if (
    !stored ||
    typeof stored !== 'object' ||
    !('data' in stored) ||
    !('fetchedAt' in stored) ||
    typeof stored.fetchedAt !== 'number' ||
    !Number.isFinite(stored.fetchedAt)
  ) {
    throw new Error('Saved exchange rates have an invalid format.');
  }

  const rates = normalizeFallbackResponse(stored.data);

  return { ...rates, fetchedAt: stored.fetchedAt, source: 'cache' };
}

async function saveRates(data: ExchangeRates, fetchedAt: number): Promise<void> {
  const stored: StoredRates = { data, fetchedAt };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(stored));
}

async function getRates(): Promise<RatesSnapshot> {
  const cachedRates = await loadCachedRates();
  let data: ExchangeRates;

  try {
    data = await fetchExchangeRates();
  } catch (error) {
    if (cachedRates) {
      return cachedRates;
    }
    throw error;
  }

  const fetchedAt = Date.now();
  await saveRates(data, fetchedAt);
  return { ...data, fetchedAt, source: 'network' };
}

export function useRates() {
  return useQuery({
    queryKey: ratesQueryKey,
    queryFn: getRates,
  });
}
