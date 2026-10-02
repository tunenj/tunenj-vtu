import { useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import logo from '../../../assets/images/login-logo.png';

// Set to false if your business has no referral programme
const SHOW_REFERRAL = true;

const TERMS_URL = 'https://tunenj.com/terms'; // TODO: replace with your real links
const PRIVACY_URL = 'https://tunenj.com/privacy';

type Errors = Partial<
  Record<
    | 'firstName'
    | 'lastName'
    | 'phone'
    | 'email'
    | 'password'
    | 'confirm'
    | 'terms'
    | 'form',
    string
  >
>;

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  inputRef?: RefObject<TextInput | null>;
  right?: ReactNode;
};

function Field({ label, error, hint, inputRef, right, ...props }: FieldProps) {
  return (
    <View className="flex-1">
      <Text className="mb-2 text-sm font-semibold text-brand-night">{label}</Text>
      <View
        className={`h-14 flex-row items-center rounded-2xl border bg-white px-4 ${
          error ? 'border-red-500' : 'border-brand-mist'
        }`}
      >
        <TextInput
          ref={inputRef}
          placeholderTextColor="#9a96c8"
          autoCorrect={false}
          className="flex-1 text-base text-brand-night"
          {...props}
        />
        {right}
      </View>
      {error ? (
        <Text className="mt-1 text-xs text-red-600">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-xs text-brand-night/60">{hint}</Text>
      ) : null}
    </View>
  );
}

/** Official Google "G" mark — 4-color, drawn as SVG (no asset needed) */
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

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

