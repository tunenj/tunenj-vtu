import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FormField from '../../components/FormField';
import ServiceHeader from '../../components/ServiceHeader';
import SuccessFlash from '../../components/SuccessFlash';

// TODO: load the real details from your API
const saved = {
  firstName: 'John',
  lastName: 'Doe',
  phone: '07066352045',
  email: 'john.doe@email.com',
};

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState(saved.firstName);
  const [lastName, setLastName] = useState(saved.lastName);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const changed =
    firstName.trim() !== saved.firstName || lastName.trim() !== saved.lastName;
  const canSave = changed && firstName.trim() !== '' && lastName.trim() !== '' && !loading;

  // Close the success pop-up and go back after a moment
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.back(), 1500);
    return () => clearTimeout(t);
  }, [done]);

  const save = async () => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError('Enter your first and last name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // TODO: replace with your real API call, for example:
      // const res = await fetch('https://your-api.com/profile', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      // });
      // if (!res.ok) throw new Error('Could not save your details.');
      await new Promise((r) => setTimeout(r, 1000)); // fake delay for now
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-brand">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ServiceHeader title="Personal details" subtitle="Keep your account up to date" />

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

          <View className="gap-4">
            <FormField
              label="First name"
              value={firstName}
              onChangeText={(t) => {
                setFirstName(t);
                setError('');
              }}
              autoCapitalize="words"
              textContentType="givenName"
            />
            <FormField
              label="Last name"
              value={lastName}
              onChangeText={(t) => {
                setLastName(t);
                setError('');
              }}
              autoCapitalize="words"
              textContentType="familyName"
            />
            <FormField
              label="Phone number"
              value={saved.phone}
              locked
              hint="Your phone number is your account number and cannot be changed here."
            />
            <FormField
              label="Email address"
              value={saved.email}
              locked
              hint="To change your email, contact support."
            />
          </View>

          <Pressable
            onPress={save}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            className={`mt-8 h-14 items-center justify-center rounded-2xl ${
              canSave ? 'bg-brand active:opacity-90' : 'bg-brand-mist/60'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-lg font-semibold text-white">Save changes</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessFlash visible={done} message="Details updated" />
    </View>
  );
}