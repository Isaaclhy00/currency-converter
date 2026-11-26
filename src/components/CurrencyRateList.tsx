import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ViewInstance } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { CurrencyOption } from '../constants/currencies';
import type { RatesSnapshot } from '../hooks/useRates';
import type { CurrencyTrend } from '../api/trends';
import { useCurrencyTrends } from '../hooks/useCurrencyTrends';
import { CurrencyPickerDropdown } from './CurrencyPickerDropdown';
import type { PickerAnchor } from './CurrencyPickerDropdown';
import { getCurrencySections } from '../utils/currencyOptions';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface CurrencyRateListProps {
  baseCurrency: string;
  onBaseCurrencyChange: (currency: string) => void;
  rates: RatesSnapshot | undefined;
  ratesError: string | null;
  ratesLoading: boolean;
  onRetryRates: () => void;
}

export function CurrencyRateList({
  baseCurrency,
  onBaseCurrencyChange,
  rates,
  ratesError,
  ratesLoading,
  onRetryRates,
}: CurrencyRateListProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<PickerAnchor | null>(null);
  const baseButtonRef = useRef<ViewInstance>(null);
  const sections = useMemo(
    () => getCurrencySections(rates?.rates ?? {}),
    [rates?.rates],
  );
  const currencies = useMemo(
    () =>
      (sections.find((section) => section.title === 'All currencies')?.data ??
        []).filter(({ code }) => code !== baseCurrency),
    [baseCurrency, sections],
  );
  const quoteCodes = useMemo(
    () => currencies.map(({ code }) => code),
    [currencies],
  );
  const trendsQuery = useCurrencyTrends(
    baseCurrency,
    quoteCodes,
    rates !== undefined,
  );
  const baseRate = rates?.rates[baseCurrency];

  const openRateHistoryDetail = (quoteCurrency: string, rate: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/rate-history-detail',
      params: {
        fromCurrency: baseCurrency,
        toCurrency: quoteCurrency,
        ...(Number.isFinite(rate) && rate > 0
          ? { currentRate: String(rate) }
          : {}),
      },
    });
  };

  const openBasePicker = () => {
    baseButtonRef.current?.measureInWindow((x, y, width, height) => {
      setPickerAnchor({ x, y, width, height });
      setPickerVisible(true);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: colors.titleText }]}>Currency rates</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>{baseCurrency} · 7-day trend</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Refresh exchange rates"
            accessibilityRole="button"
            disabled={ratesLoading}
            onPress={() => {
              onRetryRates();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.iconButton, { backgroundColor: colors.softBtnBg }]}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Base currency ${baseCurrency}`}
            accessibilityRole="button"
            onPress={openBasePicker}
            ref={baseButtonRef}
            style={[styles.baseButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          >
            <Text style={[styles.baseButtonText, { color: colors.titleText }]}>{baseCurrency}</Text>
            {/* <Text style={styles.chevron}>⌄</Text> */}
            <Ionicons 
              name="chevron-down" 
              size={16} 
              color="#333333" 
              style={styles.chevron} 
            />
          </Pressable>
        </View>
      </View>

      {ratesLoading && !rates ? (
        <View style={styles.messageState}>
          <ActivityIndicator />
          <Text style={[styles.messageText, { color: colors.subtext }]}>Loading exchange rates…</Text>
        </View>
      ) : ratesError && !rates ? (
        <View style={styles.messageState}>
          <Text style={[styles.errorText, { color: colors.subtext }]}>{ratesError}</Text>
          <Pressable onPress={() => {
            onRetryRates();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }} style={styles.retryButton}>
            <Text style={[styles.retryText, { color: colors.accent }]}>Try again</Text>
          </Pressable>
        </View>
      ) : rates && baseRate ? (
        <>
          <Text style={[styles.rateDate, { color: colors.subtext }]}>
            {rates.source === 'cache'
              ? `Saved rates · ${new Date(rates.fetchedAt).toLocaleString()}`
              : `Updated ${rates.date} · ${formatFetchTime(
                  rates.fetchedAt,
                )}`}
          </Text>
          {trendsQuery.isError ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => trendsQuery.refetch()}
              style={styles.trendNotice}
            >
              <Text style={styles.trendNoticeText}>
                Trends unavailable. Tap to retry.
              </Text>
            </Pressable>
          ) : trendsQuery.isFetching ? (
            <Text style={[styles.trendNoticeText, { color: colors.subtext }]}>Loading 7-day trends…</Text>
          ) : null}
          <FlatList
            contentContainerStyle={styles.listContent}
            data={currencies}
            keyExtractor={(item) => item.code}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                No currencies are available for this base currency.
              </Text>
            }
            renderItem={({ item }) => {
              const rate = rates.rates[item.code] / baseRate;
              const trend = trendsQuery.data?.[item.code];

              return (
                <CurrencyRateRow
                  currency={item}
                  rate={rate}
                  trend={trend}
                  onPress={() => openRateHistoryDetail(item.code, rate)}
                />
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <View style={styles.messageState}>
          <Text style={styles.emptyText}>
            The selected base currency is not available in the loaded rates.
          </Text>
        </View>
      )}

      <CurrencyPickerDropdown
        anchor={pickerAnchor}
        onClose={() => {
          setPickerVisible(false);
          setPickerAnchor(null);
        }}
        onSelect={(currency: CurrencyOption) => {
          onBaseCurrencyChange(currency.code);
          setPickerVisible(false);
          setPickerAnchor(null);
        }}
        sections={sections}
        selectedCode={baseCurrency}
        title="Base currency"
        visible={pickerVisible}
      />
    </View>
  );
}

function formatFetchTime(fetchedAt: number): string {
  return new Date(fetchedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface CurrencyRateRowProps {
  currency: CurrencyOption;
  rate: number;
  trend: CurrencyTrend | undefined;
  onPress?: () => void;
}

function CurrencyRateRow({ currency, rate, trend, onPress }: CurrencyRateRowProps) {
  const { colors } = useTheme();
  const color =
    trend?.direction === 'up'
      ? '#16804a'
      : trend?.direction === 'down'
        ? '#d04444'
        : '#98a2b3';
  const accessibilityTrend = trend
    ? `${trend.direction} ${Math.abs(trend.changePercent).toFixed(2)} percent over 7 days`
    : 'trend unavailable';

    return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${currency.code}, ${currency.country}, ${rate.toLocaleString(
        undefined,
        { maximumSignificantDigits: 6 },
      )}. ${accessibilityTrend}`}
      onPress={onPress}
      style={[styles.rateRow, { backgroundColor: colors.cardBg }]}
    >
      <View style={styles.currencyDetails}>
        <Text style={[styles.currencyCode, { color: colors.titleText }]}>
          {currency.code}
        </Text>
        <Text numberOfLines={1} style={[styles.countryName, { color: colors.subtext }]}>
          {currency.country}
        </Text>
      </View>
      <View style={styles.rateDetails}>
        <View style={styles.rateValue}>
          <Text style={[styles.rateAmount, { color: colors.titleText }]}>
            {rate.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
          </Text>
          <Text style={[styles.rateCode, { color: colors.subtext }]}>
            {currency.code}
          </Text>
        </View>
        <TrendIcon color={color} direction={trend?.direction} />
      </View>
    </Pressable>
  );
}

