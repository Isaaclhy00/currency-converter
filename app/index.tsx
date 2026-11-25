import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { ViewInstance } from 'react-native';
import { CurrencyOption } from '../src/constants/currencies';
import {
  CurrencyPickerDropdown,
  PickerAnchor,
} from '../src/components/CurrencyPickerDropdown';
import { CurrencyRateList } from '../src/components/CurrencyRateList';
import { ModeSwitcher } from '../src/components/ModeSwitcher';
import type { AppMode } from '../src/components/ModeSwitcher';
import { RateHistoryChart } from '../src/components/RateHistoryChart';
import { useRates } from '../src/hooks/useRates';
import { getCurrencySections } from '../src/utils/currencyOptions';
import { convert, getDecimalPlaces } from '../src/utils/convert';
import { Ionicons } from '@expo/vector-icons';
import { TrexAnimatedLogo } from '../assets/logo/animated_logo';
import {
  CurrencyConverter,
  CurrencyConverterHandle,
} from '../src/components/CurrencyConverter';
import { SettingsScreen } from '../src/components/Settings';
import { useTheme } from '../src/context/ThemeContext';

export default function ConverterScreen() {
  const [defaultBaseCurrency, setDefaultBaseCurrency] = useState('USD');
  const [defaultToCurrency, setDefaultToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [activeMode, setActiveMode] = useState<AppMode>('convert');
  const [chartBaseCurrency, setChartBaseCurrency] = useState('USD');
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<PickerAnchor | null>(null);
  const ratesQuery = useRates();
  const currencySections = useMemo(
    () => getCurrencySections(ratesQuery.data?.rates ?? {}),
    [ratesQuery.data?.rates],
  );
  const [navHeight, setNavHeight] = useState(60);
  const converterRef = useRef<CurrencyConverterHandle>(null);
  const { isDarkMode, setIsDarkMode } = useTheme();
  const numericAmount = amount.trim() === '' ? Number.NaN : Number(amount);
  const fromRate = ratesQuery.data?.rates[fromCurrency];
  const toRate = ratesQuery.data?.rates[toCurrency];
  const hasValidAmount = Number.isFinite(numericAmount) && numericAmount >= 0;
  const result =
    hasValidAmount && fromRate && toRate
      ? convert(numericAmount, fromRate, toRate, toCurrency)
      : null;

  return (
    <SafeAreaView style={[
      styles.safeArea,
      { backgroundColor: isDarkMode ? '#000000' : '#f5f7fb' },
    ]}>
       <View style={[styles.container, { paddingBottom: navHeight - 10 }]}>
          <View style={styles.headerRow}>
            <TrexAnimatedLogo size={36} />
            <Text style={styles.eyebrow}>T-REX</Text>
          </View>

        {activeMode === 'convert' ? (
          <CurrencyConverter 
            ref={converterRef} 
            ratesQuery={ratesQuery} 
            defaultFromCurrency={defaultBaseCurrency}
            defaultToCurrency={defaultToCurrency}
          />
        ) : activeMode === 'charts' ? (
          <CurrencyRateList
            baseCurrency={chartBaseCurrency}
            onBaseCurrencyChange={setChartBaseCurrency}
            rates={ratesQuery.data}
            ratesError={ratesQuery.error?.message ?? null}
            ratesLoading={ratesQuery.isPending}
            onRetryRates={() => {
              ratesQuery.refetch();
            }}
          />
        ) : (
          <SettingsScreen
            defaultBaseCurrency={defaultBaseCurrency}
            onDefaultBaseCurrencyChange={(code) => {
              setDefaultBaseCurrency(code);
              setChartBaseCurrency(code);
            }}
            defaultToCurrency={defaultToCurrency}
            onDefaultToCurrencyChange={setDefaultToCurrency}
          />
        )}
      </View>

      <ModeSwitcher
        mode={activeMode}
        
        onChange={(mode) => {
          Keyboard.dismiss();
          setActiveMode(mode);
          setIsAmountFocused(false);
          setPickerTarget(null);
          setPickerAnchor(null);
        }}
      />
    </SafeAreaView>
  );
}

function formatFetchTime(fetchedAt: number): string {
  return new Date(fetchedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface CurrencyButtonProps {
  accessibilityLabel: string;
  disabled: boolean;
  onPress: (anchor: PickerAnchor) => void;
  value: string;
}

function CurrencyButton({
  accessibilityLabel,
  disabled,
  onPress,
  value,
}: CurrencyButtonProps) {
  const buttonRef = useRef<ViewInstance>(null);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        Keyboard.dismiss();
        buttonRef.current?.measureInWindow((x, y, width, height) => {
          onPress({ x, y, width, height });
        });
      }}
      ref={buttonRef}
      style={[styles.currencyInput, disabled && styles.disabledCurrencyInput]}
    >
      <Text style={styles.currencyButtonText}>{value}</Text>
      {/* <Text style={styles.currencyChevron}>v</Text> */}
      <Ionicons 
        name="chevron-down" 
        size={16} 
        color="#333333" 
        style={styles.currencyChevron} 
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    paddingTop: 36,
    paddingBottom: 16,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  converterContent: {
    flex: 1,
  },
  eyebrow: {
    color: '#555555',
    // color: '#5265e8',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 10,
    color: '#172033',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    color: '#667085',
    fontSize: 15,
  },
  card: {
    marginTop: 14,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  label: {
    marginBottom: 10,
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
  },
  amountColumns: {
    flexDirection: 'row',
    gap: 16,
  },
  amountColumn: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 0,
    color: '#172033',
    fontSize: 24,
  },
  amountInputRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAmountButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  clearAmountText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  currencyInput: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f1f3f9',
  },
  currencyButtonText: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '700',
  },
  currencyChevron: {
    marginLeft: 8,
    color: '#667085',
    fontSize: 12,
  },
  disabledCurrencyInput: {
    opacity: 0.6,
  },
  result: {
    color: '#5265e8',
    fontSize: 24,
    fontWeight: '700',
  },
  resultAmount: {
    minHeight: 48,
    textAlignVertical: 'center',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  swapButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#f0f2ff',
  },
  swapButtonPressed: {
    backgroundColor: '#e0e5ff',
  },
  swapArrow: {
    color: '#5265e8',
    fontSize: 24,
    fontWeight: '700',
  },
  rateSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  rateSummaryContent: {
    flex: 1,
    minWidth: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#667085',
  },
  messageBox: {
    gap: 4,
  },
  errorText: {
    color: '#b42318',
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
  },
  retryText: {
    color: '#5265e8',
    fontWeight: '700',
  },
  hint: {
    color: '#667085',
  },
  rateInfo: {
    gap: 4,
  },
  rateText: {
    color: '#667085',
    fontSize: 13,
  },
  refreshButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: '#f0f2ff',
  },
  refreshButtonPressed: {
    backgroundColor: '#e0e5ff',
  },
  disabledButton: {
    opacity: 0.65,
  },
  refreshText: {
    color: '#5265e8',
    fontSize: 12,
    fontWeight: '600',
  },
  refreshIcon: {
    color: '#5265e8',
    fontSize: 16,
    fontWeight: '700',
  },
});
