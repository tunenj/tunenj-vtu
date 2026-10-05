import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ServiceHeader from '../../components/ServiceHeader';
import { fullDate, naira } from '../../data/transactions';
import mtnLogo from '../../../assets/images/networks/mtn.png';
import airtelLogo from '../../../assets/images/networks/airtel.png';
import gloLogo from '../../../assets/images/networks/glo.png';
import nineMobileLogo from '../../../assets/images/networks/9mobile.png';

type Network = { id: string; label: string; logo: ImageSourcePropType };

const NETWORKS: Network[] = [
  { id: 'mtn', label: 'MTN', logo: mtnLogo },
  { id: 'airtel', label: 'Airtel', logo: airtelLogo },
  { id: 'glo', label: 'Glo', logo: gloLogo },
  { id: '9mobile', label: '9mobile', logo: nineMobileLogo },
];

type Category = 'daily' | 'weekly' | 'monthly';
type Plan = {
  id: string;
  size: string;
  days: number;
  price: number;
  category: Category;
};

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

// TODO: these plans and prices are examples only. Load the real plans for the
// chosen network from your API, because each network has its own list and prices.
const PLANS: Plan[] = [
  { id: 'd1', size: '100MB', days: 1, price: 100, category: 'daily' },
  { id: 'd2', size: '200MB', days: 1, price: 200, category: 'daily' },
  { id: 'd3', size: '1GB', days: 1, price: 350, category: 'daily' },
  { id: 'w1', size: '1GB', days: 7, price: 500, category: 'weekly' },
  { id: 'w2', size: '2GB', days: 7, price: 800, category: 'weekly' },
  { id: 'w3', size: '6GB', days: 7, price: 1500, category: 'weekly' },
  { id: 'm1', size: '1.5GB', days: 30, price: 1000, category: 'monthly' },
  { id: 'm2', size: '3GB', days: 30, price: 1500, category: 'monthly' },
  { id: 'm3', size: '10GB', days: 30, price: 3000, category: 'monthly' },
  { id: 'm4', size: '20GB', days: 30, price: 5000, category: 'monthly' },
];

const validity = (days: number) => (days === 1 ? '1 day' : `${days} days`);

// ---- Change the success wording here ----
const SUCCESS_TITLE = 'Data sent!';
const successMessage = (size: string, network: string, phone: string) =>
  `${size} ${network} data has been sent to ${phone}. Thank you for using Tunenj.`;
// -----------------------------------------

type Purchase = {
  plan: Plan;
  network: string;
  networkLogo: ImageSourcePropType;
  phone: string;
};

type Receipt = Purchase & { reference: string; date: string };

// Round white badge that holds a network logo
function NetworkLogo({
  source,
  label,
  size,
}: {
  source: ImageSourcePropType;
  label: string;
  size: number;
}) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center overflow-hidden border border-brand-air bg-white"
    >
      <Image
        source={source}
        alt={`${label} logo`}
        accessibilityLabel={`${label} logo`}
        style={{ width: size * 0.78, height: size * 0.78 }}
        resizeMode="contain"
      />
    </View>
  );
}