function TrendIcon({
  color,
  direction,
}: {
  color: string;
  direction: 'up' | 'down' | 'flat' | undefined;
}) {
  if (!direction) {
    return (
      <Text accessibilityLabel="Trend unavailable" style={styles.trendUnavailable}>
        —
      </Text>
    );
  }

  const path =
    direction === 'up'
      ? 'M2 14 7 11 11 12 18 5m-5 0h5v5'
      : direction === 'down'
        ? 'M2 5 7 8 11 7 18 14m-5 0h5V9'
        : 'M2 9h6l3 1 4-1h3m-3-3 3 3-3 3';

  return (
    <Svg
      accessibilityLabel={`${direction} trend`}
      height={20}
      width={24}
      viewBox="0 0 20 20"
    >
      <Path
        d={path}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    paddingTop: 12,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingCopy: {
    flex: 1,
  },
  title: {
    color: '#172033',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 3,
    color: '#667085',
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#f0f2ff',
  },
  refreshIcon: {
    color: '#5265e8',
    fontSize: 20,
  },
  baseButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d0d5dd',
  },
  baseButtonText: {
    color: '#172033',
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    color: '#667085',
    fontSize: 15,
  },
  rateDate: {
    marginTop: 12,
    color: '#667085',
    fontSize: 12,
  },
  trendNotice: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  trendNoticeText: {
    marginTop: 8,
    color: '#667085',
    fontSize: 12,
  },
  listContent: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 24,
  },
  rateRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  currencyDetails: {
    flex: 1,
    minWidth: 0,
  },
  currencyCode: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '700',
  },
  countryName: {
    marginTop: 3,
    color: '#667085',
    fontSize: 12,
  },
  rateDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rateValue: {
    alignItems: 'flex-end',
  },
  rateAmount: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '600',
  },
  rateCode: {
    marginTop: 2,
    color: '#98a2b3',
    fontSize: 10,
  },
  trendUnavailable: {
    width: 24,
    color: '#98a2b3',
    textAlign: 'center',
    fontSize: 16,
  },
  messageState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  messageText: {
    color: '#667085',
  },
  errorText: {
    color: '#b42318',
    textAlign: 'center',
  },
  retryButton: {
    padding: 8,
  },
  retryText: {
    color: '#5265e8',
    fontWeight: '700',
  },
  emptyText: {
    padding: 18,
    color: '#667085',
    textAlign: 'center',
  },
});
