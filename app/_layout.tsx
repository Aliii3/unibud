import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrate } from '@/db';
import { colors, spacing } from '@/theme';

function Booting() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

function BootFailed({ error }: { error: Error }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Unibud could not open its database</Text>
      <Text style={styles.errorBody}>{error.message}</Text>
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
            onError={(error) => <BootFailed error={error} />}
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
              <Stack.Screen name="schedule" options={{ title: 'Schedule' }} />
              <Stack.Screen name="settings" options={{ title: 'Daily check-in' }} />
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
});
