import { useState } from 'react';
import {
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import ServiceHeader from '../../components/ServiceHeader';
import { fullDate, naira } from '../../data/transactions';

type Disco = { id: string; name: string; short: string };

// TODO: use the exact list and service codes from your provider's API
const DISCOS: Disco[] = [
  { id: 'ikeja', name: 'Ikeja Electric', short: 'IE' },
  { id: 'eko', name: 'Eko Electric (EKEDC)', short: 'EK' },
  { id: 'abuja', name: 'Abuja Electricity (AEDC)', short: 'AE' },
  { id: 'ibadan', name: 'Ibadan Electricity (IBEDC)', short: 'IB' },
  { id: 'enugu', name: 'Enugu Electricity (EEDC)', short: 'EN' },
  { id: 'portharcourt', name: 'Port Harcourt Electricity (PHED)', short: 'PH' },
  { id: 'kano', name: 'Kano Electricity (KEDCO)', short: 'KN' },
  { id: 'kaduna', name: 'Kaduna Electric (KAEDCO)', short: 'KD' },
  { id: 'jos', name: 'Jos Electricity (JED)', short: 'JS' },
  { id: 'benin', name: 'Benin Electricity (BEDC)', short: 'BN' },
  { id: 'yola', name: 'Yola Electricity (YEDC)', short: 'YL' },
];

type MeterType = 'prepaid' | 'postpaid';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];
// TODO: use the minimum and maximum your provider allows
const MIN_AMOUNT = 500;
const MAX_AMOUNT = 500000;

// ---- Change the success wording here ----
const SUCCESS_TITLE = 'Payment successful!';
const successMessage = (amount: number, disco: string, meterType: MeterType) =>
  meterType === 'prepaid'
    ? `Your ${naira(amount)} ${disco} electricity token is ready. Thank you for using Tunenj.`
    : `Your ${naira(amount)} ${disco} bill payment has been received. Thank you for using Tunenj.`;
// -----------------------------------------

type Customer = { name: string; address: string };

type Purchase = {
  disco: Disco;
  meterType: MeterType;
  meter: string;
  customer: Customer;
  amount: number;
  phone: string;
};

type Receipt = Purchase & { reference: string; date: string; token?: string; units?: string };

// Round badge with the company's initials. Swap for the official logo if you have it.
function DiscoBadge({ short, size }: { short: string; size: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-brand-air"
    >
      <Text style={{ fontSize: size * 0.34 }} className="font-bold text-brand">
        {short}
      </Text>
    </View>
  );
}

const groupToken = (token: string) => token.match(/.{1,4}/g)?.join('-') ?? token;

