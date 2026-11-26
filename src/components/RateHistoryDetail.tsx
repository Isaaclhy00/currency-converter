import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useRateHistory } from '../hooks/useRateHistory';
import { TrexChompLoader } from '../../assets/loading/loading_animation';

export interface RateHistoryPoint {
  date: string;
  rate: number;
}

export type HistoryRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

const RANGES: HistoryRange[] = ['1W', '1M', '3M', '6M', '1Y', '5Y'];

interface RateHistoryDetailProps {
  fromCurrency: string;
  toCurrency: string;
  currentRate: number;
  data: RateHistoryPoint[];
  selectedRange: HistoryRange;
  onSelectRange: (range: HistoryRange) => void;
  isLoading?: boolean;
  onBack: () => void;
}

export function RateHistoryDetail({
  fromCurrency,
  toCurrency,
  currentRate,
  data: initialData,
  selectedRange,
  onSelectRange,
  isLoading: parentLoading,
  onBack,
}: RateHistoryDetailProps) {
  const { isDarkMode, colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lastHapticIndex = useRef<number | null>(null);

  // Fetch & cache history for the active pair and selected range
  const {
    data: historySnapshot,
    isLoading: queryLoading,
    isFetching,
    isError,
    error,
  } = useRateHistory(fromCurrency, toCurrency, true, selectedRange);
  // Use the fetched snapshot points for the selected range, falling back to initialData
  const data = historySnapshot?.points ?? initialData ?? [];
  const isLoading = parentLoading || (queryLoading && data.length === 0) || isFetching;
  // Clear scrub crosshair when currency pair or date range changes
  useEffect(() => {
    setActiveIndex(null);
    lastHapticIndex.current = null;
  }, [fromCurrency, toCurrency, selectedRange]);

  const horizontalPadding = 20;
  const chartWidth = windowWidth - horizontalPadding * 2;
  const chartHeight = 240;
  const plotPaddingTop = 20;
  const plotPaddingBottom = 20;
  const plotHeight = chartHeight - plotPaddingTop - plotPaddingBottom;

  const chartMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    const rates = data.map((d) => d.rate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const spread = maxRate - minRate || minRate * 0.01 || 1;

    const firstRate = data[0].rate;
    const latestRate = data[data.length - 1].rate;
    const change = latestRate - firstRate;
    const changePct = firstRate !== 0 ? (change / firstRate) * 100 : 0;

    const coords = data.map((point, index) => {
      const x =
        data.length === 1
          ? chartWidth / 2
          : (index / (data.length - 1)) * chartWidth;
      const normalizedY = (point.rate - minRate) / spread;
      const y = plotPaddingTop + plotHeight - normalizedY * plotHeight;
      return { x, y, ...point };
    });

    const linePath = coords
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
      .join(' ');

    const areaPath =
      coords.length > 1
        ? `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${chartHeight} L ${coords[0].x.toFixed(2)} ${chartHeight} Z`
        : '';

    return {
      minRate,
      maxRate,
      change,
      changePct,
      coords,
      linePath,
      areaPath,
    };
  }, [data, chartWidth, plotHeight, chartHeight]);

  const updateScrubFromX = (touchX: number) => {
    if (!chartMetrics || chartMetrics.coords.length === 0) return;

    const clampedX = Math.max(0, Math.min(touchX, chartWidth));
    const ratio = clampedX / chartWidth;
    const index = Math.round(ratio * (chartMetrics.coords.length - 1));

    setActiveIndex(index);

    if (lastHapticIndex.current !== index) {
      lastHapticIndex.current = index;
      Haptics.selectionAsync();
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          updateScrubFromX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          updateScrubFromX(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          setActiveIndex(null);
          lastHapticIndex.current = null;
        },
        onPanResponderTerminate: () => {
          setActiveIndex(null);
          lastHapticIndex.current = null;
        },
      }),
    [chartMetrics, chartWidth],
  );

  const inspectedPoint =
    activeIndex !== null && chartMetrics?.coords[activeIndex]
      ? chartMetrics.coords[activeIndex]
      : null;

  const displayedRate = inspectedPoint ? inspectedPoint.rate : currentRate;
  const isPositive = (chartMetrics?.change ?? 0) >= 0;
  const trendColor = isPositive ? '#16a34a' : '#dc2626';

  const formatDate = (dateStr: string) => {
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.cardBg }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => {
            // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
          style={[styles.backButton, { backgroundColor: colors.softBtnBg }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.inputText} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.inputText }]}>
          {fromCurrency} to {toCurrency}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.rateSummary}>
        <Text style={[styles.pairSubtitle, { color: colors.subtext }]}>
          1 {fromCurrency} equals
        </Text>
        <Text style={[styles.bigRate, { color: colors.inputText }]}>
          {displayedRate.toFixed(4)} {toCurrency}
        </Text>

        {inspectedPoint ? (
          <Text style={[styles.scrubDateText, { color: colors.accent }]}>
            {formatDate(inspectedPoint.date)}
          </Text>
        ) : chartMetrics ? (
          <View style={styles.changeRow}>
            <Text style={[styles.changeBadge, { color: trendColor }]}>
              {isPositive ? '+' : ''}
              {chartMetrics.change.toFixed(4)} ({isPositive ? '+' : ''}
              {chartMetrics.changePct.toFixed(2)}%)
            </Text>
            <Text style={[styles.rangeLabel, { color: colors.subtext }]}>
              past {selectedRange}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.chartCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          },
        ]}
      >
        {isLoading ? (
          <View style={[styles.loadingBox, { height: chartHeight }]}>
            {/* <ActivityIndicator size="small" color={colors.accent} /> */}
            <TrexChompLoader width={180} theme={isDarkMode ? 'dark' : 'light'} />
          </View>
        ) : !chartMetrics || chartMetrics.coords.length === 0 ? (
          <View style={[styles.loadingBox, { height: chartHeight }]}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No historical data available for this range.
            </Text>
          </View>
        ) : (
          <View
            {...panResponder.panHandlers}
            style={{ width: chartWidth, height: chartHeight }}
          >
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <LinearGradient id="rateAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.28} />
                  <Stop offset="100%" stopColor={colors.accent} stopOpacity={0.0} />
                </LinearGradient>
              </Defs>

              <Line
                x1={0}
                y1={plotPaddingTop}
                x2={chartWidth}
                y2={plotPaddingTop}
                stroke={colors.border}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Line
                x1={0}
                y1={plotPaddingTop + plotHeight / 2}
                x2={chartWidth}
                y2={plotPaddingTop + plotHeight / 2}
                stroke={colors.border}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Line
                x1={0}
                y1={plotPaddingTop + plotHeight}
                x2={chartWidth}
                y2={plotPaddingTop + plotHeight}
                stroke={colors.border}
                strokeDasharray="4 4"
                strokeWidth={1}
              />

              {chartMetrics.areaPath ? (
                <Path d={chartMetrics.areaPath} fill="url(#rateAreaGrad)" />
              ) : null}

              <Path
                d={chartMetrics.linePath}
                fill="none"
                stroke={colors.accent}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {inspectedPoint ? (
                <>
                  <Line
                    x1={inspectedPoint.x}
                    y1={0}
                    x2={inspectedPoint.x}
                    y2={chartHeight}
                    stroke={colors.subtext}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <Line
                    x1={0}
                    y1={inspectedPoint.y}
                    x2={chartWidth}
                    y2={inspectedPoint.y}
                    stroke={colors.subtext}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <Circle
                    cx={inspectedPoint.x}
                    cy={inspectedPoint.y}
                    r={8}
                    fill={colors.accent}
                    fillOpacity={0.25}
                  />
                  <Circle
                    cx={inspectedPoint.x}
                    cy={inspectedPoint.y}
                    r={4.5}
                    fill={colors.accent}
                    stroke={colors.cardBg}
                    strokeWidth={2}
                  />
                </>
              ) : null}
            </Svg>
          </View>
        )}

        {chartMetrics && chartMetrics.coords.length > 1 ? (
          <View style={styles.xAxisLabels}>
            <Text style={[styles.axisText, { color: colors.subtext }]}>
              {formatDate(chartMetrics.coords[0].date)}
            </Text>
            <Text style={[styles.axisText, { color: colors.subtext }]}>
              {formatDate(chartMetrics.coords[chartMetrics.coords.length - 1].date)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.rangeSelector, { backgroundColor: colors.pillBg }]}>
        {RANGES.map((range) => {
          const active = range === selectedRange;
          return (
            <Pressable
              key={range}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                Haptics.selectionAsync();
                onSelectRange(range);
              }}
              style={[
                styles.rangePill,
                active && { backgroundColor: colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.rangePillText,
                  { color: active ? '#ffffff' : colors.subtext },
                ]}
              >
                {range}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {chartMetrics ? (
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              Period Low
            </Text>
            <Text style={[styles.statValue, { color: colors.inputText }]}>
              {chartMetrics.minRate.toFixed(4)}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              Period High
            </Text>
            <Text style={[styles.statValue, { color: colors.inputText }]}>
              {chartMetrics.maxRate.toFixed(4)}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              Average
            </Text>
            <Text style={[styles.statValue, { color: colors.inputText }]}>
              {(
                data.reduce((sum, item) => sum + item.rate, 0) / data.length
              ).toFixed(4)}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={[styles.hintText, { color: colors.subtext }]}>
        Touch and drag across the chart to inspect exact historical rates
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 38,
  },
  rateSummary: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  pairSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  bigRate: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrubDateText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  changeBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
  rangeLabel: {
    fontSize: 13,
  },
  chartCard: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  loadingBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  xAxisLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  axisText: {
    fontSize: 11,
    fontWeight: '500',
  },
  rangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 4,
    borderRadius: 12,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  rangePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: '100%',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
    paddingHorizontal: 24,
  },
});
