import { useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useRateHistory } from '../hooks/useRateHistory';
import { RateHistoryPoint } from '../api/history';

interface RateHistoryChartProps {
  base: string;
  quote: string;
}

const MIN_CHART_HEIGHT = 178;
const PLOT_TOP = 12;
const PLOT_LEFT = 58;
const PLOT_RIGHT = 12;

export function RateHistoryChart({ base, quote }: RateHistoryChartProps) {
  const [chartSize, setChartSize] = useState({
    width: 0,
    height: MIN_CHART_HEIGHT,
  });
  const historyQuery = useRateHistory(base, quote);
  const points = historyQuery.data?.points;
  const values = points?.map(({ rate }) => rate) ?? [];
  const minimum = values.length > 0 ? Math.min(...values) : 0;
  const maximum = values.length > 0 ? Math.max(...values) : 0;
  const latest = points?.[points.length - 1];

  const handleChartLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setChartSize({ width, height: Math.max(height, MIN_CHART_HEIGHT) });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Rate history</Text>
        <Text style={styles.period}>30 DAYS</Text>
      </View>
      <Text style={styles.pairSummary}>
        {latest
          ? `1 ${base} = ${formatRate(latest.rate)} ${quote}`
          : `${base} to ${quote}`}
      </Text>

      {historyQuery.isPending ? (
        <View style={styles.message}>
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.messageText}>Loading rate history…</Text>
          </View>
        </View>
      ) : historyQuery.isError ? (
        <View style={styles.message}>
          <Text style={styles.errorText}>
            Historical rates are unavailable for this currency pair.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => historyQuery.refetch()}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : points ? (
        <>
          <View onLayout={handleChartLayout} style={styles.chart}>
            {chartSize.width > PLOT_LEFT + PLOT_RIGHT ? (
              <HistoryPlot
                width={chartSize.width}
                height={chartSize.height}
                points={points}
                minimum={minimum}
                maximum={maximum}
              />
            ) : null}
          </View>
          <View style={styles.dateLabels}>
            <Text style={styles.dateText}>{formatDate(points[0])}</Text>
            <Text style={styles.dateText}>{formatDate(points[points.length - 1])}</Text>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Low {formatRate(minimum)} {quote}
            </Text>
            <Text style={styles.footerText}>
              High {formatRate(maximum)} {quote}
            </Text>
          </View>
          {historyQuery.data.source === 'cache' ? (
            <Text style={styles.cacheNote}>Offline: showing saved history</Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

interface HistoryPlotProps {
  height: number;
  maximum: number;
  minimum: number;
  points: RateHistoryPoint[];
  width: number;
}

function HistoryPlot({
  height,
  maximum,
  minimum,
  points,
  width,
}: HistoryPlotProps) {
  const plotWidth = width - PLOT_LEFT - PLOT_RIGHT;
  const plotBottom = height - 16;
  const plotHeight = plotBottom - PLOT_TOP;
  const valueRange = maximum - minimum;
  const coordinates = points.map(({ rate }, index) => {
    const x =
      PLOT_LEFT +
      (index / Math.max(points.length - 1, 1)) * plotWidth;
    const y =
      PLOT_TOP +
      (valueRange === 0 ? 0.5 : 1 - (rate - minimum) / valueRange) * plotHeight;
    return { x, y };
  });
  const polylinePoints = coordinates
    .map(({ x, y }) => `${x},${y}`)
    .join(' ');
  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];

  return (
    <Svg height={height} width={width}>
      <Line
        x1={PLOT_LEFT}
        y1={PLOT_TOP}
        x2={width - PLOT_RIGHT}
        y2={PLOT_TOP}
        stroke="#eaecf0"
        strokeDasharray="4 5"
      />
      <Line
        x1={PLOT_LEFT}
        y1={plotBottom}
        x2={width - PLOT_RIGHT}
        y2={plotBottom}
        stroke="#eaecf0"
        strokeDasharray="4 5"
      />
      <SvgText
        x={PLOT_LEFT - 8}
        y={PLOT_TOP + 4}
        fill="#667085"
        fontSize="10"
        textAnchor="end"
      >
        {formatRate(maximum)}
      </SvgText>
      <SvgText
        x={PLOT_LEFT - 8}
        y={plotBottom + 4}
        fill="#667085"
        fontSize="10"
        textAnchor="end"
      >
        {formatRate(minimum)}
      </SvgText>
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke="#5265e8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
      />
      {firstPoint ? (
        <Circle cx={firstPoint.x} cy={firstPoint.y} r={4} fill="#98a2ff" />
      ) : null}
      {lastPoint ? (
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={5} fill="#5265e8" />
      ) : null}
    </Svg>
  );
}

function formatRate(rate: number): string {
  return rate.toLocaleString(undefined, { maximumSignificantDigits: 6 });
}

function formatDate(point: RateHistoryPoint): string {
  return new Date(`${point.date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 250,
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '700',
  },
  period: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  pairSummary: {
    marginTop: 6,
    color: '#667085',
    fontSize: 13,
  },
  chart: {
    flex: 1,
    minHeight: MIN_CHART_HEIGHT,
    marginTop: 10,
  },
  dateLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  dateText: {
    color: '#667085',
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eaecf0',
  },
  footerText: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  messageText: {
    color: '#667085',
    fontSize: 13,
  },
  errorText: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    color: '#5265e8',
    fontSize: 13,
    fontWeight: '700',
  },
  cacheNote: {
    marginTop: 8,
    color: '#667085',
    fontSize: 11,
  },
});
