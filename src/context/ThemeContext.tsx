import React, { createContext, useContext, useState } from 'react';

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

export type ThemeColors = typeof lightColors;

interface ThemeContextValue {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDarkMode: false,
  setIsDarkMode: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