export default function Data() {
  const insets = useSafeAreaInsets();
  const [network, setNetwork] = useState('mtn');
  const [category, setCategory] = useState<Category>('monthly');
  const [planId, setPlanId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Purchase | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const plans = PLANS.filter((p) => p.category === category);
  const selectedPlan = PLANS.find((p) => p.id === planId) ?? null;
  const canSubmit = phone.length === 11 && selectedPlan !== null && !loading;

  const resetForm = () => {
    setPhone('');
    setPlanId(null);
    setError('');
  };

  const buy = () => {
    if (!/^0[789][01]\d{8}$/.test(phone))
      return setError('Enter a valid Nigerian phone number');
    if (!selectedPlan) return setError('Choose a data plan');
    setError('');

    const selected = NETWORKS.find((n) => n.id === network) ?? NETWORKS[0];
    setPending({
      plan: selectedPlan,
      network: selected.label,
      networkLogo: selected.logo,
      phone,
    });
  };

  const confirmPurchase = async () => {
    if (!pending) return;
    setLoading(true);
    try {
      // TODO: ask for the transaction PIN here, then call your API:
      // const res = await fetch('https://your-api.com/services/data', { method: 'POST', ... });
      // if (!res.ok) throw new Error('Purchase failed');
      // const { reference } = await res.json();
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setReceipt({
        ...pending,
        reference: `TNJ-${Date.now().toString().slice(-8)}`, // use the real reference from your API
        date: new Date().toISOString(),
      });
      setPending(null);
    } catch {
      setError('Purchase failed. Try again.');
      setPending(null);
    } finally {
      setLoading(false);
    }
  };

  const cancelPending = () => {
    if (loading) return;
    setPending(null);
  };

  const done = () => {
    setReceipt(null);
    resetForm();
    router.replace('/home');
  };

  const buyAgain = () => {
    setReceipt(null);
    resetForm();
  };

  return (
    <View className="flex-1 bg-brand">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <ServiceHeader title="Buy data" subtitle="Pick a plan for any network" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 rounded-t-[32px] bg-white"
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          {/* Network */}
          <Text className="mb-3 text-sm font-semibold text-brand-night">
            Network
          </Text>
          <View className="flex-row gap-3">
            {NETWORKS.map((n) => {
              const active = network === n.id;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => {
                    setNetwork(n.id);
                    setPlanId(null); // plans differ per network, so clear the choice
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={n.label}
                  accessibilityState={{ selected: active }}
                  className={`flex-1 items-center rounded-2xl border-2 py-3 ${
                    active
                      ? 'border-brand bg-brand-air'
                      : 'border-transparent bg-brand-air/60'
                  }`}
                >
                  <NetworkLogo source={n.logo} label={n.label} size={44} />
                  <Text className="mt-1.5 text-xs font-semibold text-brand-night">
                    {n.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Phone */}
          <Text className="mb-2 mt-6 text-sm font-semibold text-brand-night">
            Phone number
          </Text>
          <View className="h-14 flex-row items-center rounded-2xl border border-brand-mist bg-white px-4">
            <TextInput
              value={phone}
              onChangeText={(t) => {
                setPhone(t.replace(/\D/g, '').slice(0, 11));
                setError('');
              }}
              placeholder="08012345678"
              placeholderTextColor="#9a96c8"
              keyboardType="phone-pad"
              maxLength={11}
              className="flex-1 text-base text-brand-night"
            />
          </View>

          {/* Plan type tabs */}
          <Text className="mb-3 mt-6 text-sm font-semibold text-brand-night">
            Choose a plan
          </Text>
          <View className="flex-row rounded-full bg-brand-air p-1">
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setCategory(c.id);
                    setPlanId(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`h-10 flex-1 items-center justify-center rounded-full ${
                    active ? 'bg-brand' : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active ? 'text-white' : 'text-brand'
                    }`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Plans */}
          <View className="mt-4 flex-row flex-wrap justify-between">
            {plans.map((p) => {
              const active = planId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setPlanId(p.id);
                    setError('');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.size}, ${validity(p.days)}, ${naira(p.price)}`}
                  accessibilityState={{ selected: active }}
                  style={{ width: '48%' }}
                  className={`mb-3 rounded-2xl border-2 p-4 ${
                    active ? 'border-brand bg-brand-air' : 'border-brand-mist bg-white'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-brand-night">
                      {p.size}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark-circle" size={20} color="#281C9D" />
                    )}
                  </View>
                  <Text className="mt-0.5 text-xs text-brand-night/60">
                    {validity(p.days)}
                  </Text>
                  <Text className="mt-3 text-base font-bold text-brand">
                    {naira(p.price).replace('.00', '')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Button */}
          <Pressable
            onPress={buy}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            className={`mt-4 h-14 items-center justify-center rounded-2xl ${
              canSubmit ? 'bg-brand active:opacity-90' : 'bg-brand-mist/60'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-lg font-semibold text-white">
                {selectedPlan
                  ? `Buy ${selectedPlan.size} for ${naira(selectedPlan.price).replace(
                      '.00',
                      ''
                    )}`
                  : 'Buy data'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Confirm Purchase Sheet ───────────────────────────── */}
      <Modal
        visible={pending !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={cancelPending}
      >
        <Pressable
          onPress={cancelPending}
          className="flex-1 justify-end bg-black/50"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ paddingBottom: insets.bottom + 20 }}
            className="rounded-t-[32px] bg-white px-6 pt-3"
          >
            <View className="mb-5 h-1 w-10 self-center rounded-full bg-black/10" />

            {pending && (
              <>
                <View className="flex-row items-center gap-3">
                  <NetworkLogo
                    source={pending.networkLogo}
                    label={pending.network}
                    size={48}
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-brand-night">
                      Confirm purchase
                    </Text>
                    <Text className="text-xs text-brand-night/60">
                      Review before you pay
                    </Text>
                  </View>
                </View>

                <View className="mt-6 items-center rounded-2xl bg-brand-air/50 py-5">
                  <Text className="text-xs uppercase tracking-wider text-brand-night/60">
                    You&apos;re paying
                  </Text>
                  <Text className="mt-1 text-[34px] font-bold tracking-tight text-brand">
                    {naira(pending.plan.price)}
                  </Text>
                </View>

                <View className="mt-5 rounded-2xl border border-brand-mist bg-white px-4">
                  {[
                    { label: 'Network', value: pending.network },
                    {
                      label: 'Data plan',
                      value: `${pending.plan.size} · ${validity(pending.plan.days)}`,
                    },
                    { label: 'Phone number', value: pending.phone },
                    { label: 'Amount', value: naira(pending.plan.price) },
                  ].map((row, i, arr) => (
                    <View
                      key={row.label}
                      className={`flex-row items-center justify-between py-3.5 ${
                        i < arr.length - 1 ? 'border-b border-brand-air' : ''
                      }`}
                    >
                      <Text className="text-xs text-brand-night/60">
                        {row.label}
                      </Text>
                      <Text className="ml-4 flex-1 text-right text-sm font-semibold text-brand-night">
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mt-4 flex-row items-start gap-2.5 rounded-2xl bg-brand-air/50 p-3.5">
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#281C9D"
                  />
                  <Text className="flex-1 text-xs leading-5 text-brand-night/80">
                    Make sure the phone number and network are correct. Data
                    purchases cannot be reversed.
                  </Text>
                </View>

                <View className="mt-6 flex-row gap-3">
                  <Pressable
                    onPress={cancelPending}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel purchase"
                    className="h-14 flex-1 items-center justify-center rounded-2xl border border-brand-mist bg-white active:bg-brand-air/40"
                  >
                    <Text className="text-base font-semibold text-brand-night">
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={confirmPurchase}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm purchase"
                    className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-brand active:opacity-90"
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons
                          name="lock-closed-outline"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text className="text-base font-semibold text-white">
                          Pay {naira(pending.plan.price).replace('.00', '')}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Success Modal ────────────────────────────────────── */}
      <Modal
        visible={receipt !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={done}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          {receipt && (
            <View className="w-full rounded-3xl bg-white px-6 pb-6 pt-10">
              {/* ─── Network logo at the top with success badge ─── */}
              <View className="items-center">
                <View className="relative">
                  {/* Network logo — large, on a branded ring */}
                  <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-air p-0.5">
                    <View className="h-full w-full items-center justify-center rounded-full bg-white">
                      <Image
                        source={receipt.networkLogo}
                        alt={`${receipt.network} logo`}
                        accessibilityLabel={`${receipt.network} logo`}
                        style={{ width: 76, height: 76 }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>

                  {/* Success checkmark badge — overlays bottom-right */}
                  <View className="absolute -bottom-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-emerald-500">
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </View>
                </View>

                <Text className="mt-5 text-2xl font-bold text-brand">
                  {SUCCESS_TITLE}
                </Text>
                <Text className="mt-2 text-center text-sm leading-5 text-brand-night/70">
                  {successMessage(
                    receipt.plan.size,
                    receipt.network,
                    receipt.phone
                  )}
                </Text>
              </View>

              {/* Summary */}
              <View className="mt-6 rounded-2xl bg-brand-air px-4">
                <View className="flex-row items-center justify-between border-b border-white py-3">
                  <Text className="text-xs text-brand-night/60">Network</Text>
                  <View className="ml-4 flex-1 flex-row items-center justify-end gap-2">
                    <NetworkLogo
                      source={receipt.networkLogo}
                      label={receipt.network}
                      size={24}
                    />
                    <Text className="text-sm font-semibold text-brand-night">
                      {receipt.network}
                    </Text>
                  </View>
                </View>
                {[
                  {
                    label: 'Data plan',
                    value: `${receipt.plan.size} · ${validity(receipt.plan.days)}`,
                  },
                  { label: 'Amount', value: naira(receipt.plan.price) },
                  { label: 'Phone number', value: receipt.phone },
                  { label: 'Reference', value: receipt.reference },
                  { label: 'Date', value: fullDate(receipt.date) },
                ].map((row, i, arr) => (
                  <View
                    key={row.label}
                    className={`flex-row items-center justify-between py-3 ${
                      i < arr.length - 1 ? 'border-b border-white' : ''
                    }`}
                  >
                    <Text className="text-xs text-brand-night/60">
                      {row.label}
                    </Text>
                    <Text className="ml-4 flex-1 text-right text-sm font-semibold text-brand-night">
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={done}
                accessibilityRole="button"
                className="mt-6 h-14 items-center justify-center rounded-2xl bg-brand active:opacity-90"
              >
                <Text className="text-lg font-semibold text-white">Done</Text>
              </Pressable>
              <Pressable
                onPress={buyAgain}
                accessibilityRole="button"
                className="mt-3 h-12 items-center justify-center rounded-2xl border border-brand-mist active:opacity-90"
              >
                <Text className="text-base font-semibold text-brand">
                  Buy again
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}