import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import type { Href } from 'expo-router';

// Set to false if your business has no referral programme
const SHOW_REFERRAL = true;

// TODO: replace these placeholders with your real links and number
const SUPPORT_WHATSAPP = 'https://wa.me/2348012345678';
const TERMS_URL = 'https://tunenj.com/terms';
const PRIVACY_URL = 'https://tunenj.com/privacy';

// TODO: replace this demo data with real data from your API
const user = {
  firstName: 'John',
  lastName: 'Doe',
  phone: '08012345678',
  email: 'john.doe@email.com',
  referralCode: 'JOHN2026',
  verified: true,
};

type IconName = keyof typeof Ionicons.glyphMap;

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-6 px-5">
      <Text className="mb-2 ml-1 text-sm font-semibold text-brand-night/60">{title}</Text>
      <View className="overflow-hidden rounded-3xl bg-white">{children}</View>
    </View>
  );
}

type RowProps = {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
};

function Row({ icon, label, value, onPress, right, last }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      className={`flex-row items-center px-4 py-3.5 active:bg-brand-air ${
        last ? '' : 'border-b border-brand-air'
      }`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-air">
        <Ionicons name={icon} size={20} color="#281C9D" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-brand-night">{label}</Text>
        {value ? <Text className="text-xs text-brand-night/60">{value}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={20} color="#9a96c8" /> : null)}
    </Pressable>
  );
}

/** Custom branded logout confirmation sheet */
function LogoutSheet({
  visible,
  onClose,
  onConfirm,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ paddingBottom: insets.bottom + 20 }}
          className="rounded-t-[32px] bg-white px-6 pt-3"
        >
          {/* Drag handle */}
          <View className="mb-5 h-1 w-10 self-center rounded-full bg-black/10" />

          {/* Icon */}
          <View className="items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <Ionicons name="log-out-outline" size={40} color="#DC2626" />
            </View>
          </View>

          {/* Title + message */}
          <Text className="mt-5 text-center text-[22px] font-bold text-brand-night">
            Log out of Tunenj?
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-brand-night/70">
            You&apos;ll need to sign in again with your phone number or email
            to access your wallet and transactions.
          </Text>

         

          {/* Actions */}
          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onClose}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Cancel logout"
              className="h-14 flex-1 items-center justify-center rounded-2xl border border-brand-mist bg-white active:bg-brand-air/40"
            >
              <Text className="text-base font-semibold text-brand-night">
                Stay signed in
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Confirm logout"
              className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-red-600 active:opacity-90"
            >
              {loading ? (
                <Text className="text-base font-semibold text-white">Logging out…</Text>
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                  <Text className="text-base font-semibold text-white">Log out</Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const [biometric, setBiometric] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  // Load saved switches
  useEffect(() => {
    (async () => {
      const [b, n] = await Promise.all([
        AsyncStorage.getItem('biometricEnabled'),
        AsyncStorage.getItem('notificationsEnabled'),
      ]);
      setBiometric(b === 'true');
      if (n !== null) setNotifications(n === 'true');
    })();
  }, []);

  const toggleBiometric = async (next: boolean) => {
    if (next) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        Alert.alert(
          'Not available',
          'Set up a fingerprint or face unlock in your phone settings first.'
        );
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm to turn on fingerprint login',
      });
      if (!result.success) return;
    }
    setBiometric(next);
    await AsyncStorage.setItem('biometricEnabled', String(next));
  };

  const toggleNotifications = async (next: boolean) => {
    setNotifications(next);
    await AsyncStorage.setItem('notificationsEnabled', String(next));
    // TODO: also tell your server to turn push notifications on or off for this user
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openLink = (url: string) =>
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open the link', 'Please try again later.')
    );

  const go = (route: string) => router.push(route as Href);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await AsyncStorage.removeItem('token');
      // Optionally also clear biometric flag so next login re-verifies
      // await AsyncStorage.removeItem('biometricEnabled');
      // TODO: also tell your server to end this session
      setShowLogout(false);
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const switchColors = { false: '#D9D5FF', true: '#281C9D' };

  return (
    <View className="flex-1 bg-brand-air">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="items-center rounded-b-[32px] bg-brand px-5 pb-8"
        >
          <View className="h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-white">
            <Text className="text-3xl font-bold text-brand">{initials}</Text>
          </View>

          <Text className="mt-3 text-2xl font-bold text-white">
            {user.firstName} {user.lastName}
          </Text>
          <Text className="mt-0.5 text-sm text-white/80">{user.phone}</Text>
          <Text className="text-sm text-white/80">{user.email}</Text>

          {user.verified && (
            <View className="mt-3 flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <Ionicons name="checkmark-circle" size={16} color="#B3ADFF" />
              <Text className="text-xs font-semibold text-white">
                Verified account
              </Text>
            </View>
          )}
        </View>

        {/* Referral */}
        {SHOW_REFERRAL && (
          <View className="mx-5 mt-5 flex-row items-center rounded-3xl bg-white p-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-air">
              <Ionicons name="gift-outline" size={24} color="#281C9D" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs text-brand-night/60">Your referral code</Text>
              <Text className="text-xl font-bold tracking-widest text-brand">
                {user.referralCode}
              </Text>
            </View>
            <Pressable
              onPress={copyCode}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Copy referral code"
              className="flex-row items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 active:opacity-90"
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={16}
                color="#FFFFFF"
              />
              <Text className="text-xs font-semibold text-white">
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Account */}
        <Group title="Account">
          <Row
            icon="person-outline"
            label="Personal details"
            value="Name, phone and email"
            onPress={() => go('/profile/edit')}
          />
          <Row
            icon="keypad-outline"
            label="Transaction PIN"
            value="Change or reset your PIN"
            onPress={() => go('/profile/pin')}
          />
          <Row
            icon="lock-closed-outline"
            label="Change password"
            onPress={() => go('/profile/password')}
            last
          />
        </Group>

        {/* Security and preferences */}
        <Group title="Security and preferences">
          <Row
            icon="finger-print"
            label="Fingerprint login"
            value="Log in without typing your password"
            right={
              <Switch
                value={biometric}
                onValueChange={toggleBiometric}
                trackColor={switchColors}
                thumbColor="#FFFFFF"
                accessibilityLabel="Fingerprint login"
              />
            }
          />
          <Row
            icon="notifications-outline"
            label="Push notifications"
            value="Receipts and account alerts"
            right={
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
                trackColor={switchColors}
                thumbColor="#FFFFFF"
                accessibilityLabel="Push notifications"
              />
            }
            last
          />
        </Group>

        {/* Support and legal */}
        <Group title="Support and legal">
          <Row
            icon="help-circle-outline"
            label="Help centre"
            onPress={() => go('/profile/help')}
          />
          <Row
            icon="logo-whatsapp"
            label="Contact us on WhatsApp"
            onPress={() => openLink(SUPPORT_WHATSAPP)}
          />
          <Row
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => openLink(TERMS_URL)}
          />
          <Row
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => openLink(PRIVACY_URL)}
            last
          />
        </Group>

        {/* Log out */}
        <View className="mt-6 px-5">
          <Pressable
            onPress={() => setShowLogout(true)}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-red-50 active:opacity-80"
          >
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            <Text className="text-base font-semibold text-red-600">Log out</Text>
          </Pressable>

          <Text className="mt-5 text-center text-xs text-brand-night/50">
            Tunenj · Version {version}
          </Text>
        </View>
      </ScrollView>

      {/* Custom logout sheet */}
      <LogoutSheet
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
      />
    </View>
  );
}