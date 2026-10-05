import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import SuccessFlash from '../../components/SuccessFlash';

type Step = 'current' | 'new' | 'confirm';

const PIN_LENGTH = 4;

const COPY: Record<Step, { title: string; text: string }> = {
  current: {
    title: 'Enter current PIN',
    text: 'Enter your current 4-digit transaction PIN.',
  },
  new: {
    title: 'Create new PIN',
    text: 'Choose a 4-digit PIN to approve your payments. Avoid obvious numbers like 1234.',
  },
  confirm: {
    title: 'Confirm new PIN',
    text: 'Enter the new PIN again to confirm it.',
  },
};

// Rejects PINs that are very easy to guess
const isWeak = (pin: string) =>
  /^(\d)\1+$/.test(pin) || ['1234', '4321', '0123', '3210'].includes(pin);

export default function TransactionPin() {
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const creating = mode === 'create';
  const steps: Step[] = creating ? ['new', 'confirm'] : ['current', 'new', 'confirm'];

  const inputRef = useRef<TextInput>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<Step, string>>({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const step = steps[stepIndex];
  const value = values[step];
  const isLast = stepIndex === steps.length - 1;
  const canContinue = value.length === PIN_LENGTH && !loading;

  // Focus the hidden input whenever the step changes
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [stepIndex]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.back(), 1500);
    return () => clearTimeout(t);
  }, [done]);

  const setValue = (text: string) => {
    setError('');
    setValues((v) => ({ ...v, [step]: text.replace(/\D/g, '').slice(0, PIN_LENGTH) }));
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setValues((v) => ({ ...v, [step]: '' }));
      setError('');
      setStepIndex(stepIndex - 1);
    } else {
      router.back();
    }
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: replace with your real API call, for example:
      // const res = await fetch('https://your-api.com/profile/pin', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ currentPin: values.current, newPin: values.new }),
      // });
      // if (res.status === 401) { wrong current PIN: go back to the first step }
      // if (!res.ok) throw new Error('Could not save your PIN.');
      // Never save the PIN on the phone. Your server must store it hashed.
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (!canContinue) return;

    if (step === 'new') {
      if (isWeak(values.new)) {
        setError('That PIN is too easy to guess. Choose a different one.');
        return;
      }
      if (!creating && values.new === values.current) {
        setError('Your new PIN must be different from your current PIN.');
        return;
      }
    }

    if (step === 'confirm' && values.confirm !== values.new) {
      setError('The PINs do not match. Try again.');
      setValues((v) => ({ ...v, confirm: '' }));
      return;
    }

    if (isLast) submit();
    else setStepIndex(stepIndex + 1);
  };

  const copy = COPY[step];

  return (
    <View className="flex-1 bg-brand">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-6">
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
          <Text className="text-xl font-semibold text-white">
            {creating ? 'Create PIN' : 'Change PIN'}
          </Text>
        </View>
      </View>

      {/* White sheet */}
      <ScrollView
        className="flex-1 rounded-t-[32px] bg-white"
        contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bars */}
        <View className="mb-8 flex-row gap-2">
          {steps.map((s, i) => (
            <View
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-brand' : 'bg-brand-air'}`}
            />
          ))}
        </View>

        <Text className="text-[28px] font-bold text-brand">{copy.title}</Text>
        <Text className="mb-8 mt-1 text-sm leading-5 text-brand-night/70">{copy.text}</Text>

        {error ? (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* PIN dots */}
        <Pressable
          onPress={() => inputRef.current?.focus()}
          accessibilityRole="button"
          accessibilityLabel={`Enter ${PIN_LENGTH}-digit PIN`}
          className="flex-row justify-center gap-4"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < value.length;
            const active = i === Math.min(value.length, PIN_LENGTH - 1);
            return (
              <View
                key={i}
                className={`h-16 w-16 items-center justify-center rounded-2xl border bg-white ${
                  error ? 'border-red-500' : active || filled ? 'border-brand' : 'border-brand-mist'
                }`}
              >
                {filled ? <View className="h-3.5 w-3.5 rounded-full bg-brand-night" /> : null}
              </View>
            );
          })}
        </Pressable>

        {/* Real input, hidden behind the dots */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          maxLength={PIN_LENGTH}
          secureTextEntry
          caretHidden
          autoComplete="off"
          importantForAutofill="no"
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        />

        {step === 'current' && (
          <Pressable
            // TODO: build a proper "reset PIN" flow that checks your password or an SMS code first
            onPress={() => router.push('/profile/help')}
            hitSlop={8}
            accessibilityRole="button"
            className="mt-6 items-center"
          >
            <Text className="text-sm font-semibold text-brand">Forgot your PIN?</Text>
          </Pressable>
        )}

        <Pressable
          onPress={next}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          className={`mt-8 h-14 items-center justify-center rounded-2xl ${
            canContinue ? 'bg-brand active:opacity-90' : 'bg-brand-mist/60'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-lg font-semibold text-white">
              {isLast ? (creating ? 'Create PIN' : 'Change PIN') : 'Continue'}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <SuccessFlash visible={done} message={creating ? 'PIN created' : 'PIN changed'} />
    </View>
  );
}