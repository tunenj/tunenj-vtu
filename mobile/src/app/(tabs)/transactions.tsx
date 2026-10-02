import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import {
  CATEGORY_META,
  STATUS_STYLE,
  TRANSACTIONS,
  dayLabel,
  naira,
  timeLabel,
} from '../../data/transactions';
import type { Transaction } from '../../data/transactions';

type CategoryFilter = 'all' | 'airtime' | 'data' | 'bills' | 'funding';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type StatusFilter = 'all' | 'success' | 'pending' | 'failed';

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'airtime', label: 'Airtime' },
  { id: 'data', label: 'Data' },
  { id: 'bills', label: 'Bills' },
  { id: 'funding', label: 'Funding' },
];

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: 'all', label: 'Any time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
];

const STATUS_FILTERS: { id: StatusFilter; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: '#281C9D' },
  { id: 'success', label: 'Success', color: '#16A34A' },
  { id: 'pending', label: 'Pending', color: '#F59E0B' },
  { id: 'failed', label: 'Failed', color: '#DC2626' },
];

const matchesCategory = (t: Transaction, f: CategoryFilter) => {
  if (f === 'all') return true;
  if (f === 'bills') return t.category === 'electricity' || t.category === 'cable';
  return t.category === f;
};

const matchesStatus = (t: Transaction, f: StatusFilter) => {
  if (f === 'all') return true;
  return t.status === f;
};

