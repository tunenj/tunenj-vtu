import { useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import logo from '../../../assets/images/login-logo.png';

// Set to false if your business has no referral programme
const SHOW_REFERRAL = true;

const TERMS_URL = 'https://tunenj.com/terms'; // TODO: replace with your real links
const PRIVACY_URL = 'https://tunenj.com/privacy';

type Errors = Partial<
  Record<
    'firstName' | 'lastName' | 'phone' | 'email' | 'password' | 'confirm' | 'terms' | 'form',
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
  const [errors, setErrors] = useState<Errors>({});

  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const referralRef = useRef<TextInput>(null);

  const canSubmit =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    phone !== '' &&
    email.trim() !== '' &&
    password !== '' &&
    confirm !== '' &&
    agreed &&
    !loading;

  const validate = () => {
    const e: Errors = {};
    if (firstName.trim().length < 2) e.firstName = 'Enter your first name';
    if (lastName.trim().length < 2) e.lastName = 'Enter your last name';
    if (!/^0[789][01]\d{8}$/.test(phone)) e.phone = 'Enter a valid Nigerian number, e.g. 08012345678';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (confirm !== password) e.confirm = 'Passwords do not match';
    if (!agreed) e.terms = 'You must agree to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!canSubmit || !validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // TODO: replace with your real API call, for example:
      // const res = await fetch('https://your-api.com/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     firstName: firstName.trim(),
      //     lastName: lastName.trim(),
      //     phone,
      //     email: email.trim().toLowerCase(),
      //     password,
      //     referralCode: referral.trim() || undefined,
      //   }),
      // });
      // if (!res.ok) throw new Error('Could not create your account');
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      router.replace({
        pathname: '/verify-account',
        params: { phone, email: email.trim() },
      });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const eye = (visible: boolean, toggle: () => void) => (
    <Pressable
      onPress={toggle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
    >
      <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#281C9D" />
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
              style={{ width: 72, height: 72 }}
              resizeMode="contain"
            />
          </View>

          <Text className="text-[28px] font-bold text-brand">Join Tunenj</Text>
          <Text className="mb-6 mt-1 text-sm text-brand-night/70">
            Create your account to buy airtime, data and pay bills
          </Text>

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

          <View className="mt-4">
            <Field
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              inputRef={passwordRef}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              right={eye(showPassword, () => setShowPassword((v) => !v))}
            />
          </View>

          <View className="mt-4">
            <Field
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              inputRef={confirmRef}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              textContentType="newPassword"
              returnKeyType={SHOW_REFERRAL ? 'next' : 'done'}
              onSubmitEditing={() => (SHOW_REFERRAL ? referralRef.current?.focus() : handleRegister())}
              right={eye(showConfirm, () => setShowConfirm((v) => !v))}
            />
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
              <Text className="font-semibold text-brand" onPress={() => Linking.openURL(TERMS_URL)}>
                Terms &amp; Conditions
              </Text>{' '}
              and{' '}
              <Text className="font-semibold text-brand" onPress={() => Linking.openURL(PRIVACY_URL)}>
                Privacy Policy
              </Text>
              .
            </Text>
          </Pressable>
          {errors.terms ? <Text className="mt-1 text-xs text-red-600">{errors.terms}</Text> : null}

          {/* Create account button: pale until everything is filled */}
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
            <Text className="text-xs text-brand-night/70">Already have an account? </Text>
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