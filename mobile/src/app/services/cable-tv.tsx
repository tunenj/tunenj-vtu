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
import dstvLogo from '../../../assets/images/cable/dstv.png';
import gotvLogo from '../../../assets/images/cable/gotv.png';
import startimesLogo from '../../../assets/images/cable/startimes.png';

type Provider = {
  id: string;
  name: string;
  logo: ImageSourcePropType;
  idLabel: string;
  idLength: number;
};

// TODO: use the exact providers and card-number lengths your provider supports
const PROVIDERS: Provider[] = [
  { id: 'dstv', name: 'DStv', logo: dstvLogo, idLabel: 'Smartcard number', idLength: 10 },
  { id: 'gotv', name: 'GOtv', logo: gotvLogo, idLabel: 'IUC number', idLength: 10 },
  { id: 'startimes', name: 'StarTimes', logo: startimesLogo, idLabel: 'Smartcard number', idLength: 11 },
];

type Bouquet = { id: string; name: string; price: number };

// TODO: these bouquets and prices are examples only. Load the real list for the
// chosen provider from your API, because bouquets and prices change often.
const BOUQUETS: Record<string, Bouquet[]> = {
  dstv: [
    { id: 'dstv-padi', name: 'DStv Padi', price: 2950 },
    { id: 'dstv-yanga', name: 'DStv Yanga', price: 4200 },
    { id: 'dstv-confam', name: 'DStv Confam', price: 7400 },
    { id: 'dstv-compact', name: 'DStv Compact', price: 12500 },
    { id: 'dstv-compact-plus', name: 'DStv Compact Plus', price: 19800 },
    { id: 'dstv-premium', name: 'DStv Premium', price: 37000 },
  ],
  gotv: [
    { id: 'gotv-smallie', name: 'GOtv Smallie', price: 1900 },
    { id: 'gotv-jinja', name: 'GOtv Jinja', price: 3900 },
    { id: 'gotv-jolli', name: 'GOtv Jolli', price: 5800 },
    { id: 'gotv-max', name: 'GOtv Max', price: 8500 },
    { id: 'gotv-supa', name: 'GOtv Supa', price: 11400 },
  ],
  startimes: [
    { id: 'st-nova', name: 'Nova', price: 1900 },
    { id: 'st-basic', name: 'Basic', price: 3700 },
    { id: 'st-smart', name: 'Smart', price: 4700 },
    { id: 'st-classic', name: 'Classic', price: 6200 },
    { id: 'st-super', name: 'Super', price: 9800 },
  ],
};

// ---- Change the success wording here ----
const SUCCESS_TITLE = 'Subscription successful!';
const successMessage = (bouquet: string, provider: string) =>
  `Your ${provider} ${bouquet} subscription has been paid. It may take a few minutes to activate. Thank you for using Tunenj.`;
// -----------------------------------------

type Customer = { name: string; currentPlan: string };

type Purchase = {
  provider: Provider;
  cardNumber: string;
  customer: Customer;
  bouquet: Bouquet;
  phone: string;
};

type Receipt = Purchase & { reference: string; date: string };

// Round white badge that holds a provider logo
function ProviderLogo({
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
        alt="cable tv logo"
        accessibilityLabel={`${label} logo`}
        style={{ width: size * 0.78, height: size * 0.78 }}
        resizeMode="contain"
      />
    </View>
  );
}

