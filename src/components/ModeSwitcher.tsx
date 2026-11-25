import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export type AppMode = 'convert' | 'charts' | 'settings';

interface ModeSwitcherProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
  onHeightChange?: (height: number) => void;
}

const TABS: Array<{
  key: AppMode;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}> = [
  { key: 'convert', icon: 'swap-horizontal-outline', label: 'Convert' },
  { key: 'charts', icon: 'bar-chart-outline', label: 'Charts' },
  { key: 'settings', icon: 'settings-outline', label: 'Settings' },
];

export function ModeSwitcher({
  mode,
  onChange,
  onHeightChange,
}: ModeSwitcherProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Choose app section"
      onLayout={(e) => onHeightChange?.(e.nativeEvent.layout.height)}
      style={[
        styles.bar,
        {
          backgroundColor: colors.navBg,
          borderTopColor: colors.navBorder,
          paddingBottom:
            insets.bottom > 0 ? Math.max(insets.bottom - 12, 8) : 8,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = mode === tab.key;
        const iconName = (
          isActive ? tab.icon.replace('-outline', '') : tab.icon
        ) as keyof typeof Ionicons.glyphMap;
        const tintColor = isActive ? colors.accent : colors.navInactive;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <Ionicons name={iconName} size={20} color={tintColor} />
            <Text
              style={[
                styles.label,
                { color: tintColor },
                isActive && styles.activeLabel,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeLabel: {
    fontWeight: '700',
  },
});
