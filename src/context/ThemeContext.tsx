import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@app_theme_mode';

export const lightColors = {
  screenBg: '#f5f7fb',
  cardBg: '#ffffff',
  headerText: '#555555',
  titleText: '#172033',
  label: '#667085',
  inputText: '#172033',
  accent: '#5265e8',
  pillBg: '#f1f3f9',
  pillText: '#172033',
  pillChevron: '#333333',
  softBtnBg: '#f0f2ff',
  softBtnPressed: '#e0e5ff',
  clearBtnBg: '#FFFFFF',
  clearIcon: '#74747C',
  subtext: '#667085',
  errorText: '#b42318',
  border: '#eaecf0',
  navBg: '#ffffff',
  navBorder: '#E5E7EB',
  navInactive: '#74747C',
};

export const darkColors = {
  screenBg: '#000000',
  cardBg: '#1C1C1E',
  headerText: '#FFFFFF',
  titleText: '#FFFFFF',
  label: '#9CA3AF',
  inputText: '#FFFFFF',
  accent: '#7888FF',
  pillBg: '#2C2C2E',
  pillText: '#FFFFFF',
  pillChevron: '#9CA3AF',
  softBtnBg: '#25283D',
  softBtnPressed: '#303552',
  clearBtnBg: '#1C1C1E',
  clearIcon: '#9CA3AF',
  subtext: '#9CA3AF',
  errorText: '#F87171',
  border: '#2C2C2E',
  navBg: '#1C1C1E',
  navBorder: '#2C2C2E',
  navInactive: '#8E8E93',
};

export type ThemeColors = typeof darkColors;

interface ThemeContextValue {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDarkMode: true,
  setIsDarkMode: () => {},
  colors: darkColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const colors = isDarkMode ? darkColors : lightColors;

  // 1. Load saved theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedTheme) => {
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      })
      .catch((err) => console.warn('Failed to load theme:', err));
  }, []);

  // 2. Save theme whenever it changes
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light').catch(
        (err) => console.warn('Failed to save theme:', err),
      );
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