export default function CableTv() {
  const insets = useSafeAreaInsets();
  const [providerId, setProviderId] = useState('dstv');
  const [cardNumber, setCardNumber] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [bouquetId, setBouquetId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Purchase | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0];
  const bouquets = BOUQUETS[provider.id] ?? [];
  const bouquet = bouquets.find((b) => b.id === bouquetId) ?? null;

  const cardOk = cardNumber.length === provider.idLength;
  const canVerify = cardOk && !verifying;
  const canSubmit =
    customer !== null && bouquet !== null && phone.length === 11 && !loading;

  const clearVerification = () => setCustomer(null);

  const resetForm = () => {
    setCardNumber('');
    setCustomer(null);
    setBouquetId(null);
    setPhone('');
    setError('');
  };

  const verifyCard = async () => {
    if (!canVerify) return;
    setVerifying(true);
    setError('');
    setCustomer(null);
    try {
      // TODO: replace with your real API call, for example:
      // const res = await fetch('https://your-api.com/cable/verify', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ provider: provider.id, cardNumber }),
      // });
      // if (!res.ok) throw new Error('We could not find that card number.');
      // const data = await res.json(); // { name, currentPlan }
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setCustomer({ name: 'JOHN DOE', currentPlan: `${provider.name} Compact` });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'We could not verify that card. Try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  const pay = () => {
    if (!customer)
      return setError(`Verify the ${provider.idLabel.toLowerCase()} first`);
    if (!bouquet) return setError('Choose a bouquet');
    if (!/^0[789][01]\d{8}$/.test(phone))
      return setError('Enter a valid Nigerian phone number');
    setError('');
    setPending({ provider, cardNumber, customer, bouquet, phone });
  };

  const confirmPurchase = async () => {
    if (!pending) return;
    setLoading(true);
    try {
      // TODO: ask for the transaction PIN here, then call your API:
      // const res = await fetch('https://your-api.com/cable/pay', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ provider: pending.provider.id, cardNumber: pending.cardNumber,
      //     bouquetId: pending.bouquet.id, phone: pending.phone }),
      // });
      // if (!res.ok) throw new Error('Payment failed');
      // const { reference } = await res.json();
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setReceipt({
        ...pending,
        reference: `TNJ-${Date.now().toString().slice(-8)}`, // use the real reference from your API
        date: new Date().toISOString(),
      });
      setPending(null);
    } catch {
      setError('Payment failed. Try again.');
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

  const payAgain = () => {
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
      <ServiceHeader title="Cable TV" subtitle="Renew or change your bouquet" />

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

          {/* Provider */}
          <Text className="mb-3 text-sm font-semibold text-brand-night">
            Provider
          </Text>
          <View className="flex-row gap-3">
            {PROVIDERS.map((p) => {
              const active = providerId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setProviderId(p.id);
                    setCardNumber('');
                    setBouquetId(null); // bouquets differ per provider
                    clearVerification();
                    setError('');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={p.name}
                  accessibilityState={{ selected: active }}
                  className={`flex-1 items-center rounded-2xl border-2 py-3 ${
                    active
                      ? 'border-brand bg-brand-air'
                      : 'border-transparent bg-brand-air/60'
                  }`}
                >
                  <ProviderLogo source={p.logo} label={p.name} size={44} />
                  <Text className="mt-1.5 text-xs font-semibold text-brand-night">
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Card number + verify */}
          <Text className="mb-2 mt-6 text-sm font-semibold text-brand-night">
            {provider.idLabel}
          </Text>
          <View className="h-14 flex-row items-center rounded-2xl border border-brand-mist bg-white pl-4 pr-2">
            <TextInput
              value={cardNumber}
              onChangeText={(t) => {
                setCardNumber(t.replace(/\D/g, '').slice(0, provider.idLength));
                clearVerification();
                setError('');
              }}
              placeholder={`Enter ${provider.idLength}-digit number`}
              placeholderTextColor="#9a96c8"
              keyboardType="number-pad"
              maxLength={provider.idLength}
              className="flex-1 text-base text-brand-night"
            />
            <Pressable
              onPress={verifyCard}
              disabled={!canVerify}
              accessibilityRole="button"
              accessibilityLabel={`Verify ${provider.idLabel}`}
              className={`h-10 min-w-[78px] items-center justify-center rounded-xl px-4 ${
                canVerify ? 'bg-brand' : 'bg-brand-mist/60'
              }`}
            >
              {verifying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-semibold text-white">Verify</Text>
              )}
            </Pressable>
          </View>

          {/* Verified customer */}
          {customer && (
            <View className="mt-3 flex-row items-start gap-3 rounded-2xl bg-brand-air p-4">
              <Ionicons name="checkmark-circle" size={22} color="#281C9D" />
              <View className="flex-1">
                <Text className="text-xs text-brand-night/60">Account holder</Text>
                <Text className="text-base font-bold text-brand-night">
                  {customer.name}
                </Text>
                <Text className="mt-0.5 text-xs text-brand-night/70">
                  Current bouquet: {customer.currentPlan}
                </Text>
              </View>
            </View>
          )}

          {/* Bouquets */}
          <Text className="mb-3 mt-6 text-sm font-semibold text-brand-night">
            Choose a bouquet
          </Text>
          {bouquets.map((b) => {
            const active = bouquetId === b.id;
            return (
              <Pressable
                key={b.id}
                onPress={() => {
                  setBouquetId(b.id);
                  setError('');
                }}
                accessibilityRole="button"
                accessibilityLabel={`${b.name}, ${naira(b.price)}`}
                accessibilityState={{ selected: active }}
                className={`mb-3 flex-row items-center rounded-2xl border-2 p-4 ${
                  active ? 'border-brand bg-brand-air' : 'border-brand-mist bg-white'
                }`}
              >
                <View className="flex-1">
                  <Text className="text-base font-bold text-brand-night">
                    {b.name}
                  </Text>
                  <Text className="text-xs text-brand-night/60">1 month</Text>
                </View>
                <Text className="mr-3 text-base font-bold text-brand">
                  {naira(b.price).replace('.00', '')}
                </Text>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={active ? '#281C9D' : '#9a96c8'}
                />
              </Pressable>
            );
          })}

          {/* Phone */}
          <Text className="mb-2 mt-3 text-sm font-semibold text-brand-night">
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
          <Text className="mt-1 text-xs text-brand-night/60">
            Your receipt is sent here
          </Text>

          {/* Button */}
          <Pressable
            onPress={pay}
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
                {bouquet
                  ? `Pay ${naira(bouquet.price).replace('.00', '')}`
                  : 'Continue'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Confirm Payment Sheet ────────────────────────────── */}
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
            style={{ maxHeight: '90%', paddingBottom: insets.bottom + 20 }}
            className="rounded-t-[32px] bg-white px-6 pt-3"
          >
            <View className="mb-5 h-1 w-10 self-center rounded-full bg-black/10" />

            {pending && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row items-center gap-3">
                  <ProviderLogo
                    source={pending.provider.logo}
                    label={pending.provider.name}
                    size={48}
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-brand-night">
                      Confirm payment
                    </Text>
                    <Text className="text-xs text-brand-night/60">
                      Review before you pay
                    </Text>
                  </View>
                </View>

                <View className="mt-6 items-center rounded-2xl bg-brand-air/50 py-5">
                  <Text className="text-xs uppercase tracking-wider text-brand-night/60">
                    You're paying
                  </Text>
                  <Text className="mt-1 text-[34px] font-bold tracking-tight text-brand">
                    {naira(pending.bouquet.price)}
                  </Text>
                </View>

                <View className="mt-5 rounded-2xl border border-brand-mist bg-white px-4">
                  {[
                    { label: 'Provider', value: pending.provider.name },
                    { label: 'Bouquet', value: pending.bouquet.name },
                    {
                      label: pending.provider.idLabel,
                      value: pending.cardNumber,
                    },
                    { label: 'Account holder', value: pending.customer.name },
                    { label: 'Phone number', value: pending.phone },
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
                    Check that the account holder's name is correct. Subscription
                    payments cannot be reversed.
                  </Text>
                </View>

                <View className="mt-6 flex-row gap-3">
                  <Pressable
                    onPress={cancelPending}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel payment"
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
                    accessibilityLabel="Confirm payment"
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
                          Pay {naira(pending.bouquet.price).replace('.00', '')}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
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
            <View style={{ maxHeight: '92%' }} className="w-full rounded-3xl bg-white">
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  paddingTop: 40,
                  paddingBottom: 24,
                }}
              >
                {/* ─── Provider logo at the top with success badge ─── */}
                <View className="items-center">
                  <View className="relative">
                    {/* Provider logo — large, on a branded ring */}
                    <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-air p-0.5">
                      <View className="h-full w-full items-center justify-center rounded-full bg-white">
                        <Image
                          source={receipt.provider.logo}
                          alt={`${receipt.provider.name} logo`}
                          accessibilityLabel={`${receipt.provider.name} logo`}
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

                  <Text className="mt-5 text-center text-2xl font-bold text-brand">
                    {SUCCESS_TITLE}
                  </Text>
                  <Text className="mt-2 text-center text-sm leading-5 text-brand-night/70">
                    {successMessage(
                      receipt.bouquet.name,
                      receipt.provider.name
                    )}
                  </Text>
                </View>

                <View className="mt-6 rounded-2xl bg-brand-air px-4">
                  <View className="flex-row items-center justify-between border-b border-white py-3">
                    <Text className="text-xs text-brand-night/60">Provider</Text>
                    <View className="ml-4 flex-1 flex-row items-center justify-end gap-2">
                      <ProviderLogo
                        source={receipt.provider.logo}
                        label={receipt.provider.name}
                        size={24}
                      />
                      <Text className="text-sm font-semibold text-brand-night">
                        {receipt.provider.name}
                      </Text>
                    </View>
                  </View>
                  {[
                    { label: 'Amount', value: naira(receipt.bouquet.price) },
                    { label: 'Bouquet', value: receipt.bouquet.name },
                    {
                      label: receipt.provider.idLabel,
                      value: receipt.cardNumber,
                    },
                    { label: 'Account holder', value: receipt.customer.name },
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
                  onPress={payAgain}
                  accessibilityRole="button"
                  className="mt-3 h-12 items-center justify-center rounded-2xl border border-brand-mist active:opacity-90"
                >
                  <Text className="text-base font-semibold text-brand">
                    Pay again
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}