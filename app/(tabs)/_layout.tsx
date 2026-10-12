import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import type { ColorValue } from 'react-native';

import { border, colors, radius } from '@/theme';

/**
 * Home is first in the bar, and the tab a cold launch lands on.
 *
 * Page 3 of the notes draws it last, and it was built that way, but a home
 * tab the thumb has to cross the whole bar to reach is the wrong trade: it
 * is where every other screen is reached from. Order follows the order these
 * <Tabs.Screen> entries are declared in.
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
          // Positive, not negative. It was -2, tuned when the active icon had
          // no visible edge; against the pill's outline the label touched it.
          marginTop: 3,
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
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: (props) => <TabIcon {...props} name="grid" />,
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
        name="todo"
        options={{
          title: 'Todo',
          tabBarIcon: (props) => <TabIcon {...props} name="checkbox" />,
        }}
      />
      <Tabs.Screen
        name="docs"
        options={{
          title: 'Doc',
          tabBarIcon: (props) => <TabIcon {...props} name="document-text" />,
        }}
      />
    </Tabs>
  );
}

/**
 * The active tab gets a lime pill behind its icon.
 *
 * The pill is a fixed-size box with the glyph centred in it, rather than
 * padding on the icon itself. Padding made the pill as wide as whatever
 * glyph it held, so each tab's highlight came out a different width and sat
 * off-centre against its label. The inactive state keeps the same box with a
 * transparent border, so every icon occupies identical space and the labels
 * share a baseline.
 */
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
    <View style={[styles.slot, focused ? styles.slotActive : null]}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
        color={color as string}
        size={19}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 46,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm - 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  slotActive: { backgroundColor: colors.lime, borderColor: border.color },
});
