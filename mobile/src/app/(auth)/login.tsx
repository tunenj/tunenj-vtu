import { useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Link, router, type Href } from 'expo-router';
import lockImage from '../../../assets/images/login-logo.png';

type Errors = { identifier?: string; password?: string; form?: string };

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

export default function Login() {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !loading;

  const validate = () => {
    const e: Errors = {};
    const value = identifier.trim();
    const isEmail = /^\S+@\S+\.\S+$/.test(value);
    const isPhone = /^\+?\d{10,14}$/.test(value.replace(/\s/g, ''));
    if (!isEmail && !isPhone) e.identifier = 'Enter a valid phone number or email';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!canSubmit || !validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // TODO: replace with your real API call
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      await AsyncStorage.setItem('token', 'demo-token');
      router.replace('/home');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setErrors({});
    try {
      // TODO: integrate real Google Sign-In here.
      // Recommended flow:
      //   1. import * as Google from 'expo-auth-session/providers/google';
      //   2. const [request, response, promptAsync] = Google.useAuthRequest({...});
      //   3. const result = await promptAsync();
      //   4. if (result?.type === 'success') send result.params.id_token
      //      to your backend: POST /auth/google { idToken }
      //   5. backend verifies with Google, links to existing account,
      //      returns JWT
      //   6. store JWT, router.replace('/home')
      await new Promise((r) => setTimeout(r, 800)); // fake delay
      // await AsyncStorage.setItem('token', 'demo-google-token');
      // router.replace('/home');
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Google sign-in failed. Try again.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFingerprint = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) {
      setErrors({ form: 'Set up a fingerprint or face unlock on your phone first.' });
      return;
    }
    // Only allow biometric login if the user has logged in before
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setErrors({ form: 'Log in with your password once to enable fingerprint login.' });
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Log in to Tunenj',
      cancelLabel: 'Cancel',
    });
    if (result.success) router.replace('/home');
  };

  const inputBase = 'h-14 flex-row items-center rounded-2xl border bg-white px-4';

  return (
    <View className="flex-1 bg-brand">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-6">
        <View className="h-11 flex-row items-center">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/onboarding'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="mr-3 h-9 w-9 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
          <Text className="text-xl font-semibold text-white">Sign in</Text>
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
          <Text className="text-[28px] font-bold text-brand">Welcome Back</Text>
          <Text className="mt-1 text-sm text-brand-night/70">
            Hello there, sign in to continue
          </Text>

          <View className="items-center py-4">
            <Image
              source={lockImage}
              alt=""
              accessibilityLabel="Secure sign in"
              style={{ width: 86, height: 86 }}
              resizeMode="contain"
            />
          </View>

          {errors.form ? (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{errors.form}</Text>
            </View>
          ) : null}

          {/* Phone or email */}
          <View
            className={`${inputBase} ${
              errors.identifier ? 'border-red-500' : 'border-brand-mist'
            }`}
          >
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Phone number or email"
              placeholderTextColor="#9a96c8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              className="flex-1 text-base text-brand-night"
            />
          </View>
          {errors.identifier ? (
            <Text className="mt-1 text-xs text-red-600">{errors.identifier}</Text>
          ) : null}

          {/* Password */}
          <View
            className={`${inputBase} mt-4 ${
              errors.password ? 'border-red-500' : 'border-brand-mist'
            }`}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#9a96c8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              className="flex-1 text-base text-brand-night"
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#281C9D"
              />
            </Pressable>
          </View>
          {errors.password ? (
            <Text className="mt-1 text-xs text-red-600">{errors.password}</Text>
          ) : null}

          <Link href={'/forgot-password' as Href} asChild>
            <Pressable className="mt-3 self-end" hitSlop={8}>
              <Text className="text-xs text-brand-night/70">Forgot your password ?</Text>
            </Pressable>
          </Link>

          {/* Sign in button */}
          <Pressable
            onPress={handleLogin}
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
              <Text
                className={`text-lg font-semibold ${
                  canSubmit ? 'text-white' : 'text-white/90'
                }`}
              >
                Sign in
              </Text>
            )}
          </Pressable>

          {/* ─── Divider ────────────────────────────────────────────── */}
          <View className="my-6 flex-row items-center">
            <View className="h-px flex-1 bg-brand-mist" />
            <Text className="mx-4 text-xs font-medium text-brand-night/50">
              or continue with
            </Text>
            <View className="h-px flex-1 bg-brand-mist" />
          </View>

          {/* ─── Google sign-in ─────────────────────────────────────── */}
          <Pressable
            onPress={handleGoogleSignIn}
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

          {/* Fingerprint */}
          <Pressable
            onPress={handleFingerprint}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Log in with fingerprint"
            className="mt-8 items-center"
          >
            <Ionicons name="finger-print" size={64} color="#281C9D" />
          </Pressable>

          {/* Sign up */}
          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-xs text-brand-night/70">Don&apos;t have an account? </Text>
            <Link href="/register" asChild>
              <Pressable hitSlop={8}>
                <Text className="text-xs font-bold text-brand">Sign Up</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}