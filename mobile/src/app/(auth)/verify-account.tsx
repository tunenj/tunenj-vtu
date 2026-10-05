import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { router, useLocalSearchParams } from 'expo-router';


const CODE_LENGTH = 4;
const RESEND_SECONDS = 60;

// Shows "080****678" instead of the full number
const maskPhone = (value: string) =>
  value.length >= 7 ? `${value.slice(0, 3)}****${value.slice(-3)}` : value;

export default function VerifyAccount() {
  const insets = useSafeAreaInsets();
  const { phone = '', email = '' } = useLocalSearchParams<{ phone?: string; email?: string }>();
  const codeRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  // Countdown for "Resend code"
  useEffect(() => {
    if (verified || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, verified]);

  const canVerify = code.length === CODE_LENGTH && !loading;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/register'));

  const handleVerify = async () => {
    if (!canVerify) return;
    setLoading(true);
    setError('');
    try {
      // TODO: replace with your real API call, for example:
      // const res = await fetch('https://your-api.com/auth/verify-account', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone, code }),
      // });
      // if (!res.ok) throw new Error('That code is wrong or has expired.');
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code is wrong or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      // TODO: replace with your real API call to send a new code, for example:
      // await fetch('https://your-api.com/auth/resend-code', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone }),
      // });
      await new Promise((r) => setTimeout(r, 800)); // fake delay for now
      setCode('');
      setSeconds(RESEND_SECONDS);
      codeRef.current?.focus();
    } catch {
      setError('We could not send a new code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-brand">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-6">
        <View className="h-11 flex-row items-center">
          {!verified ? (
            <Pressable
              onPress={goBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="mr-3 h-9 w-9 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View className="mr-3 h-9 w-9" />
          )}
          <Text className="text-xl font-semibold text-white">
            {verified ? 'Account verified' : 'Verify your account'}
          </Text>
        </View>
      </View>

      {/* White sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 rounded-t-[32px] bg-white"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {verified ? (
            /* Success state */
            <View className="items-center pt-2">
              <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-air">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-brand">
                  <Ionicons name="checkmark" size={36} color="#FFFFFF" />
                </View>
              </View>
              <Text className="mt-6 text-[28px] font-bold text-brand">You're all set!</Text>
              <Text className="mb-8 mt-2 text-center text-sm leading-5 text-brand-night/70">
                Your Tunenj account is verified. Log in to start buying airtime, data and paying bills.
              </Text>

              <Pressable
                // TODO: later, send new users to a "Create transaction PIN" screen instead
                onPress={() => router.replace('/login')}
                accessibilityRole="button"
                className="h-14 w-full items-center justify-center rounded-2xl bg-brand active:opacity-90"
              >
                <Text className="text-lg font-semibold text-white">Continue to login</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text className="text-[28px] font-bold text-brand">Confirm your number</Text>
              <Text className="mb-6 mt-1 text-sm leading-5 text-brand-night/70">
                {phone
                  ? `We sent a ${CODE_LENGTH}-digit code to ${maskPhone(phone)}. Enter it below to verify your account.`
                  : `Enter the ${CODE_LENGTH}-digit code we sent you to verify your account.`}
              </Text>

              {error ? (
                <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
                  <Text className="text-sm text-red-600">{error}</Text>
                </View>
              ) : null}

              {/* 4-digit code boxes */}
              <Pressable
                onPress={() => codeRef.current?.focus()}
                accessibilityRole="button"
                accessibilityLabel="Enter the verification code"
                className="flex-row justify-between"
              >
                {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                  const char = code[i];
                  const active = i === Math.min(code.length, CODE_LENGTH - 1);
                  return (
                    <View
                      key={i}
                      className={`h-14 w-12 items-center justify-center rounded-2xl border bg-white ${
                        error ? 'border-red-500' : active || char ? 'border-brand' : 'border-brand-mist'
                      }`}
                    >
                      <Text className="text-2xl font-bold text-brand-night">{char ?? ''}</Text>
                    </View>
                  );
                })}
              </Pressable>

              {/* Real input, hidden behind the boxes */}
              <TextInput
                ref={codeRef}
                value={code}
                onChangeText={(t) => {
                  setCode(t.replace(/\D/g, '').slice(0, CODE_LENGTH));
                  setError('');
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={CODE_LENGTH}
                autoFocus
                caretHidden
                style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
              />

              <View className="mt-5 flex-row items-center justify-center">
                <Text className="text-sm text-brand-night/70">Did not get the code? </Text>
                {seconds > 0 ? (
                  <Text className="text-sm font-semibold text-brand-night/50">Resend in {seconds}s</Text>
                ) : (
                  <Pressable onPress={handleResend} hitSlop={8} accessibilityRole="button">
                    <Text className="text-sm font-bold text-brand">Resend code</Text>
                  </Pressable>
                )}
              </View>

              {/* Verify button: pale until all 4 digits are typed */}
              <Pressable
                onPress={handleVerify}
                disabled={!canVerify}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canVerify }}
                className={`mt-8 h-14 items-center justify-center rounded-2xl ${
                  canVerify ? 'bg-brand active:opacity-90' : 'bg-brand-mist/60'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-lg font-semibold text-white">Verify</Text>
                )}
              </Pressable>

              {/* Wrong number */}
              <View className="mt-6 flex-row items-center justify-center">
                <Text className="text-xs text-brand-night/70">Wrong number? </Text>
                <Pressable onPress={goBack} hitSlop={8}>
                  <Text className="text-xs font-bold text-brand">Go back</Text>
                </Pressable>
              </View>

              {email ? (
                <Text className="mt-4 text-center text-xs text-brand-night/50">
                  Your receipts will go to {email}
                </Text>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}