export default function Electricity() {
  const insets = useSafeAreaInsets();
  const [discoId, setDiscoId] = useState<string | null>(null);
  const [meterType, setMeterType] = useState<MeterType>('prepaid');
  const [meter, setMeter] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState<Purchase | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [copied, setCopied] = useState(false);

  const disco = DISCOS.find((d) => d.id === discoId) ?? null;
  const amountNumber = Number(amount) || 0;
  const meterOk = meter.length >= 10 && meter.length <= 13;
  const canVerify = disco !== null && meterOk && !verifying;
  const canSubmit =
    customer !== null && amountNumber >= MIN_AMOUNT && phone.length === 11 && !loading;

  const clearVerification = () => setCustomer(null);

  const resetForm = () => {
    setDiscoId(null);
    setMeter('');
    setCustomer(null);
    setAmount('');
    setPhone('');
    setError('');
    setCopied(false);
  };

  const verifyMeter = async () => {
    if (!canVerify || !disco) return;
    setVerifying(true);
    setError('');
    setCustomer(null);
    try {
      // TODO: replace with your real API call, for example:
      // const res = await fetch('https://your-api.com/electricity/verify', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ disco: disco.id, meterType, meter }),
      // });
      // if (!res.ok) throw new Error('We could not find that meter number.');
      // const data = await res.json(); // { name, address }
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setCustomer({ name: 'JOHN DOE', address: '12 Example Street, Ikeja, Lagos' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not verify that meter. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  const pay = () => {
    if (!disco) return setError('Choose your electricity company');
    if (!customer) return setError('Verify the meter number first');
    if (amountNumber < MIN_AMOUNT || amountNumber > MAX_AMOUNT)
      return setError(`Amount must be between ${naira(MIN_AMOUNT)} and ${naira(MAX_AMOUNT)}`);
    if (!/^0[789][01]\d{8}$/.test(phone)) return setError('Enter a valid Nigerian phone number');
    setError('');
    setPending({ disco, meterType, meter, customer, amount: amountNumber, phone });
  };

  const confirmPurchase = async () => {
    if (!pending) return;
    setLoading(true);
    try {
      // TODO: ask for the transaction PIN here, then call your API:
      // const res = await fetch('https://your-api.com/electricity/pay', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ disco: pending.disco.id, meterType: pending.meterType,
      //     meter: pending.meter, amount: pending.amount, phone: pending.phone }),
      // });
      // if (!res.ok) throw new Error('Payment failed');
      // const { reference, token, units } = await res.json();
      // Electricity can be slow. If the provider says "pending", show a pending
      // message and do not show a token until it really arrives.
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      const prepaid = pending.meterType === 'prepaid';
      setReceipt({
        ...pending,
        reference: `TNJ-${Date.now().toString().slice(-8)}`, // use the real reference from your API
        date: new Date().toISOString(),
        // FAKE token for testing. The real token must come from your provider.
        token: prepaid ? '12345678901234567890' : undefined,
        units: prepaid ? `${(pending.amount / 70).toFixed(1)} kWh` : undefined,
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

  const copyToken = async () => {
    if (!receipt?.token) return;
    await Clipboard.setStringAsync(receipt.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ServiceHeader title="Electricity" subtitle="Buy tokens or pay your bill" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
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

          {/* Electricity company */}
          <Text className="mb-2 text-sm font-semibold text-brand-night">Electricity company</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose electricity company"
            className="h-14 flex-row items-center rounded-2xl border border-brand-mist bg-white px-4"
          >
            {disco ? (
              <>
                <DiscoBadge short={disco.short} size={32} />
                <Text className="ml-3 flex-1 text-base font-semibold text-brand-night" numberOfLines={1}>
                  {disco.name}
                </Text>
              </>
            ) : (
              <Text className="flex-1 text-base text-[#9a96c8]">Select your company</Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#281C9D" />
          </Pressable>

          {/* Meter type */}
          <Text className="mb-2 mt-5 text-sm font-semibold text-brand-night">Meter type</Text>
          <View className="flex-row rounded-full bg-brand-air p-1">
            {(['prepaid', 'postpaid'] as const).map((t) => {
              const active = meterType === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    setMeterType(t);
                    clearVerification();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`h-11 flex-1 items-center justify-center rounded-full ${
                    active ? 'bg-brand' : 'bg-transparent'
                  }`}
                >
                  <Text className={`text-sm font-semibold capitalize ${active ? 'text-white' : 'text-brand'}`}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Meter number + verify */}
          <Text className="mb-2 mt-5 text-sm font-semibold text-brand-night">Meter number</Text>
          <View className="h-14 flex-row items-center rounded-2xl border border-brand-mist bg-white pl-4 pr-2">
            <TextInput
              value={meter}
              onChangeText={(t) => {
                setMeter(t.replace(/\D/g, '').slice(0, 13));
                clearVerification();
                setError('');
              }}
              placeholder="Enter meter number"
              placeholderTextColor="#9a96c8"
              keyboardType="number-pad"
              maxLength={13}
              className="flex-1 text-base text-brand-night"
            />
            <Pressable
              onPress={verifyMeter}
              disabled={!canVerify}
              accessibilityRole="button"
              accessibilityLabel="Verify meter number"
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
                <Text className="text-xs text-brand-night/60">Meter owner</Text>
                <Text className="text-base font-bold text-brand-night">{customer.name}</Text>
                <Text className="mt-0.5 text-xs text-brand-night/70">{customer.address}</Text>
              </View>
            </View>
          )}

          {/* Amount */}
          <Text className="mb-2 mt-5 text-sm font-semibold text-brand-night">Amount</Text>
          <View className="h-14 flex-row items-center rounded-2xl border border-brand-mist bg-white px-4">
            <Text className="mr-2 text-xl font-bold text-brand">₦</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => {
                setAmount(t.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              placeholder="0"
              placeholderTextColor="#9a96c8"
              keyboardType="number-pad"
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

          {/* Phone */}
          <Text className="mb-2 mt-5 text-sm font-semibold text-brand-night">Phone number</Text>
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
          <Text className="mt-1 text-xs text-brand-night/60">Your receipt and token are sent here</Text>

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
                {amountNumber >= MIN_AMOUNT ? `Pay ${naira(amountNumber)}` : 'Continue'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Company picker ───────────────────────────────────── */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable onPress={() => setPickerOpen(false)} className="flex-1 justify-end bg-black/50">
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ maxHeight: '75%', paddingBottom: insets.bottom + 12 }}
            className="rounded-t-[32px] bg-white px-6 pt-3"
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-black/10" />
            <Text className="mb-2 text-lg font-bold text-brand-night">Choose your company</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {DISCOS.map((d) => {
                const active = d.id === discoId;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => {
                      setDiscoId(d.id);
                      clearVerification();
                      setError('');
                      setPickerOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className="flex-row items-center border-b border-brand-air py-3.5 active:bg-brand-air/60"
                  >
                    <DiscoBadge short={d.short} size={40} />
                    <Text className="ml-3 flex-1 text-base font-semibold text-brand-night">{d.name}</Text>
                    {active && <Ionicons name="checkmark-circle" size={22} color="#281C9D" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Confirm Purchase Sheet ───────────────────────────── */}
      <Modal
        visible={pending !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={cancelPending}
      >
        <Pressable onPress={cancelPending} className="flex-1 justify-end bg-black/50">
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ maxHeight: '90%', paddingBottom: insets.bottom + 20 }}
            className="rounded-t-[32px] bg-white px-6 pt-3"
          >
            <View className="mb-5 h-1 w-10 self-center rounded-full bg-black/10" />

            {pending && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row items-center gap-3">
                  <DiscoBadge short={pending.disco.short} size={48} />
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-brand-night">Confirm payment</Text>
                    <Text className="text-xs text-brand-night/60">Review before you pay</Text>
                  </View>
                </View>

                <View className="mt-6 items-center rounded-2xl bg-brand-air/50 py-5">
                  <Text className="text-xs uppercase tracking-wider text-brand-night/60">
                    You're paying
                  </Text>
                  <Text className="mt-1 text-[34px] font-bold tracking-tight text-brand">
                    {naira(pending.amount)}
                  </Text>
                </View>

                <View className="mt-5 rounded-2xl border border-brand-mist bg-white px-4">
                  {[
                    { label: 'Company', value: pending.disco.name },
                    { label: 'Meter type', value: pending.meterType === 'prepaid' ? 'Prepaid' : 'Postpaid' },
                    { label: 'Meter number', value: pending.meter },
                    { label: 'Meter owner', value: pending.customer.name },
                    { label: 'Phone number', value: pending.phone },
                  ].map((row, i, arr) => (
                    <View
                      key={row.label}
                      className={`flex-row items-center justify-between py-3.5 ${
                        i < arr.length - 1 ? 'border-b border-brand-air' : ''
                      }`}
                    >
                      <Text className="text-xs text-brand-night/60">{row.label}</Text>
                      <Text className="ml-4 flex-1 text-right text-sm font-semibold text-brand-night">
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mt-4 flex-row items-start gap-2.5 rounded-2xl bg-brand-air/50 p-3.5">
                  <Ionicons name="information-circle-outline" size={18} color="#281C9D" />
                  <Text className="flex-1 text-xs leading-5 text-brand-night/80">
                    Check that the meter owner's name is correct. Electricity payments cannot be
                    reversed.
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
                    <Text className="text-base font-semibold text-brand-night">Cancel</Text>
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
                        <Ionicons name="lock-closed-outline" size={16} color="#FFFFFF" />
                        <Text className="text-base font-semibold text-white">
                          Pay {naira(pending.amount).replace('.00', '')}
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
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}
              >
                <View className="items-center">
                  <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-air">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-brand">
                      <Ionicons name="checkmark" size={36} color="#FFFFFF" />
                    </View>
                  </View>

                  <Text className="mt-5 text-2xl font-bold text-brand">{SUCCESS_TITLE}</Text>
                  <Text className="mt-2 text-center text-sm leading-5 text-brand-night/70">
                    {successMessage(receipt.amount, receipt.disco.name, receipt.meterType)}
                  </Text>
                </View>

                {/* Token (prepaid only) */}
                {receipt.token && (
                  <View className="mt-6 items-center rounded-2xl bg-brand px-4 py-5">
                    <Text className="text-xs uppercase tracking-wider text-white/70">Your token</Text>
                    <Text
                      selectable
                      className="mt-2 text-center text-[22px] font-bold tracking-widest text-white"
                    >
                      {groupToken(receipt.token)}
                    </Text>
                    {receipt.units ? (
                      <Text className="mt-1 text-xs text-white/70">{receipt.units}</Text>
                    ) : null}
                    <Pressable
                      onPress={copyToken}
                      accessibilityRole="button"
                      accessibilityLabel="Copy token"
                      className="mt-4 flex-row items-center gap-2 rounded-full bg-white px-5 py-2.5 active:opacity-90"
                    >
                      <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#281C9D" />
                      <Text className="text-sm font-semibold text-brand">
                        {copied ? 'Copied' : 'Copy token'}
                      </Text>
                    </Pressable>
                  </View>
                )}

                <View className="mt-6 rounded-2xl bg-brand-air px-4">
                  {[
                    { label: 'Amount', value: naira(receipt.amount) },
                    { label: 'Company', value: receipt.disco.name },
                    { label: 'Meter number', value: receipt.meter },
                    { label: 'Meter owner', value: receipt.customer.name },
                    { label: 'Reference', value: receipt.reference },
                    { label: 'Date', value: fullDate(receipt.date) },
                  ].map((row, i, arr) => (
                    <View
                      key={row.label}
                      className={`flex-row items-center justify-between py-3 ${
                        i < arr.length - 1 ? 'border-b border-white' : ''
                      }`}
                    >
                      <Text className="text-xs text-brand-night/60">{row.label}</Text>
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
                  <Text className="text-base font-semibold text-brand">Pay again</Text>
                </Pressable>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}