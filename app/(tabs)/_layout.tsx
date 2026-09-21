import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme';

/**
 * Home is last in the bar, as drawn on page 3 of the notes, but it is still
 * the tab a cold launch lands on — an empty Doc list is a poor first screen.
 * Tab order follows the order these <Tabs.Screen> entries are declared in.
 */
export const unstable_settings = {
  initialRouteName: 'index',
};

/** The four tabs sketched on page 3 of the notes: doc, todo, deadline, home. */
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
