import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { TRANSACTIONS, dayLabel, naira, timeLabel } from '../../data/transactions';

// TODO: replace this demo data with real data from your API
const wallet = {
  balance: 12450,
  accountNumber: '7012345678', // virtual account created for this user
  accountName: 'Tunenj - John Doe',
  bank: 'Wema Bank',
};

const MIN_AMOUNT = 100;
const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

type Method = 'transfer' | 'card';

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const [hidden, setHidden] = useState(false);
  const [method, setMethod] = useState<Method>('transfer');
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');

  const amountNumber = Number(amount) || 0;
  const canPay = amountNumber >= MIN_AMOUNT && !paying;

  // Funding done this month, from the shared demo data
  const fundedThisMonth = TRANSACTIONS.filter((t) => {
    const d = new Date(t.date);
    const now = new Date();
    return (
      t.category === 'funding' &&
      t.status === 'success' &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).reduce((sum, t) => sum + t.amount, 0);

  const recentFunding = TRANSACTIONS.filter((t) => t.category === 'funding').slice(0, 3);

  const copyNumber = async () => {
    await Clipboard.setStringAsync(wallet.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareDetails = () =>
    Share.share({
      message:
        `Fund my Tunenj wallet\nBank: ${wallet.bank}\n` +
        `Account number: ${wallet.accountNumber}\nAccount name: ${wallet.accountName}`,
    });

  const handlePay = async () => {
    if (!canPay) return;
    setPaying(true);
    setNotice('');
    try {
      // TODO: start your payment here (Paystack, Flutterwave, Monnify...).
      // Send amountNumber to your server, get a payment link or reference back,
      // then open the checkout. Confirm the payment on your server before crediting.
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setNotice(`Ready to charge ${naira(amountNumber)}. Connect your payment provider to continue.`);
    } finally {
      setPaying(false);
    }
  };

  const go = (route: string) => router.push(route as Href);

  return (
    <View className="flex-1 bg-brand-air">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 12 }} className="bg-brand px-5 pb-24">
          <Text className="text-2xl font-bold text-white">Wallet</Text>
        </View>

        {/* Balance card */}
        <View
          style={{ marginTop: -72, elevation: 8 }}
          className="mx-5 overflow-hidden rounded-3xl bg-brand-night p-5"
        >
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <View className="absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/5" />

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-white/70">Available balance</Text>
            <Pressable
              onPress={() => setHidden((v) => !v)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
            >
              <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text className="mt-2 text-[36px] font-bold tracking-tight text-white">
            {hidden ? '₦ ••••••' : naira(wallet.balance)}
          </Text>

          <View className="mt-4 flex-row items-center self-start rounded-full bg-white/10 px-3 py-1.5">
            <Ionicons name="trending-up-outline" size={14} color="#B3ADFF" />
            <Text className="ml-1.5 text-xs text-white/80">
              Funded this month: {hidden ? '••••' : naira(fundedThisMonth)}
            </Text>
          </View>
        </View>

        {/* Fund wallet */}
        <View className="mt-6 px-5">
          <Text className="mb-3 text-lg font-bold text-brand-night">Fund wallet</Text>

          {/* Method switch */}
          <View className="flex-row rounded-full bg-white p-1">
            {(
              [
                { id: 'transfer', label: 'Bank transfer', icon: 'business-outline' },
                { id: 'card', label: 'Card', icon: 'card-outline' },
              ] as const
            ).map((m) => {
              const active = method === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full ${
                    active ? 'bg-brand' : 'bg-transparent'
                  }`}
                >
                  <Ionicons name={m.icon} size={18} color={active ? '#FFFFFF' : '#281C9D'} />
                  <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-brand'}`}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {method === 'transfer' ? (
            <View className="mt-4 rounded-3xl bg-white p-5">
              <Text className="text-sm text-brand-night/60">
                Transfer to this account and your wallet is credited automatically.
              </Text>

              <View className="mt-4 rounded-2xl bg-brand-air p-4">
                <Text className="text-xs text-brand-night/60">Bank</Text>
                <Text className="text-base font-bold text-brand-night">{wallet.bank}</Text>

                <Text className="mt-3 text-xs text-brand-night/60">Account number</Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[26px] font-bold tracking-widest text-brand">
                    {wallet.accountNumber}
                  </Text>
                  <Pressable
                    onPress={copyNumber}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Copy account number"
                    className="flex-row items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 active:opacity-90"
                  >
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#FFFFFF" />
                    <Text className="text-xs font-semibold text-white">{copied ? 'Copied' : 'Copy'}</Text>
                  </Pressable>
                </View>

                <Text className="mt-3 text-xs text-brand-night/60">Account name</Text>
                <Text className="text-base font-bold text-brand-night">{wallet.accountName}</Text>
              </View>

              <Pressable
                onPress={shareDetails}
                accessibilityRole="button"
                className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-brand-mist active:opacity-90"
              >
                <Ionicons name="share-social-outline" size={18} color="#281C9D" />
                <Text className="text-base font-semibold text-brand">Share account details</Text>
              </Pressable>

              <View className="mt-4 gap-2">
                <View className="flex-row items-start gap-2">
                  <Ionicons name="flash-outline" size={16} color="#5A4EE6" />
                  <Text className="flex-1 text-xs leading-4 text-brand-night/70">
                    Usually credited within a few minutes.
                  </Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Ionicons name="shield-checkmark-outline" size={16} color="#5A4EE6" />
                  <Text className="flex-1 text-xs leading-4 text-brand-night/70">
                    Send only from a bank account in your own name.
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="mt-4 rounded-3xl bg-white p-5">
              <Text className="mb-2 text-sm font-semibold text-brand-night">Amount</Text>
              <View className="h-14 flex-row items-center rounded-2xl border border-brand-mist bg-white px-4">
                <Text className="mr-2 text-xl font-bold text-brand">₦</Text>
                <TextInput
                  value={amount}
                  onChangeText={(t) => setAmount(t.replace(/\D/g, '').slice(0, 7))}
                  placeholder="0"
                  placeholderTextColor="#9a96c8"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  className="flex-1 text-xl font-bold text-brand-night"
                />
              </View>
              <Text className="mt-1 text-xs text-brand-night/60">Minimum {naira(MIN_AMOUNT)}</Text>

              <View className="mt-3 flex-row flex-wrap gap-2">
                {QUICK_AMOUNTS.map((q) => {
                  const active = amountNumber === q;
                  return (
                    <Pressable
                      key={q}
                      onPress={() => setAmount(String(q))}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      className={`rounded-full border px-4 py-2 ${
                        active ? 'border-brand bg-brand' : 'border-brand-mist bg-white'
                      }`}
                    >
                      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-brand'}`}>
                        {naira(q).replace('.00', '')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {notice ? (
                <View className="mt-4 rounded-xl bg-brand-air px-4 py-3">
                  <Text className="text-sm text-brand-night">{notice}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handlePay}
                disabled={!canPay}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canPay }}
                className={`mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl ${
                  canPay ? 'bg-brand active:opacity-90' : 'bg-brand-mist/60'
                }`}
              >
                {paying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
                    <Text className="text-lg font-semibold text-white">
                      {amountNumber >= MIN_AMOUNT ? `Pay ${naira(amountNumber)}` : 'Pay with card'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Recent funding */}
        <View className="mt-7 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-brand-night">Recent funding</Text>
            <Pressable onPress={() => go('/transactions')} hitSlop={8}>
              <Text className="text-sm font-semibold text-brand">See all</Text>
            </Pressable>
          </View>

          <View className="rounded-3xl bg-white px-4">
            {recentFunding.length === 0 ? (
              <Text className="py-6 text-center text-sm text-brand-night/60">
                You haven&apos;t funded your wallet yet.
              </Text>
            ) : (
              recentFunding.map((t, i) => (
                <Pressable
                  key={t.id}
                  onPress={() => go(`/transactions/${t.id}`)}
                  accessibilityRole="button"
                  className={`flex-row items-center py-4 ${
                    i < recentFunding.length - 1 ? 'border-b border-brand-air' : ''
                  }`}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-green-50">
                    <Ionicons name="arrow-down-outline" size={20} color="#16A34A" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold text-brand-night">{t.sub}</Text>
                    <Text className="text-xs text-brand-night/60">
                      {dayLabel(t.date)}, {timeLabel(t.date)}
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-green-600">+{naira(t.amount)}</Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}