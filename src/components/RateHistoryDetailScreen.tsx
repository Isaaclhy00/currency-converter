import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useRateHistory } from '../hooks/useRateHistory';
import {
  HistoryRange,
  RateHistoryDetail,
  RateHistoryPoint,
} from './RateHistoryDetail';

const DEFAULT_RANGE: HistoryRange = '1M';

const HISTORY_RANGES: readonly HistoryRange[] = [
  '1W',
  '1M',
  '3M',
  '6M',
  '1Y',
  '5Y',
];

const RANGE_DAYS: Record<HistoryRange, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  '5Y': 1825,
};

export interface RateHistoryDetailScreenProps {
  fromCurrency: string;
  toCurrency: string;
  currentRate?: number;
  initialRange?: HistoryRange;
  onBack?: () => void;
}

export function RateHistoryDetailScreen({
  fromCurrency,
  toCurrency,
  currentRate,
  initialRange = DEFAULT_RANGE,
  onBack,
}: RateHistoryDetailScreenProps) {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<HistoryRange>(initialRange);
  const historyQuery = useRateHistory(fromCurrency, toCurrency);

  const points = useMemo(
    () => historyQuery.data?.points ?? [],
    [historyQuery.data?.points],
  );

  const data = useMemo(
    () => filterPointsForRange(points, selectedRange),
    [points, selectedRange],
  );

  const latestRate =
    points.length > 0 ? points[points.length - 1].rate : undefined;
  const resolvedCurrentRate =
    typeof currentRate === 'number' &&
    Number.isFinite(currentRate) &&
    currentRate > 0
      ? currentRate
      : latestRate ?? 1;

  return (
    <RateHistoryDetail
      fromCurrency={fromCurrency}
      toCurrency={toCurrency}
      currentRate={resolvedCurrentRate}
      data={data}
      selectedRange={selectedRange}
      onSelectRange={setSelectedRange}
      isLoading={historyQuery.isPending}
      onBack={onBack ?? (() => router.back())}
    />
  );
}

export function isHistoryRange(value: unknown): value is HistoryRange {
  return (
    typeof value === 'string' &&
    (HISTORY_RANGES as readonly string[]).includes(value)
  );
}

function filterPointsForRange(
  points: RateHistoryPoint[],
  range: HistoryRange,
): RateHistoryPoint[] {
  if (points.length === 0) return points;

  const days = RANGE_DAYS[range];
  const lastPointDate = new Date(`${points[points.length - 1].date}T00:00:00Z`);
  if (Number.isNaN(lastPointDate.getTime())) return points;

  const cutoff = new Date(lastPointDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - days + 1);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  return points.filter((point) => point.date >= cutoffIso);
}
