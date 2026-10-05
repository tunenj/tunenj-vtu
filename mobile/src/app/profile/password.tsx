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
import { router } from 'expo-router';
import FormField from '../../components/FormField';
import ServiceHeader from '../../components/ServiceHeader';
import SuccessFlash from '../../components/SuccessFlash';

type Errors = { current?: string; next?: string; confirm?: string; form?: string };

export default function ChangePassword() {
  const insets = useSafeAreaInsets();
  const nextRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const canSubmit = current !== '' && next !== '' && confirm !== '' && !loading;

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.back(), 1500);
    return () => clearTimeout(t);
  }, [done]);

  const validate = () => {
    const e: Errors = {};
    if (current.length < 6) e.current = 'Enter your current password';
    if (next.length < 8) e.next = 'Password must be at least 8 characters';
    else if (next === current) e.next = 'Choose a different password from your current one';
    if (confirm !== next) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!canSubmit || !validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // TODO: replace with your real API call, for example:
      // const res = await fetch('https://your-api.com/profile/password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ currentPassword: current, newPassword: next }),
      // });
      // if (res.status === 401) throw new Error('Your current password is wrong.');
      // if (!res.ok) throw new Error('Could not change your password.');
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setDone(true);
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
      <ServiceHeader title="Change password" subtitle="Use a strong, unique password" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          className="flex-1 rounded-t-[32px] bg-white"
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {errors.form ? (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{errors.form}</Text>
            </View>
          ) : null}

          <View className="gap-4">
            <FormField
              label="Current password"
              placeholder="Enter your current password"
              value={current}
              onChangeText={setCurrent}
              error={errors.current}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
              textContentType="password"
              returnKeyType="next"
              onSubmitEditing={() => nextRef.current?.focus()}
              right={eye(showCurrent, () => setShowCurrent((v) => !v))}
            />
            <FormField
              label="New password"
              placeholder="At least 8 characters"
              value={next}
              onChangeText={setNext}
              error={errors.next}
              inputRef={nextRef}
              secureTextEntry={!showNext}
              autoCapitalize="none"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              right={eye(showNext, () => setShowNext((v) => !v))}
            />
            <FormField
              label="Confirm new password"
              placeholder="Re-enter your new password"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              inputRef={confirmRef}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={save}
              right={eye(showConfirm, () => setShowConfirm((v) => !v))}
            />
          </View>

          <Pressable
            onPress={save}
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
              <Text className="text-lg font-semibold text-white">Update password</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/forgot-password')}
            hitSlop={8}
            accessibilityRole="button"
            className="mt-5 items-center"
          >
            <Text className="text-sm font-semibold text-brand">Forgot your current password?</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessFlash visible={done} message="Password updated" />
    </View>
  );
}