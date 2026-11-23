import { useQuery } from '@tanstack/react-query';
import { fetchCurrencyTrends } from '../api/trends';

const TRENDS_STALE_TIME = 6 * 60 * 60 * 1000;

export function useCurrencyTrends(
  base: string,
  quotes: string[],
  enabled = true,
) {
  return useQuery({
    queryKey: ['currency-trends', base, quotes],
    queryFn: () => fetchCurrencyTrends(base, quotes),
    staleTime: TRENDS_STALE_TIME,
    enabled,
    retry: false,
  });
}
