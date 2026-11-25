import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { loadCachedRates, ratesQueryKey } from '../src/hooks/useRates';
import { ThemeProvider } from '../src/context/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000,
      retry: false,
    },
  },
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadCachedRates()
      .then((cachedRates) => {
        if (active && cachedRates) {
          queryClient.setQueryData(ratesQueryKey, cachedRates, {
            updatedAt: cachedRates.fetchedAt,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStartupError(
            error instanceof Error ? error.message : 'Unable to load saved rates.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        {ready ? (
          startupError ? (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Could not load saved rates</Text>
            <Text style={styles.errorMessage}>{startupError}</Text>
            <Text style={styles.errorMessage}>
              Restart the app to try loading saved data again.
            </Text>
          </View>
          ) : (
            <Stack screenOptions={{ headerShown: false }} />
          )
          ) : (
            <View style={styles.centered}>
              <ActivityIndicator size="large" />
            </View>
          )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f7fb',
  },
  errorTitle: {
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#b42318',
  },
  errorMessage: {
    marginTop: 4,
    color: '#475467',
    textAlign: 'center',
  },
});