export default function Register() {
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referral, setReferral] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const referralRef = useRef<TextInput>(null);

  // ─── Live password evaluation ─────────────────────────────────
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

  const canSubmit =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    phone !== '' &&
    email.trim() !== '' &&
    allRulesPassed &&
    passwordsMatch &&
    agreed &&
    !loading;

  const validate = () => {
    const e: Errors = {};
    if (firstName.trim().length < 2) e.firstName = 'Enter your first name';
    if (lastName.trim().length < 2) e.lastName = 'Enter your last name';
    if (!/^0[789][01]\d{8}$/.test(phone))
      e.phone = 'Enter a valid Nigerian number, e.g. 08012345678';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (!allRulesPassed)
      e.password = 'Password does not meet all the requirements';
    if (!passwordsMatch) e.confirm = 'Passwords do not match';
    if (!agreed) e.terms = 'You must agree to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!canSubmit || !validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // TODO: replace with your real API call
      await new Promise((r) => setTimeout(r, 1000));
      router.replace('/login');
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Something went wrong. Try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setErrors({});
    try {
      // TODO: integrate real Google Sign-In here.
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Google sign-up failed. Try again.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

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
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="mr-3 h-9 w-9 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
          <Text className="text-xl font-semibold text-white">Create account</Text>
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
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-5 items-center">
            <Image
              source={logo}
              alt="Tunenj logo"
              accessibilityLabel="Tunenj logo"
              style={{ width: 86, height: 86 }}
              resizeMode="contain"
            />
          </View>

          <View className="w-full">
            <Text className="text-center text-[28px] font-bold text-brand">
              Create Account
            </Text>
          </View>
          <Text className="mb-6 mt-1 text-center text-sm text-brand-night/70">
            Create your account to buy airtime, data and pay bills
          </Text>

          {/* ─── Google sign-up ─────────────────────────────────── */}
          <Pressable
            onPress={handleGoogleSignUp}
            disabled={googleLoading}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityState={{ disabled: googleLoading }}
            className="h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-brand-mist bg-white active:bg-brand-air/40"
          >
            {googleLoading ? (
              <ActivityIndicator color="#281C9D" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text className="text-base font-semibold text-brand-night">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          {/* ─── Divider ────────────────────────────────────────── */}
          <View className="my-6 flex-row items-center">
            <View className="h-px flex-1 bg-brand-mist" />
            <Text className="mx-4 text-xs font-medium text-brand-night/50">
              or sign up with email
            </Text>
            <View className="h-px flex-1 bg-brand-mist" />
          </View>

          {/* ─── Form error ─────────────────────────────────────── */}
          {errors.form ? (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{errors.form}</Text>
            </View>
          ) : null}

          {/* First and last name */}
          <View className="flex-row gap-3">
            <Field
              label="First name"
              placeholder="John"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              autoCapitalize="words"
              textContentType="givenName"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
            />
            <Field
              label="Last name"
              placeholder="Doe"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
              inputRef={lastNameRef}
              autoCapitalize="words"
              textContentType="familyName"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </View>

          <View className="mt-4">
            <Field
              label="Phone number"
              placeholder="08012345678"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
              error={errors.phone}
              hint="This will also be your Tunenj account number"
              inputRef={phoneRef}
              keyboardType="phone-pad"
              maxLength={11}
              textContentType="telephoneNumber"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>

          <View className="mt-4">
            <Field
              label="Email address"
              placeholder="you@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              hint="For receipts, notifications and account recovery"
              inputRef={emailRef}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          {/* ─── Password with strength meter ───────────────────── */}
          <View className="mt-4">
            <Field
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              error={errors.password}
              inputRef={passwordRef}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              right={eye(showPassword, () => setShowPassword((v) => !v))}
            />

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
            {password.length > 0 && (
              <View className="mt-4 rounded-2xl bg-brand-air/40 p-4">
                <Text className="mb-2.5 text-xs font-semibold text-brand-night">
                  Your password must contain:
                </Text>
                <View className="gap-1.5">
                  {ruleResults.map((r) => (
                    <View key={r.id} className="flex-row items-center gap-2">
                      <Ionicons
                        name={r.passed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={r.passed ? '#16A34A' : '#9a96c8'}
                      />
                      <Text
                        className={`text-xs ${
                          r.passed ? 'text-green-700' : 'text-brand-night/60'
                        }`}
                      >
                        {r.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ─── Confirm password with inline match check ──────── */}
          <View className="mt-4">
            <Field
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
                if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
              }}
              error={errors.confirm}
              inputRef={confirmRef}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              textContentType="newPassword"
              returnKeyType={SHOW_REFERRAL ? 'next' : 'done'}
              onSubmitEditing={() =>
                SHOW_REFERRAL ? referralRef.current?.focus() : handleRegister()
              }
              right={eye(showConfirm, () => setShowConfirm((v) => !v))}
            />

            {/* Inline password match indicator */}
            {confirm.length > 0 && (
              <View className="mt-1.5 flex-row items-center gap-1.5">
                <Ionicons
                  name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={passwordsMatch ? '#16A34A' : '#DC2626'}
                />
                <Text
                  className={`text-xs ${
                    passwordsMatch ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}
          </View>

          {SHOW_REFERRAL && (
            <View className="mt-4">
              <Field
                label="Referral code (optional)"
                placeholder="Enter a code if you have one"
                value={referral}
                onChangeText={setReferral}
                inputRef={referralRef}
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>
          )}

          {/* Terms */}
          <Pressable
            onPress={() => setAgreed((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            className="mt-6 flex-row items-start"
          >
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={24}
              color={errors.terms ? '#EF4444' : '#281C9D'}
            />
            <Text className="ml-3 flex-1 text-sm leading-5 text-brand-night/80">
              I agree to the{' '}
              <Text
                className="font-semibold text-brand"
                onPress={() => Linking.openURL(TERMS_URL)}
              >
                Terms &amp; Conditions
              </Text>{' '}
              and{' '}
              <Text
                className="font-semibold text-brand"
                onPress={() => Linking.openURL(PRIVACY_URL)}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </Pressable>
          {errors.terms ? (
            <Text className="mt-1 text-xs text-red-600">{errors.terms}</Text>
          ) : null}

          {/* Create account button */}
          <Pressable
            onPress={handleRegister}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            className={`mt-6 h-14 items-center justify-center rounded-2xl ${
              canSubmit ? 'bg-brand active:opacity-90' : 'bg-brand-mist/60'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-lg font-semibold text-white">Create account</Text>
            )}
          </Pressable>

          {/* Login link */}
          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-xs text-brand-night/70">
              Already have an account?{' '}
            </Text>
            <Link href="/login" asChild>
              <Pressable hitSlop={8}>
                <Text className="text-xs font-bold text-brand">Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}