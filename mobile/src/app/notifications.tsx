import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useNotifications } from './context/NotificationsContext';
import { KIND_ICON } from '../data/notifications';
import type { AppNotification } from '../data/notifications';
import { dayLabel, timeLabel } from '../data/transactions';

type Filter = 'all' | 'unread';

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { items, unreadCount, markRead, markAllRead, refresh } = useNotifications();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Filter, sort newest first, then group by day
  const sections = useMemo(() => {
    const list = items
      .filter((n) => filter === 'all' || !n.read)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const groups: { title: string; data: AppNotification[] }[] = [];
    list.forEach((n) => {
      const title = dayLabel(n.date);
      const last = groups[groups.length - 1];
      if (last && last.title === title) last.data.push(n);
      else groups.push({ title, data: [n] });
    });
    return groups;
  }, [items, filter]);

  const open = (n: AppNotification) => {
    markRead(n.id);
    if (n.href) router.push(n.href as Href);
  };

  return (
    <View className="flex-1 bg-brand-air">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="rounded-b-[28px] bg-brand px-5 pb-5">
        <View className="h-11 flex-row items-center">
          <Pressable
            onPress={goBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="mr-3 h-9 w-9 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-xl font-semibold text-white">Notifications</Text>
          <Pressable
            onPress={markAllRead}
            disabled={unreadCount === 0}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            className={unreadCount === 0 ? 'opacity-40' : ''}
          >
            <Text className="text-sm font-semibold text-white">Mark all read</Text>
          </Pressable>
        </View>

        {/* Filter tabs */}
        <View className="mt-4 flex-row rounded-full bg-white/15 p-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'unread', label: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread' },
            ] as const
          ).map((t) => {
            const active = filter === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setFilter(t.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={`h-10 flex-1 items-center justify-center rounded-full ${
                  active ? 'bg-white' : 'bg-transparent'
                }`}
              >
                <Text className={`text-sm font-semibold ${active ? 'text-brand' : 'text-white'}`}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#281C9D"
            colors={['#281C9D']}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text className="mx-5 mb-2 mt-5 text-sm font-semibold text-brand-night/60">
            {section.title}
          </Text>
        )}
        renderItem={({ item, index, section }) => {
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            <Pressable
              onPress={() => open(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
              className={`mx-5 flex-row bg-white px-4 py-4 active:opacity-80 ${
                first ? 'rounded-t-3xl' : ''
              } ${last ? 'rounded-b-3xl' : 'border-b border-brand-air'}`}
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-air">
                <Ionicons name={KIND_ICON[item.kind]} size={20} color="#281C9D" />
              </View>

              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text
                    className={`flex-1 text-base text-brand-night ${
                      item.read ? 'font-medium' : 'font-bold'
                    }`}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {!item.read && <View className="ml-2 h-2.5 w-2.5 rounded-full bg-brand" />}
                </View>
                <Text className="mt-0.5 text-sm leading-5 text-brand-night/70" numberOfLines={2}>
                  {item.body}
                </Text>
                <Text className="mt-1.5 text-xs text-brand-night/50">{timeLabel(item.date)}</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center px-10 pt-20">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-white">
              <Ionicons name="notifications-off-outline" size={36} color="#281C9D" />
            </View>
            <Text className="mt-4 text-lg font-bold text-brand-night">
              {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
            </Text>
            <Text className="mt-1 text-center text-sm text-brand-night/60">
              {filter === 'unread'
                ? 'You have no unread notifications.'
                : 'Receipts, wallet updates and account alerts will show up here.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}