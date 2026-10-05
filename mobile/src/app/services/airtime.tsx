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
const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];
const MIN_AMOUNT = 50;
const MAX_AMOUNT = 50000;

// ---- Change the success wording here ----
const SUCCESS_TITLE = 'Airtime sent!';
const successMessage = (amount: number, network: string, phone: string) =>
  `${naira(amount)} ${network} airtime has been sent to ${phone}. Thank you for using Tunenj.`;
// -----------------------------------------

type Receipt = {
  amount: number;
  network: string;
  networkLogo: ImageSourcePropType;
  phone: string;
  reference: string;
  date: string;
};

type PendingPurchase = {
  amount: number;
  network: string;
  networkLogo: ImageSourcePropType;
  phone: string;
};

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

export default function Airtime() {
  const insets = useSafeAreaInsets();
  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pending, setPending] = useState<PendingPurchase | null>(null);

  const amountNumber = Number(amount) || 0;
  const canSubmit =
    phone.length === 11 && amountNumber >= MIN_AMOUNT && !loading;

  const resetForm = () => {
    setPhone('');
    setAmount('');
    setError('');
  };

  const buy = () => {
    if (!/^0[789][01]\d{8}$/.test(phone))
      return setError('Enter a valid Nigerian phone number');
    if (amountNumber < MIN_AMOUNT || amountNumber > MAX_AMOUNT)
      return setError(
        `Amount must be between ${naira(MIN_AMOUNT)} and ${naira(MAX_AMOUNT)}`
      );
    setError('');

    const selected = NETWORKS.find((n) => n.id === network) ?? NETWORKS[0];

    setPending({
      amount: amountNumber,
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
      // const res = await fetch('https://your-api.com/services/airtime', { method: 'POST', ... });
      // if (!res.ok) throw new Error('Purchase failed');
      // const { reference } = await res.json();
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setReceipt({
        amount: pending.amount,
        network: pending.network,
        networkLogo: pending.networkLogo,
        phone: pending.phone,
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
      <ServiceHeader title="Buy airtime" subtitle="Top up any network instantly" />

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
                  onPress={() => setNetwork(n.id)}
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

          {/* Amount */}
          <Text className="mb-2 mt-5 text-sm font-semibold text-brand-night">
            Amount
          </Text>
          <View className="h-14 flex-row items-center rounded-2xl border border-brand-mist bg-white px-4">
            <Text className="mr-2 text-xl font-bold text-brand">₦</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => {
                setAmount(t.replace(/\D/g, '').slice(0, 5));
                setError('');
              }}
              placeholder="0"
              placeholderTextColor="#9a96c8"
              keyboardType="number-pad"
              className="flex-1 text-xl font-bold text-brand-night"
            />
          </View>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {QUICK_AMOUNTS.map((q) => {
              const active = amountNumber === q;
              return (
                <Pressable
                  key={q}
                  onPress={() => setAmount(String(q))}
                  accessibilityRole="button"
                  className={`rounded-full border px-4 py-2 ${
                    active ? 'border-brand bg-brand' : 'border-brand-mist bg-white'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active ? 'text-white' : 'text-brand'
                    }`}
                  >
                    {naira(q).replace('.00', '')}
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
            className={`mt-8 h-14 items-center justify-center rounded-2xl ${
              canSubmit ? 'bg-brand active:opacity-90' : 'bg-brand-mist/60'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-lg font-semibold text-white">
                {amountNumber >= MIN_AMOUNT
                  ? `Buy ${naira(amountNumber)} airtime`
                  : 'Buy airtime'}
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
            {/* Drag handle */}
            <View className="mb-5 h-1 w-10 self-center rounded-full bg-black/10" />

            {pending && (
              <>
                {/* Header: network logo + title */}
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

                {/* Amount */}
                <View className="mt-6 items-center rounded-2xl bg-brand-air/50 py-5">
                  <Text className="text-xs uppercase tracking-wider text-brand-night/60">
                    You&apos;re paying
                  </Text>
                  <Text className="mt-1 text-[34px] font-bold tracking-tight text-brand">
                    {naira(pending.amount)}
                  </Text>
                </View>

                {/* Summary rows */}
                <View className="mt-5 rounded-2xl border border-brand-mist bg-white px-4">
                  {[
                    { label: 'Network', value: pending.network },
                    { label: 'Phone number', value: pending.phone },
                    { label: 'Amount', value: naira(pending.amount) },
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

                {/* Info tip */}
                <View className="mt-4 flex-row items-start gap-2.5 rounded-2xl bg-brand-air/50 p-3.5">
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#281C9D"
                  />
                  <Text className="flex-1 text-xs leading-5 text-brand-night/80">
                    Make sure the phone number and network are correct. Airtime
                    purchases cannot be reversed.
                  </Text>
                </View>

                {/* Actions */}
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
                          Pay {naira(pending.amount)}
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
                    receipt.amount,
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
                  { label: 'Amount', value: naira(receipt.amount) },
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

              {/* Actions */}
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