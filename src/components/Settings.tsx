import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { ViewInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { CurrencyOption } from '../constants/currencies';
import {
  CurrencyPickerDropdown,
  PickerAnchor,
} from './CurrencyPickerDropdown';
import { useRates } from '../hooks/useRates';
import { getCurrencySections } from '../utils/currencyOptions';

interface SettingsScreenProps {
  defaultBaseCurrency: string;
  onDefaultBaseCurrencyChange: (code: string) => void;
  defaultToCurrency: string;
  onDefaultToCurrencyChange: (code: string) => void;
}

export function SettingsScreen({
  defaultBaseCurrency,
  onDefaultBaseCurrencyChange,
  defaultToCurrency,
  onDefaultToCurrencyChange,
}: SettingsScreenProps) {
  const { isDarkMode, setIsDarkMode, colors } = useTheme();
  const ratesQuery = useRates();

  const [pickerTarget, setPickerTarget] = useState<'base' | 'to' | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<PickerAnchor | null>(null);

  const baseRowRef = useRef<ViewInstance>(null);
  const toRowRef = useRef<ViewInstance>(null);

  const currencySections = useMemo(
    () => getCurrencySections(ratesQuery.data?.rates ?? {}),
    [ratesQuery.data?.rates],
  );

  const openPicker = (
    target: 'base' | 'to',
    ref: React.RefObject<ViewInstance | null>,
  ) => {
    ref.current?.measureInWindow((x, y, width, height) => {
      setPickerAnchor({ x, y, width, height });
      setPickerTarget(target);
    });
  };

  return (
    <View style={styles.container}>
      {/* Large iOS-Style Header */}
      <Text style={[styles.headerTitle, { color: colors.titleText }]}>
        Settings
      </Text>

      {/* Appearance Section */}
      <Text style={[styles.sectionHeader, { color: colors.subtext }]}>
        APPEARANCE
      </Text>
      <View style={[styles.groupCard, { backgroundColor: colors.cardBg }]}>
        <View style={styles.row}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: isDarkMode ? colors.accent : '#1E2638' },
            ]}
          >
            <Ionicons
              name={isDarkMode ? 'moon' : 'sunny'}
              size={18}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.labelContainer}>
            <Text style={[styles.rowLabel, { color: colors.titleText }]}>
              Dark Mode
            </Text>
            <Text style={[styles.rowSublabel, { color: colors.subtext }]}>
              {isDarkMode ? 'On' : 'Off'}
            </Text>
          </View>

          <Switch
            accessibilityLabel="Toggle dark mode"
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#D1D5DB', true: '#34C759' }}
            ios_backgroundColor="#D1D5DB"
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Currency Preferences Section */}
      <Text
        style={[
          styles.sectionHeader,
          styles.sectionSpacing,
          { color: colors.subtext },
        ]}
      >
        CURRENCIES
      </Text>
      <View style={[styles.groupCard, { backgroundColor: colors.cardBg }]}>
        {/* Default Base Currency Row */}
        <Pressable
          accessibilityLabel={`Default base currency ${defaultBaseCurrency}`}
          accessibilityRole="button"
          onPress={() => openPicker('base', baseRowRef)}
          ref={baseRowRef}
          style={({ pressed }) => [
            styles.row,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={[styles.iconBadge, { backgroundColor: '#5265e8' }]}>
            <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
          </View>

          <View style={styles.labelContainer}>
            <Text style={[styles.rowLabel, { color: colors.titleText }]}>
              Default Base Currency
            </Text>
            <Text style={[styles.rowSublabel, { color: colors.subtext }]}>
              Starting "From" & charts currency
            </Text>
          </View>

          <View style={styles.valueRow}>
            <Text style={[styles.valueText, { color: colors.subtext }]}>
              {defaultBaseCurrency}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.pillChevron}
            />
          </View>
        </Pressable>

        {/* iOS Inset Hairline Divider */}
        <View
          style={[styles.separator, { backgroundColor: colors.border }]}
        />

        {/* Default To Currency Row */}
        <Pressable
          accessibilityLabel={`Default to currency ${defaultToCurrency}`}
          accessibilityRole="button"
          onPress={() => openPicker('to', toRowRef)}
          ref={toRowRef}
          style={({ pressed }) => [
            styles.row,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={[styles.iconBadge, { backgroundColor: '#16804a' }]}>
            <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
          </View>

          <View style={styles.labelContainer}>
            <Text style={[styles.rowLabel, { color: colors.titleText }]}>
              Default To Currency
            </Text>
            <Text style={[styles.rowSublabel, { color: colors.subtext }]}>
              Starting target currency
            </Text>
          </View>

          <View style={styles.valueRow}>
            <Text style={[styles.valueText, { color: colors.subtext }]}>
              {defaultToCurrency}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.pillChevron}
            />
          </View>
        </Pressable>
      </View>

      <CurrencyPickerDropdown
        anchor={pickerAnchor}
        onClose={() => {
          setPickerTarget(null);
          setPickerAnchor(null);
        }}
        onSelect={(currency: CurrencyOption) => {
          if (pickerTarget === 'base') {
            onDefaultBaseCurrencyChange(currency.code);
          } else if (pickerTarget === 'to') {
            onDefaultToCurrencyChange(currency.code);
          }
          setPickerTarget(null);
          setPickerAnchor(null);
        }}
        sections={currencySections}
        selectedCode={
          pickerTarget === 'base' ? defaultBaseCurrency : defaultToCurrency
        }
        title={
          pickerTarget === 'base'
            ? 'Default base currency'
            : 'Default to currency'
        }
        visible={pickerTarget !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 12,
  },
  sectionSpacing: {
    marginTop: 22,
  },
  groupCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 14,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSublabel: {
    fontSize: 12,
    marginTop: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
