import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type AppMode = 'convert' | 'charts';

interface ModeSwitcherProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <View accessibilityLabel="Choose app section" style={styles.track}>
      <ModeOption
        icon="convert"
        label="Convert"
        mode="convert"
        onChange={onChange}
        selected={mode === 'convert'}
      />
      <ModeOption
        icon="charts"
        label="Charts"
        mode="charts"
        onChange={onChange}
        selected={mode === 'charts'}
      />
    </View>
  );
}

interface ModeOptionProps extends ModeSwitcherProps {
  icon: AppMode;
  label: string;
  selected: boolean;
}

function ModeOption({
  icon,
  label,
  mode,
  onChange,
  selected,
}: ModeOptionProps) {
  const color = selected ? '#5265e8' : '#667085';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onChange(mode)}
      style={[styles.option, selected && styles.selectedOption]}
    >
      <Svg height={18} width={18} viewBox="0 0 20 20">
        {icon === 'convert' ? (
          <Path
            d="M3 6h13l-3-3m3 3-3 3M17 14H4l3 3m-3-3 3-3"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
          />
        ) : (
          <>
            <Path
              d="M3 3v14h14"
              fill="none"
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
            />
            <Path
              d="m5 13 3.5-3.5 3 2L16 6"
              fill="none"
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
            />
          </>
        )}
      </Svg>
      <Text style={[styles.optionText, selected && styles.selectedText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 18,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#e9ebf2',
  },
  option: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 11,
  },
  selectedOption: {
    backgroundColor: '#ffffff',
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  optionText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: '#172033',
  },
});
