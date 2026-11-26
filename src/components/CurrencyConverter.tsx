import { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { ViewInstance } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CurrencyOption } from '../constants/currencies';
import {
  CurrencyPickerDropdown,
  PickerAnchor,
} from './CurrencyPickerDropdown';
import { RateHistoryChart } from './RateHistoryChart';
import { TrexChompLoader } from '../../assets/loading/loading_animation';
import { useRates } from '../hooks/useRates';
import { getCurrencySections } from '../utils/currencyOptions';
import { convert, getDecimalPlaces } from '../utils/convert';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';


export interface CurrencyConverterHandle {
  resetUIState: () => void;
}

interface CurrencyConverterProps {
  ratesQuery: ReturnType<typeof useRates>;
  defaultFromCurrency?: string;
  defaultToCurrency?: string;
}

export const CurrencyConverter = forwardRef<
  CurrencyConverterHandle,
  CurrencyConverterProps
>(function CurrencyConverter({ ratesQuery, defaultFromCurrency, defaultToCurrency }, ref) {
  const { isDarkMode, colors } = useTheme();
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState(defaultFromCurrency || 'USD');
  const [toCurrency, setToCurrency] = useState(defaultToCurrency || 'EUR');
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<PickerAnchor | null>(null);
  const router = useRouter();

  const currencySections = useMemo(
    () => getCurrencySections(ratesQuery.data?.rates ?? {}),
    [ratesQuery.data?.rates],
  );

  useImperativeHandle(ref, () => ({
    resetUIState() {
      setIsAmountFocused(false);
      setPickerTarget(null);
      setPickerAnchor(null);
    },
  }));

  const numericAmount = amount.trim() === '' ? Number.NaN : Number(amount);
  const fromRate = ratesQuery.data?.rates[fromCurrency];
  const toRate = ratesQuery.data?.rates[toCurrency];
  const hasValidAmount = Number.isFinite(numericAmount) && numericAmount >= 0;
  const result =
    hasValidAmount && fromRate && toRate
      ? convert(numericAmount, fromRate, toRate, toCurrency)
      : null;

  const openRateHistoryDetail = () => {
    const currentRate =
      fromRate && toRate ? toRate / fromRate : undefined;

    Keyboard.dismiss();
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/rate-history-detail',
      params: {
        fromCurrency,
        toCurrency,
        ...(currentRate !== undefined && Number.isFinite(currentRate)
          ? { currentRate: String(currentRate) }
          : {}),
      },
    });
  };

  useEffect(() => {
    setFromCurrency(defaultFromCurrency ?? 'USD');
  }, [defaultFromCurrency]);

  useEffect(() => {
    setToCurrency(defaultToCurrency ?? 'EUR');
  }, [defaultToCurrency]);
  return (
    <>
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <View style={styles.converterContent}>
          <Text style={[styles.headerTitle, { color: colors.titleText }]}>
            Convert
          </Text>
          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.amountColumns}>
              <View style={styles.amountColumn}>
                <Text style={[styles.label, { color: colors.label }]}>From: </Text>
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
                    style={[styles.input, { color: colors.inputText }]}
                    value={amount}
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    placeholderTextColor={colors.subtext}
                  />
                  {isAmountFocused && amount !== '' ? (
                    <Pressable
                      accessibilityLabel="Clear amount"
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => setAmount('')}
                      style={[styles.clearAmountButton, { backgroundColor: colors.clearBtnBg }]}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.clearIcon} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={styles.amountColumn}>
                <Text style={[styles.label, { color: colors.label }]}>To: </Text>
                <View style={styles.amountInputRow}>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[styles.result, styles.resultAmount, { color: colors.accent }]}
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Keyboard.dismiss();
                  setFromCurrency(toCurrency);
                  setToCurrency(fromCurrency);
                }}
                style={({ pressed }) => [
                  styles.swapButton,
                  { backgroundColor: colors.softBtnBg },
                  pressed && { backgroundColor: colors.softBtnPressed },
                  !ratesQuery.data && styles.disabledButton,
                ]}
              >
                <Text style={[styles.swapArrow, { color: colors.accent }]}>⇄</Text>
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
                <View style={styles.loaderContainer}>
                  <TrexChompLoader width={160} theme="light" />
                </View>
              ) : ratesQuery.isError ? (
                <View style={styles.messageBox}>
                  <Text style={[styles.errorText, { color: colors.accent }]}>
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
                    <Text style={[styles.retryText, { color: colors.accent }]}>Try again</Text>
                  </Pressable>
                </View>
              ) : result === null ? (
                <Text style={[styles.hint, { color: colors.accent }]}>
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
                      {new Date(ratesQuery.data.fetchedAt).toLocaleString()}
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                styles.refreshButton,
                { backgroundColor: colors.softBtnBg },
                pressed && { backgroundColor: colors.softBtnPressed },
                ratesQuery.isFetching && styles.disabledButton,
              ]}
            >
              <Text style={[styles.refreshIcon, { color: colors.accent }]}>↻</Text>
              <Text style={[styles.refreshText, { color: colors.accent }]}>
                {ratesQuery.isFetching ? 'Refreshing' : 'Refresh'}
              </Text>
            </Pressable>
          </View>
        
          <RateHistoryChart
            base={fromCurrency}
            quote={toCurrency}
            onPress={openRateHistoryDetail}
          />
        </View>
      </TouchableWithoutFeedback>

      <CurrencyPickerDropdown
        anchor={pickerAnchor}
        defaultCodes={[defaultFromCurrency ?? 'USD', defaultToCurrency ?? 'EUR']}
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
    </>
  );
});

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
  const { colors } = useTheme();

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
      style={[
        styles.currencyInput,
        { backgroundColor: colors.pillBg },
        disabled && styles.disabledCurrencyInput,
      ]}
    >
      <Text style={[styles.currencyButtonText, { color: colors.pillText }]}>{value}</Text>
      <Ionicons
        name="chevron-down"
        size={16}
        color={colors.pillChevron}
        style={styles.currencyChevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  converterContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 12,
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
    // minHeight: 48,
    height: 40,
    paddingVertical: 0,
    color: '#172033',
    fontSize: 24,
    lineHeight: 30,
  },
  amountInputRow: {
    // minHeight: 48,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    textAlignVertical: 'center',
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
    lineHeight: 30,
    marginTop: 24,
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
  loaderContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
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
