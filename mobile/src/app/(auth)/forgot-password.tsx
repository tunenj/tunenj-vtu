import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { router } from 'expo-router';
import logo from '../../../assets/images/login-logo.png';

type Step = 'request' | 'verify' | 'reset' | 'done';

const CODE_LENGTH = 4;
const RESEND_SECONDS = 60;

const COPY: Record<Step, { header: string; title: string; text: string }> = {
  request: {
    header: 'Forgot password',
    title: 'Reset your password',
    text: "Enter the email on your account and we'll send you a 4-digit code.",
  },
  verify: {
    header: 'Verify code',
    title: 'Enter the code',
    text: '',
  },
  reset: {
    header: 'New password',
    title: 'Create a new password',
    text: 'Choose a strong password you have not used before.',
  },
  done: {
    header: 'Password reset',
    title: 'All done!',
    text: 'Your password has been changed. You can now log in with your new password.',
  },
};

// Shows "j***@email.com" instead of the full email
const maskTarget = (value: string) => {
  const [name, domain] = value.split('@');
  if (!domain) return value;
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(name.length - 1, 2))}@${domain}`;
};

/** Password rules — evaluated live as the user types */
type Rule = { id: string; label: string; test: (v: string) => boolean };

const PASSWORD_RULES: Rule[] = [
  { id: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'One lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'One number (0–9)', test: (v) => /\d/.test(v) },
  {
    id: 'symbol',
    label: 'One symbol (!@#$%…)',
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const codeRef = useRef<TextInput>(null);

  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);

  // Countdown for "Resend code"
  useEffect(() => {
    if (step !== 'verify' || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, seconds]);

  const stepNumber =
    step === 'request' ? 1 : step === 'verify' ? 2 : step === 'reset' ? 3 : 3;

  // Password rule evaluation
  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );
  const passedCount = ruleResults.filter((r) => r.passed).length;
  const allRulesPassed = passedCount === PASSWORD_RULES.length;
  const passwordsMatch = password.length > 0 && password === confirm;

  // Simple strength meter (0–4)
  const strength = useMemo(() => {
    if (password.length === 0) return 0;
    if (passedCount <= 2) return 1; // weak
    if (passedCount === 3) return 2; // fair
    if (passedCount === 4) return 3; // good
    return 4; // strong
  }, [passedCount, password.length]);

  const strengthMeta = [
    { label: '', color: 'bg-brand-air' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' },
  ][strength];

  const canContinue =
    !loading &&
    ((step === 'request' && identifier.trim().length > 0) ||
      (step === 'verify' && code.length === CODE_LENGTH) ||
      (step === 'reset' && allRulesPassed && passwordsMatch));

  const goBack = () => {
    setError('');
    if (step === 'verify') setStep('request');
    else if (step === 'reset') {
      setCode('');
      setStep('verify');
    } else if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  // ─── Local step handlers (no API) ────────────────────────────────────────
  const sendCode = async () => {
    const value = identifier.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    // TODO: wire up your API call here
    setCode('');
    setSeconds(RESEND_SECONDS);
    setStep('verify');
    setLoading(false);
  };

  const verifyCode = async () => {
    if (code.length !== CODE_LENGTH) return;
    setLoading(true);
    setError('');
    // TODO: wire up your API call here
    setStep('reset');
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!allRulesPassed) {
      setError('Your password does not meet all the requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    // TODO: wire up your API call here
    setStep('done');
    setLoading(false);
  };

  const resend = async () => {
    if (seconds > 0 || loading) return;
    setLoading(true);
    setError('');
    // TODO: wire up your API call here
    setCode('');
    setSeconds(RESEND_SECONDS);
    setLoading(false);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    if (step === 'request') sendCode();
    else if (step === 'verify') verifyCode();
    else if (step === 'reset') resetPassword();
  };

  const inputBase = 'h-14 flex-row items-center rounded-2xl border bg-white px-4';
  const copy = COPY[step];

  const eye = (visible: boolean, toggle: () => void) => (
    <Pressable
      onPress={toggle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
    >
      <Ionicons
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={22}
        color="#281C9D"
      />
    </Pressable>
  );

  return (
    <View className="flex-1 bg-brand">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-6">
        <View className="h-11 flex-row items-center">
          {step !== 'done' ? (
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
          <Text className="text-xl font-semibold text-white">{copy.header}</Text>
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
          {/* Logo — hidden on success step */}
          {step !== 'done' && (
            <View className="mb-5 items-center">
              <Image
                source={logo}
                alt="Tunenj logo"
                accessibilityLabel="Tunenj logo"
                style={{ width: 72, height: 72 }}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Progress bars */}
          {step !== 'done' && (
            <View className="mb-6 flex-row gap-2">
              {[1, 2, 3].map((n) => (
                <View
                  key={n}
                  className={`h-1.5 flex-1 rounded-full ${
                    n <= stepNumber ? 'bg-brand' : 'bg-brand-air'
                  }`}
                />
              ))}
            </View>
          )}

          {/* Success state — icon only, no logo */}
          {step === 'done' ? (
            <View className="items-center pt-6">
              <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-air">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-brand">
                  <Ionicons name="checkmark" size={44} color="#FFFFFF" />
                </View>
              </View>

              <Text className="mt-8 text-[28px] font-bold text-brand">
                {copy.title}
              </Text>
              <Text className="mt-3 max-w-[280px] text-center text-sm leading-6 text-brand-night/70">
                {copy.text}
              </Text>

              <Pressable
                onPress={() => router.replace('/login')}
                accessibilityRole="button"
                className="mt-10 h-14 w-full items-center justify-center rounded-2xl bg-brand active:opacity-90"
              >
                <Text className="text-lg font-semibold text-white">
                  Back to login
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text className="text-[28px] font-bold text-brand">{copy.title}</Text>
              <Text className="mb-6 mt-1 text-sm leading-5 text-brand-night/70">
                {step === 'verify'
                  ? `We sent a ${CODE_LENGTH}-digit code to ${maskTarget(identifier.trim())}.`
                  : copy.text}
              </Text>

              {error ? (
                <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
                  <Text className="text-sm text-red-600">{error}</Text>
                </View>
              ) : null}

              {/* Step 1: email */}
              {step === 'request' && (
                <View
                  className={`${inputBase} ${
                    error ? 'border-red-500' : 'border-brand-mist'
                  }`}
                >
                  <TextInput
                    value={identifier}
                    onChangeText={(t) => {
                      setIdentifier(t);
                      setError('');
                    }}
                    placeholder="Email address"
                    placeholderTextColor="#9a96c8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="send"
                    onSubmitEditing={handleContinue}
                    className="flex-1 text-base text-brand-night"
                  />
                </View>
              )}

              {/* Step 2: 4-digit code */}
              {step === 'verify' && (
                <View className="items-center">
                  <Pressable
                    onPress={() => codeRef.current?.focus()}
                    accessibilityRole="button"
                    accessibilityLabel="Enter the verification code"
                    className="flex-row justify-center gap-3"
                  >
                    {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                      const char = code[i];
                      const isFilled = !!char;
                      const isActive = i === code.length;
                      const isError = !!error;

                      return (
                        <View
                          key={i}
                          className={`h-16 w-14 items-center justify-center rounded-2xl border-2 ${
                            isError
                              ? 'border-red-500 bg-red-50'
                              : isFilled
                              ? 'border-brand bg-brand-air/60'
                              : isActive
                              ? 'border-brand bg-white'
                              : 'border-brand-mist bg-white'
                          }`}
                        >
                          {isActive && !char ? (
                            <View className="h-7 w-0.5 rounded-full bg-brand" />
                          ) : (
                            <Text className="text-2xl font-bold text-brand-night">
                              {char ?? ''}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </Pressable>

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

                  <View className="mt-6 flex-row items-center justify-center">
                    <Text className="text-sm text-brand-night/70">
                      Did not get the code?{' '}
                    </Text>
                    {seconds > 0 ? (
                      <Text className="text-sm font-semibold text-brand-night/50">
                        Resend in {seconds}s
                      </Text>
                    ) : (
                      <Pressable
                        onPress={resend}
                        hitSlop={8}
                        accessibilityRole="button"
                      >
                        <Text className="text-sm font-bold text-brand">
                          Resend code
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {/* Step 3: new password */}
              {step === 'reset' && (
                <View>
                  {/* New password */}
                  <Text className="mb-2 text-sm font-semibold text-brand-night">
                    New password
                  </Text>
                  <View className={`${inputBase} border-brand-mist`}>
                    <TextInput
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setError('');
                      }}
                      placeholder="At least 8 characters"
                      placeholderTextColor="#9a96c8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="newPassword"
                      className="flex-1 text-base text-brand-night"
                    />
                    {eye(showPassword, () => setShowPassword((v) => !v))}
                  </View>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <View className="mt-3">
                      <View className="flex-row gap-1.5">
                        {[1, 2, 3, 4].map((n) => (
                          <View
                            key={n}
                            className={`h-1 flex-1 rounded-full ${
                              n <= strength ? strengthMeta.color : 'bg-brand-air'
                            }`}
                          />
                        ))}
                      </View>
                      <Text
                        className={`mt-1.5 text-xs font-semibold ${
                          strength === 1
                            ? 'text-red-600'
                            : strength === 2
                            ? 'text-amber-600'
                            : strength === 3
                            ? 'text-blue-600'
                            : 'text-green-600'
                        }`}
                      >
                        Password strength: {strengthMeta.label}
                      </Text>
                    </View>
                  )}

                  {/* Requirements checklist */}
                  <View className="mt-4 rounded-2xl bg-brand-air/40 p-4">
                    <Text className="mb-2.5 text-xs font-semibold text-brand-night">
                      Your password must contain:
                    </Text>
                    <View className="gap-1.5">
                      {ruleResults.map((r) => (
                        <View
                          key={r.id}
                          className="flex-row items-center gap-2"
                        >
                          <Ionicons
                            name={
                              r.passed
                                ? 'checkmark-circle'
                                : 'ellipse-outline'
                            }
                            size={16}
                            color={r.passed ? '#16A34A' : '#9a96c8'}
                          />
                          <Text
                            className={`text-xs ${
                              r.passed
                                ? 'text-green-700'
                                : 'text-brand-night/60'
                            }`}
                          >
                            {r.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Confirm password */}
                  <Text className="mb-2 mt-5 text-sm font-semibold text-brand-night">
                    Confirm new password
                  </Text>
                  <View
                    className={`${inputBase} ${
                      confirm.length > 0 && !passwordsMatch
                        ? 'border-red-500'
                        : 'border-brand-mist'
                    }`}
                  >
                    <TextInput
                      value={confirm}
                      onChangeText={(t) => {
                        setConfirm(t);
                        setError('');
                      }}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#9a96c8"
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="newPassword"
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
                      className="flex-1 text-base text-brand-night"
                    />
                    {eye(showConfirm, () => setShowConfirm((v) => !v))}
                  </View>

                  {/* Inline match indicator */}
                  {confirm.length > 0 && (
                    <View className="mt-1.5 flex-row items-center gap-1.5">
                      <Ionicons
                        name={
                          passwordsMatch
                            ? 'checkmark-circle'
                            : 'close-circle'
                        }
                        size={14}
                        color={passwordsMatch ? '#16A34A' : '#DC2626'}
                      />
                      <Text
                        className={`text-xs ${
                          passwordsMatch ? 'text-green-700' : 'text-red-600'
                        }`}
                      >
                        {passwordsMatch
                          ? 'Passwords match'
                          : 'Passwords do not match'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Main button */}
              <Pressable
                onPress={handleContinue}
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
                    {step === 'request'
                      ? 'Send code'
                      : step === 'verify'
                      ? 'Verify'
                      : 'Reset password'}
                  </Text>
                )}
              </Pressable>

              {/* Back to login */}
              <View className="mt-6 flex-row items-center justify-center">
                <Text className="text-xs text-brand-night/70">
                  Remember your password?{' '}
                </Text>
                <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
                  <Text className="text-xs font-bold text-brand">Sign In</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}