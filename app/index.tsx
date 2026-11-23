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

export default function ConverterScreen() {
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

  const numericAmount = amount.trim() === '' ? Number.NaN : Number(amount);
  const fromRate = ratesQuery.data?.rates[fromCurrency];
  const toRate = ratesQuery.data?.rates[toCurrency];
  const hasValidAmount = Number.isFinite(numericAmount) && numericAmount >= 0;
  const result =
    hasValidAmount && fromRate && toRate
      ? convert(numericAmount, fromRate, toRate, toCurrency)
      : null;

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>CURRENCY CONVERTER</Text>
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

          {activeMode === 'convert' ? (
            <>
              <View style={styles.card}>
                <View style={styles.amountColumns}>
                  <View style={styles.amountColumn}>
                    <Text style={styles.label}>From: </Text>
                    <View style={styles.amountInputRow}>
                      <TextInput
                        accessibilityLabel="Amount to convert"
                        blurOnSubmit
                        keyboardType="decimal-pad"
                        onBlur={() => {
                          setIsAmountFocused(false);
                          setAmount((currentAmount) =>
                            currentAmount.trim() === '' ? '1' : currentAmount,
                          );
                        }}
                        onChangeText={setAmount}
                        onFocus={() => setIsAmountFocused(true)}
                        onSubmitEditing={Keyboard.dismiss}
                        placeholder="Amount"
                        returnKeyType="done"
                        style={styles.input}
                        value={amount}
                      />
                      {isAmountFocused && amount !== '' ? (
                        <Pressable
                          accessibilityLabel="Clear amount"
                          accessibilityRole="button"
                          hitSlop={8}
                          onPress={() => setAmount('')}
                          style={styles.clearAmountButton}
                        >
                          {/* <Text style={styles.clearAmountText}>×</Text> */}
                          <Ionicons name="close-circle" size={20} color="#74747C" />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.amountColumn}>
                    <Text style={styles.label}>To: </Text>
                    <Text
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      style={[styles.result, styles.resultAmount]}
                    >
                      {result === null
                        ? '—'
                        : result.toLocaleString(undefined, {
                            minimumFractionDigits: getDecimalPlaces(toCurrency),
                            maximumFractionDigits: getDecimalPlaces(toCurrency),
                          })}
                    </Text>
                  </View>
                </View>

                <View style={styles.currencyRow}>
                  <CurrencyButton
                    accessibilityLabel="Source currency"
                    disabled={!ratesQuery.data}
                    onPress={(anchor) => {
                      setPickerTarget('from');
                      setPickerAnchor(anchor);
                    }}
                    value={fromCurrency}
                  />
                  <Pressable
                    accessibilityHint="Swap the source and target currencies"
                    accessibilityLabel="Swap currencies"
                    accessibilityRole="button"
                    disabled={!ratesQuery.data}
                    onPress={() => {
                      Keyboard.dismiss();
                      setFromCurrency(toCurrency);
                      setToCurrency(fromCurrency);
                    }}
                    style={({ pressed }) => [
                      styles.swapButton,
                      pressed && styles.swapButtonPressed,
                      !ratesQuery.data && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.swapArrow}>⇄</Text>
                  </Pressable>
                  <CurrencyButton
                    accessibilityLabel="Target currency"
                    disabled={!ratesQuery.data}
                    onPress={(anchor) => {
                      setPickerTarget('to');
                      setPickerAnchor(anchor);
                    }}
                    value={toCurrency}
                  />
                </View>
              </View>

              <View style={styles.rateSummaryRow}>
                <View style={styles.rateSummaryContent}>
                  {ratesQuery.isPending ? (
                    <View style={styles.statusRow}>
                      <ActivityIndicator size="small" />
                      <Text style={styles.statusText}>
                        Loading exchange rates…
                      </Text>
                    </View>
                  ) : ratesQuery.isError ? (
                    <View style={styles.messageBox}>
                      <Text style={styles.errorText}>
                        {ratesQuery.error.message ||
                          'Unable to load exchange rates.'}
                      </Text>
                      <Pressable
                        onPress={() => {
                          Keyboard.dismiss();
                          ratesQuery.refetch();
                        }}
                        style={styles.retryButton}
                      >
                        <Text style={styles.retryText}>Try again</Text>
                      </Pressable>
                    </View>
                  ) : result === null ? (
                    <Text style={styles.hint}>
                      Enter a valid amount and supported three-letter currency
                      codes.
                    </Text>
                  ) : (
                    <View style={styles.rateInfo}>
                      <Text style={styles.rateText}>
                        {ratesQuery.data?.source === 'cache'
                          ? 'Offline: using saved rates'
                          : ratesQuery.data
                            ? `Updated ${ratesQuery.data.date} · ${formatFetchTime(
                                ratesQuery.data.fetchedAt,
                              )}`
                            : ''}
                      </Text>
                      {ratesQuery.data?.source === 'cache' ? (
                        <Text style={styles.rateText}>
                          Saved{' '}
                          {new Date(
                            ratesQuery.data.fetchedAt,
                          ).toLocaleString()}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
                <Pressable
                  accessibilityLabel="Refresh rates"
                  accessibilityRole="button"
                  disabled={ratesQuery.isFetching}
                  onPress={() => {
                    Keyboard.dismiss();
                    ratesQuery.refetch();
                  }}
                  style={({ pressed }) => [
                    styles.refreshButton,
                    pressed && styles.refreshButtonPressed,
                    ratesQuery.isFetching && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.refreshIcon}>↻</Text>
                  <Text style={styles.refreshText}>
                    {ratesQuery.isFetching ? 'Refreshing' : 'Refresh'}
                  </Text>
                </Pressable>
              </View>

              <RateHistoryChart base={fromCurrency} quote={toCurrency} />
            </>
          ) : (
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
          )}
        </View>
        <CurrencyPickerDropdown
          anchor={pickerAnchor}
          onClose={() => {
            setPickerTarget(null);
            setPickerAnchor(null);
          }}
          onSelect={(currency: CurrencyOption) => {
            if (pickerTarget === 'from') {
              setFromCurrency(currency.code);
            } else if (pickerTarget === 'to') {
              setToCurrency(currency.code);
            }
            setPickerTarget(null);
            setPickerAnchor(null);
          }}
          sections={currencySections}
          selectedCode={pickerTarget === 'from' ? fromCurrency : toCurrency}
          title={pickerTarget === 'from' ? 'Convert from' : 'Convert to'}
          visible={pickerTarget !== null}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  eyebrow: {
    color: '#5265e8',
    fontSize: 12,
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
    marginTop: 32,
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
