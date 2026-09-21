import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { DATABASE_NAME, migrate } from '@/db';
import { colors, spacing } from '@/theme';

function Booting() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

/**
 * Catches a failed migration or a database that will not open. SQLiteProvider
 * rejects `onError` when `useSuspense` is set, so recovery belongs here.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Unibud could not start</Text>
      <Text style={styles.errorBody}>{error.message}</Text>
      <View style={styles.retry}>
        <Button label="Try again" onPress={() => void retry()} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Suspense fallback={<Booting />}>
          <SQLiteProvider
            databaseName={DATABASE_NAME}
            onInit={migrate}
            useSuspense
          >
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShadowVisible: false,
                headerTintColor: colors.accent,
                headerTitleStyle: { color: colors.ink },
                contentStyle: { backgroundColor: colors.canvas },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="subject/[id]"
                options={{ title: '', headerBackTitle: 'Subjects' }}
              />
              {/* These screens render their own heading, so the header
                  carries only the back control. */}
              <Stack.Screen
                name="schedule"
                options={{ title: '', headerBackTitle: 'Subjects' }}
              />
              <Stack.Screen
                name="settings"
                options={{ title: '', headerBackTitle: 'Deadlines' }}
              />
            </Stack>
          </SQLiteProvider>
        </Suspense>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  errorBody: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  retry: { marginTop: spacing.lg },
});
