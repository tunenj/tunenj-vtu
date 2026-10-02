import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Href } from 'expo-router';

// Set to false if your business has no referral programme
const SHOW_REFERRAL = true;

type IconName = keyof typeof Ionicons.glyphMap;

// TODO: replace this demo data with real data from your API
const user = { firstName: 'John', phone: '08012345678', balance: 12450 };

type Service = { id: string; label: string; icon: IconName; route: string };

const services: Service[] = [
  { id: 'airtime', label: 'Airtime', icon: 'call-outline', route: '/services/airtime' },
  { id: 'data', label: 'Data', icon: 'cellular-outline', route: '/services/data' },
  { id: 'electricity', label: 'Electricity', icon: 'flash-outline', route: '/services/electricity' },
  { id: 'cable', label: 'Cable TV', icon: 'tv-outline', route: '/services/cable-tv' },
  { id: 'education', label: 'Education', icon: 'school-outline', route: '/services/education' },
  { id: 'internet', label: 'Internet', icon: 'wifi-outline', route: '/services/internet' },
  { id: 'betting', label: 'Betting', icon: 'football-outline', route: '/services/betting' },
  { id: 'more', label: 'More', icon: 'apps-outline', route: '/services/more' },
];

type Status = 'success' | 'pending' | 'failed';
type Tx = {
  id: string;
  title: string;
  sub: string;
  amount: number; // negative = money out
  date: string;
  status: Status;
  icon: IconName;
};

const transactions: Tx[] = [
  { id: '1', title: 'MTN 2GB Data', sub: '08031234567', amount: -1000, date: 'Today, 9:41 AM', status: 'success', icon: 'cellular-outline' },
  { id: '2', title: 'Wallet funding', sub: 'Bank transfer', amount: 5000, date: 'Yesterday, 4:12 PM', status: 'success', icon: 'wallet-outline' },
  { id: '3', title: 'Ikeja Electric', sub: 'Meter 4512 ••• 890', amount: -3500, date: 'Mon, 11:05 AM', status: 'pending', icon: 'flash-outline' },
  { id: '4', title: 'Airtel Airtime', sub: '08024567890', amount: -500, date: 'Sun, 7:30 PM', status: 'failed', icon: 'call-outline' },
];

const statusStyle: Record<Status, { box: string; text: string; label: string }> = {
  success: { box: 'bg-green-50', text: 'text-green-700', label: 'Successful' },
  pending: { box: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  failed: { box: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
};

const naira = (n: number) => '₦' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const [hidden, setHidden] = useState(false);

  const go = (route: string) => router.push(route as Href);

  return (
    <View className="flex-1 bg-brand-air">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="rounded-b-[32px] bg-brand px-5 pb-20"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-white/70">{greeting()}</Text>
              <Text className="text-2xl font-bold text-white">{user.firstName}</Text>
            </View>
            <Pressable
              onPress={() => go('/notifications')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Wallet card */}
        <View
          style={{ marginTop: -56, elevation: 6 }}
          className="mx-5 rounded-3xl bg-white p-5 shadow-lg"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-brand-night/70">Wallet balance</Text>
            <Pressable
              onPress={() => setHidden((v) => !v)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
            >
              <Ionicons
                name={hidden ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#281C9D"
              />
            </Pressable>
          </View>

          <Text className="mt-1 text-[34px] font-bold tracking-tight text-brand">
            {hidden ? '₦ ••••••' : naira(user.balance)}
          </Text>
          <Text className="mt-1 text-xs text-brand-night/60">Account number: {user.phone}</Text>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={() => go('/wallet')}
              accessibilityRole="button"
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-brand active:opacity-90"
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white">Fund wallet</Text>
            </Pressable>
            <Pressable
              onPress={() => go('/transactions')}
              accessibilityRole="button"
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-brand-mist bg-white active:opacity-90"
            >
              <Ionicons name="time-outline" size={20} color="#281C9D" />
              <Text className="text-base font-semibold text-brand">History</Text>
            </Pressable>
          </View>
        </View>

        {/* Services */}
        <View className="mt-7 px-5">
          <Text className="mb-4 text-lg font-bold text-brand-night">Services</Text>
          <View className="flex-row flex-wrap">
            {services.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => go(s.route)}
                accessibilityRole="button"
                accessibilityLabel={s.label}
                style={{ width: '25%' }}
                className="mb-5 items-center active:opacity-70"
              >
                <View className="h-14 w-14 items-center justify-center rounded-2xl border border-brand-mist bg-white">
                  <Ionicons name={s.icon} size={26} color="#281C9D" />
                </View>
                <Text className="mt-2 text-xs font-semibold text-brand-night">{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Referral banner */}
        {SHOW_REFERRAL && (
          <Pressable
            onPress={() => go('/referral')}
            accessibilityRole="button"
            className="mx-5 mt-1 overflow-hidden rounded-3xl bg-brand p-5 active:opacity-90"
          >
            <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <View className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/10" />
            <Text className="text-lg font-bold text-white">Invite friends, earn rewards</Text>
            <Text className="mt-1 max-w-[75%] text-sm text-white/80">
              Share your code and get a bonus when they make their first purchase.
            </Text>
            <View className="mt-3 flex-row items-center gap-1">
              <Text className="text-sm font-semibold text-white">Invite now</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        )}

        {/* Recent transactions */}
        <View className="mt-7 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-brand-night">Recent transactions</Text>
            <Pressable onPress={() => go('/transactions')} hitSlop={8}>
              <Text className="text-sm font-semibold text-brand">See all</Text>
            </Pressable>
          </View>

          <View className="rounded-3xl bg-white px-4">
            {transactions.map((t, i) => {
              const st = statusStyle[t.status];
              const credit = t.amount > 0;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => go(`/transactions/${t.id}`)}
                  accessibilityRole="button"
                  className={`flex-row items-center py-4 ${
                    i < transactions.length - 1 ? 'border-b border-brand-air' : ''
                  }`}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-air">
                    <Ionicons name={t.icon} size={20} color="#281C9D" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold text-brand-night" numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text className="text-xs text-brand-night/60" numberOfLines={1}>
                      {t.sub} · {t.date}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text
                      className={`text-base font-bold ${credit ? 'text-green-600' : 'text-brand-night'}`}
                    >
                      {credit ? '+' : '-'}
                      {naira(Math.abs(t.amount))}
                    </Text>
                    <View className={`mt-1 rounded-full px-2 py-0.5 ${st.box}`}>
                      <Text className={`text-[10px] font-semibold ${st.text}`}>{st.label}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}