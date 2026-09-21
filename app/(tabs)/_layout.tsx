import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme';

/**
 * The four tabs sketched on page 3 of the notes: doc, todo, deadline, home.
 * Home is placed first here because it is the entry point and the tab a
 * cold launch lands on; the sketch drew it last. Reorder the <Tabs.Screen>
 * entries to match the sketch exactly if that is preferred.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="docs"
        options={{
          title: 'Doc',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: 'Todo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: 'Deadline',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alarm-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
