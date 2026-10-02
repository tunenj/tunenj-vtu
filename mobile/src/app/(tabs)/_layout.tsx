import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';

type IconName = keyof typeof Ionicons.glyphMap;

// Props that the tab bar receives, taken from Tabs itself (no extra import needed)
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

// Icons for each tab, keyed by the file name in (tabs)/
const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  home: { active: 'home', inactive: 'home-outline' },
  transactions: { active: 'receipt', inactive: 'receipt-outline' },
  wallet: { active: 'wallet', inactive: 'wallet-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingBottom: insets.bottom + 8 }}
      className="flex-row border-t border-brand-air bg-white px-2 pt-2"
    >
      {state.routes.map((route, index) => {
        const icons = ICONS[route.name];
        if (!icons) return null; // hide any route that isn't a tab

        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            className="flex-1 items-center"
          >
            <View
              className={`h-8 w-14 items-center justify-center rounded-full ${
                focused ? 'bg-brand-air' : 'bg-transparent'
              }`}
            >
              <Ionicons
                name={focused ? icons.active : icons.inactive}
                size={22}
                color={focused ? '#281C9D' : '#9a96c8'}
              />
            </View>
            <Text
              className={`mt-1 text-xs ${
                focused ? 'font-bold text-brand' : 'font-medium text-brand-night/50'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}