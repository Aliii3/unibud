import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { border, colors, radius, spacing } from '@/theme';

/**
 * Home is last in the bar, as drawn on page 3 of the notes, but it is still
 * the tab a cold launch lands on — an empty Doc list is a poor first screen.
 * Tab order follows the order these <Tabs.Screen> entries are declared in.
 */
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.faint,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: -0.1,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: border.width,
          borderTopColor: border.color,
          paddingTop: 7,
          paddingBottom: 10,
          height: 72,
        },
        tabBarItemStyle: { paddingVertical: 0 },
      }}
    >
      <Tabs.Screen
        name="docs"
        options={{
          title: 'Doc',
          tabBarIcon: (props) => <TabIcon {...props} name="document-text" />,
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: 'Todo',
          tabBarIcon: (props) => <TabIcon {...props} name="checkbox" />,
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: 'Deadline',
          tabBarIcon: (props) => <TabIcon {...props} name="alarm" />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: (props) => <TabIcon {...props} name="grid" />,
        }}
      />
    </Tabs>
  );
}

/** The active tab gets a lime pill behind its icon. */
function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
      color={color as string}
      size={19}
      style={
        focused
          ? {
              backgroundColor: colors.lime,
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: border.color,
              paddingHorizontal: spacing.md,
              paddingVertical: 2,
              overflow: 'hidden',
            }
          : {
              // A transparent border keeps inactive icons the same height as
              // the active one, so the labels sit on a common baseline.
              borderWidth: 1.5,
              borderColor: 'transparent',
              paddingHorizontal: spacing.md,
              paddingVertical: 2,
            }
      }
    />
  );
}
