import { useLocalSearchParams } from 'expo-router';
import {
  isHistoryRange,
  RateHistoryDetailScreen,
} from '../src/components/RateHistoryDetailScreen';

type RateHistoryDetailParams = {
  fromCurrency?: string | string[];
  toCurrency?: string | string[];
  currentRate?: string | string[];
  range?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const options = {
  presentation: 'fullScreenModal',
  gestureEnabled: false,
  nativeBackButtonDismissalEnabled: false,
} as const;

export default function RateHistoryDetailRoute() {
  const params = useLocalSearchParams<RateHistoryDetailParams>();

  const fromCurrencyParam = firstParam(params.fromCurrency);
  const toCurrencyParam = firstParam(params.toCurrency);
  const currentRateParam = firstParam(params.currentRate);
  const rangeParam = firstParam(params.range);

  const fromCurrency = (fromCurrencyParam ?? 'USD').toUpperCase();
  const toCurrency = (toCurrencyParam ?? 'EUR').toUpperCase();

  const parsedCurrentRate =
    currentRateParam !== undefined ? Number(currentRateParam) : Number.NaN;
  const currentRate =
    Number.isFinite(parsedCurrentRate) && parsedCurrentRate > 0
      ? parsedCurrentRate
      : undefined;

  return (
    <RateHistoryDetailScreen
      fromCurrency={fromCurrency}
      toCurrency={toCurrency}
      currentRate={currentRate}
      initialRange={isHistoryRange(rangeParam) ? rangeParam : undefined}
    />
  );
}
