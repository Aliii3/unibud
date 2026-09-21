import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/ui';
import { DATABASE_NAME, migrate } from '@/db';
import { colors, spacing } from '@/theme';

function Booting() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.blue} />
    </View>
  );
}

/**
 * Catches a failed migration or a database that will not open. SQLiteProvider
 * rejects `onError` when `useSuspense` is set, so recovery belongs here.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // On web, SQLite needs OPFS, which browsers only expose on a secure
  // origin. Opening the dev server over http:// at a LAN address fails this
  // way, and the raw message does not say what to do about it.
  const insecureWebOrigin =
    Platform.OS === 'web' && /navigator\.storage|not secure/i.test(error.message);

  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Unibud could not start</Text>
      <Text style={styles.errorBody}>
        {insecureWebOrigin
          ? 'The web preview stores data in the browser, which only works on a secure address. Open it on localhost on this machine, or use the app on a phone instead.'
          : error.message}
      </Text>
      {insecureWebOrigin ? (
        <Text style={styles.errorDetail}>{error.message}</Text>
      ) : null}
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
                headerTintColor: colors.ink,
                headerTitleStyle: { color: colors.ink, fontWeight: '800' },
                // Match the canvas, or the header reads as a white band
                // sitting on cream.
                headerStyle: { backgroundColor: colors.canvas },
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
  errorBody: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorDetail: {
    fontSize: 12,
    color: colors.faint,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retry: { marginTop: spacing.lg },
});