const matchesDate = (t: Transaction, f: DateFilter) => {
  if (f === 'all') return true;
  const d = new Date(t.date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (f === 'today') return d >= startOfToday;

  if (f === 'week') {
    const weekAgo = new Date(startOfToday);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }

  if (f === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  return true;
};

export default function Transactions() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: re-fetch your transactions from the API here
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const activeFilterCount =
    (dateFilter !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0);

  // Totals for the current month (successful transactions only)
  const totals = useMemo(() => {
    const now = new Date();
    let spent = 0;
    let funded = 0;
    TRANSACTIONS.forEach((t) => {
      const d = new Date(t.date);
      if (t.status !== 'success') return;
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
      if (t.amount < 0) spent += -t.amount;
      else funded += t.amount;
    });
    return { spent, funded };
  }, []);

  // Filter, search, then group by day
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = TRANSACTIONS.filter(
      (t) =>
        matchesCategory(t, category) &&
        matchesStatus(t, status) &&
        matchesDate(t, dateFilter) &&
        (q === '' ||
          t.title.toLowerCase().includes(q) ||
          t.sub.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q))
    ).sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const groups: { title: string; data: Transaction[] }[] = [];
    list.forEach((t) => {
      const title = dayLabel(t.date);
      const last = groups[groups.length - 1];
      if (last && last.title === title) last.data.push(t);
      else groups.push({ title, data: [t] });
    });
    return groups;
  }, [query, category, status, dateFilter]);

  const resultCount = sections.reduce((sum, s) => sum + s.data.length, 0);

  const clearAll = () => {
    setCategory('all');
    setDateFilter('all');
    setStatus('all');
    setQuery('');
  };

  const open = (id: string) => router.push(`/transactions/${id}` as Href);

  return (
    <View className="flex-1 bg-brand-air">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ─── Header ─────────────────────────────────────────────── */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="rounded-b-[28px] bg-brand px-5 pb-4"
      >
        <Text className="text-2xl font-bold text-white">Transactions</Text>

        <View className="mt-3 h-12 flex-row items-center rounded-2xl bg-white/15 px-4">
          <Ionicons name="search-outline" size={20} color="#FFFFFF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, number or reference"
            placeholderTextColor="rgba(255,255,255,0.65)"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="ml-3 flex-1 text-base text-white"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#281C9D"
            colors={['#281C9D']}
          />
        }
        ListHeaderComponent={
          <View>
            {/* ─── Monthly summary ─────────────────────────── */}
            <View className="mx-5 mt-3 flex-row rounded-3xl bg-white p-4">
              <View className="flex-1">
                <Text className="text-xs text-brand-night/60">Spent this month</Text>
                <Text className="mt-1 text-lg font-bold text-brand-night">
                  {naira(totals.spent)}
                </Text>
              </View>
              <View className="mx-3 w-px bg-brand-air" />
              <View className="flex-1">
                <Text className="text-xs text-brand-night/60">Funded this month</Text>
                <Text className="mt-1 text-lg font-bold text-green-600">
                  {naira(totals.funded)}
                </Text>
              </View>
            </View>

            {/* ─── Category chips ──────────────────────────── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 4 }}
              className="mt-3"
            >
              {CATEGORY_FILTERS.map((f) => {
                const active = f.id === category;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setCategory(f.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`h-10 items-center justify-center rounded-full border px-5 ${
                      active ? 'border-brand bg-brand' : 'border-brand-mist bg-white'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active ? 'text-white' : 'text-brand'
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* ─── Filter row (result count + filter button) ─ */}
            <View className="mx-5 mt-2 flex-row items-center justify-between">
              <Text className="text-xs text-brand-night/50">
                {resultCount} result{resultCount === 1 ? '' : 's'}
              </Text>

              <Pressable
                onPress={() => setShowFilters(true)}
                accessibilityRole="button"
                accessibilityLabel="Open filters"
                className={`h-9 flex-row items-center gap-1.5 rounded-full border px-3.5 active:opacity-80 ${
                  activeFilterCount > 0
                    ? 'border-brand bg-brand'
                    : 'border-brand-mist bg-white'
                }`}
              >
                <Ionicons
                  name="options-outline"
                  size={15}
                  color={activeFilterCount > 0 ? '#FFFFFF' : '#281C9D'}
                />
                <Text
                  className={`text-xs font-semibold ${
                    activeFilterCount > 0 ? 'text-white' : 'text-brand'
                  }`}
                >
                  Filter
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Text>
              </Pressable>
            </View>

            {/* ─── Active filter pills ─────────────────────── */}
            {activeFilterCount > 0 && (
              <View className="mx-5 mt-2 flex-row flex-wrap gap-2">
                {dateFilter !== 'all' && (
                  <Pressable
                    onPress={() => setDateFilter('all')}
                    accessibilityRole="button"
                    accessibilityLabel="Remove date filter"
                    className="flex-row items-center gap-1.5 rounded-full bg-brand-air px-3 py-1 active:opacity-70"
                  >
                    <Text className="text-xs font-semibold text-brand">
                      {DATE_FILTERS.find((d) => d.id === dateFilter)?.label}
                    </Text>
                    <Ionicons name="close" size={13} color="#281C9D" />
                  </Pressable>
                )}
                {status !== 'all' && (
                  <Pressable
                    onPress={() => setStatus('all')}
                    accessibilityRole="button"
                    accessibilityLabel="Remove status filter"
                    className="flex-row items-center gap-1.5 rounded-full bg-brand-air px-3 py-1 active:opacity-70"
                  >
                    <Text className="text-xs font-semibold text-brand">
                      {STATUS_FILTERS.find((s) => s.id === status)?.label}
                    </Text>
                    <Ionicons name="close" size={13} color="#281C9D" />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text className="mx-5 mb-1.5 mt-4 text-sm font-semibold text-brand-night/60">
            {section.title}
          </Text>
        )}
        renderItem={({ item, index, section }) => {
          const st = STATUS_STYLE[item.status];
          const credit = item.amount > 0;
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            <Pressable
              onPress={() => open(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${st.label}`}
              className={`mx-5 flex-row items-center bg-white px-4 py-3.5 active:opacity-80 ${
                first ? 'rounded-t-3xl' : ''
              } ${last ? 'rounded-b-3xl' : 'border-b border-brand-air'}`}
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-air">
                <Ionicons
                  name={CATEGORY_META[item.category].icon}
                  size={20}
                  color="#281C9D"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text
                  className="text-base font-semibold text-brand-night"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className="text-xs text-brand-night/60" numberOfLines={1}>
                  {item.sub} · {timeLabel(item.date)}
                </Text>
              </View>

              <View className="items-end">
                <Text
                  className={`text-base font-bold ${
                    credit ? 'text-green-600' : 'text-brand-night'
                  }`}
                >
                  {credit ? '+' : '-'}
                  {naira(Math.abs(item.amount))}
                </Text>
                <View className={`mt-1 rounded-full px-2 py-0.5 ${st.box}`}>
                  <Text className={`text-[10px] font-semibold ${st.text}`}>
                    {st.label}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center px-10 pt-12">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-white">
              <Ionicons name="receipt-outline" size={36} color="#281C9D" />
            </View>
            <Text className="mt-4 text-lg font-bold text-brand-night">
              No transactions found
            </Text>
            <Text className="mt-1 text-center text-sm text-brand-night/60">
              Try a different search or filter.
            </Text>
            {activeFilterCount > 0 || category !== 'all' || query !== '' ? (
              <Pressable
                onPress={clearAll}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
                className="mt-5 h-11 flex-row items-center gap-2 rounded-full bg-brand px-5 active:opacity-90"
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text className="text-sm font-semibold text-white">
                  Clear filters
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
      />

      {/* ─── Filters Modal ──────────────────────────────────── */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
        statusBarTranslucent
      >
        <Pressable
          onPress={() => setShowFilters(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ paddingBottom: insets.bottom + 16 }}
            className="rounded-t-3xl bg-white px-5 pt-3"
          >
            {/* Drag handle */}
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-black/10" />

            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-brand-night">Filters</Text>
              <Pressable
                onPress={clearAll}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Reset all filters"
              >
                <Text className="text-sm font-semibold text-brand">Reset</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date */}
              <Text className="mb-2 text-sm font-semibold text-brand-night">
                Date
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {DATE_FILTERS.map((f) => {
                  const active = dateFilter === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => setDateFilter(f.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      className={`h-10 items-center justify-center rounded-full border px-4 ${
                        active ? 'border-brand bg-brand' : 'border-brand-mist bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          active ? 'text-white' : 'text-brand'
                        }`}
                      >
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Status */}
              <Text className="mb-2 mt-6 text-sm font-semibold text-brand-night">
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => {
                  const active = status === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => setStatus(f.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      className={`h-10 flex-row items-center gap-2 rounded-full border px-4 ${
                        active ? 'border-brand bg-brand' : 'border-brand-mist bg-white'
                      }`}
                    >
                      <View
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: active ? '#FFFFFF' : f.color }}
                      />
                      <Text
                        className={`text-sm font-semibold ${
                          active ? 'text-white' : 'text-brand'
                        }`}
                      >
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Apply */}
            <Pressable
              onPress={() => setShowFilters(false)}
              accessibilityRole="button"
              className="mt-6 h-14 items-center justify-center rounded-2xl bg-brand active:opacity-90"
            >
              <Text className="text-lg font-semibold text-white">
                Show results
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}