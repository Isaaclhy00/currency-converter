import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { CurrencyOption } from '../constants/currencies';
import { CurrencySection } from '../utils/currencyOptions';

export interface PickerAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CurrencyPickerDropdownProps {
  anchor: PickerAnchor | null;
  onClose: () => void;
  onSelect: (currency: CurrencyOption) => void;
  sections: CurrencySection[];
  selectedCode: string;
  title: string;
  visible: boolean;
}

export function CurrencyPickerDropdown({
  anchor,
  onClose,
  onSelect,
  sections,
  selectedCode,
  title,
  visible,
}: CurrencyPickerDropdownProps) {
  const [search, setSearch] = useState('');
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  useEffect(() => {
    if (visible) {
      setSearch('');
    }
  }, [visible]);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) {
      return sections;
    }

    return sections
      .map((section) => ({
        ...section,
        data: section.data.filter(
          ({ code, country }) =>
            code.toLocaleLowerCase().includes(query) ||
            country.toLocaleLowerCase().includes(query),
        ),
      }))
      .filter((section) => section.data.length > 0);
  }, [search, sections]);

  const dropdownWidth = Math.min(300, windowWidth - 16);
  const anchorAlignedLeft =
    anchor && anchor.x + anchor.width / 2 > windowWidth / 2
      ? anchor.x + anchor.width - dropdownWidth
      : anchor?.x ?? 8;
  const left = Math.max(
    8,
    Math.min(anchorAlignedLeft, windowWidth - dropdownWidth - 8),
  );
  const belowTop = anchor ? anchor.y + anchor.height + 6 : 8;
  const spaceBelow = windowHeight - belowTop - 8;
  const spaceAbove = anchor ? anchor.y - 8 : 0;
  const showBelow = spaceBelow >= 240 || spaceBelow >= spaceAbove;
  const maxHeight = Math.min(
    320,
    Math.max(160, showBelow ? spaceBelow : spaceAbove),
  );
  const top = showBelow
    ? belowTop
    : Math.max(8, (anchor?.y ?? 8) - maxHeight - 6);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View pointerEvents="box-none" style={styles.overlay}>
        <Pressable
          accessibilityLabel="Dismiss currency picker"
          onPress={onClose}
          style={styles.backdrop}
        />
        {anchor ? (
          <View
            accessibilityViewIsModal
            style={[
              styles.popover,
              { top, left, width: dropdownWidth, height: maxHeight },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                accessibilityLabel="Close currency picker"
                accessibilityRole="button"
                onPress={onClose}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>x</Text>
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel="Search currencies"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearch}
              placeholder="Search country or code"
              placeholderTextColor="#98a2b3"
              style={styles.searchInput}
              value={search}
            />
            {filteredSections.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {sections.length === 0
                    ? 'No currencies are available yet.'
                    : 'No currencies match your search.'}
                </Text>
              </View>
            ) : (
              <SectionList
                keyboardShouldPersistTaps="handled"
                sections={filteredSections}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.code === selectedCode }}
                    onPress={() => onSelect(item)}
                    style={[
                      styles.currencyRow,
                      item.code === selectedCode && styles.selectedRow,
                    ]}
                  >
                    <Text style={styles.currencyCode}>{item.code}</Text>
                    <Text numberOfLines={1} style={styles.countryName}>
                      {item.country}
                    </Text>
                    {item.code === selectedCode ? (
                      <Text style={styles.selectedMark}>Selected</Text>
                    ) : null}
                  </Pressable>
                )}
                renderSectionHeader={({ section }) => (
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                )}
                style={styles.list}
                stickySectionHeadersEnabled={false}
              />
            )}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  popover: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e4e7ec',
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#f1f3f9',
  },
  closeText: {
    color: '#667085',
    fontSize: 16,
    fontWeight: '700',
  },
  searchInput: {
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#f1f3f9',
    color: '#172033',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  sectionTitle: {
    paddingTop: 10,
    paddingBottom: 5,
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  currencyRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectedRow: {
    backgroundColor: '#f0f2ff',
  },
  currencyCode: {
    width: 48,
    color: '#172033',
    fontSize: 14,
    fontWeight: '700',
  },
  countryName: {
    flex: 1,
    color: '#667085',
    fontSize: 12,
  },
  selectedMark: {
    marginLeft: 8,
    color: '#5265e8',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    paddingVertical: 24,
    color: '#667085',
    textAlign: 'center',
    fontSize: 12,
  },
});
