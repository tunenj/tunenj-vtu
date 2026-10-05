import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ServiceHeader from '../../components/ServiceHeader';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../../data/support';

type Faq = { id: string; question: string; answer: string };

// TODO: edit these questions and answers to match how your business really works
const FAQS: Faq[] = [
  {
    id: 'pending',
    question: 'My airtime or data has not arrived',
    answer:
      'Open Transactions and check the status of the purchase. Pending purchases can take a few minutes. If it still shows pending after that, contact support and send us the reference number.',
  },
  {
    id: 'failed',
    question: 'My purchase failed but I was charged',
    answer:
      'Contact support with the reference number from the transaction details page. We will check it and fix it as quickly as we can.',
  },
  {
    id: 'funding',
    question: 'My wallet funding has not reflected',
    answer:
      'Bank transfers are usually credited within a few minutes. Make sure you sent to the account number shown on the Wallet page. If it is still missing, contact support with your transfer receipt.',
  },
  {
    id: 'token',
    question: 'I lost my electricity token',
    answer:
      'Open Transactions, tap the electricity purchase and you will see the token again. You can copy it from there.',
  },
  {
    id: 'pin',
    question: 'I forgot my transaction PIN',
    answer:
      'Contact support and we will help you reset it after confirming it is really you.',
  },
];

export default function Help() {
  const insets = useSafeAreaInsets();
  const [openId, setOpenId] = useState<string | null>(null);

  const open = (url: string) =>
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open that', 'Please try again or use another option.')
    );

  const contacts = [
    { id: 'wa', icon: 'logo-whatsapp', label: 'WhatsApp', value: 'Chat with us', url: SUPPORT_WHATSAPP },
    { id: 'call', icon: 'call-outline', label: 'Call us', value: SUPPORT_PHONE, url: `tel:${SUPPORT_PHONE}` },
    { id: 'mail', icon: 'mail-outline', label: 'Email', value: SUPPORT_EMAIL, url: `mailto:${SUPPORT_EMAIL}` },
  ] as const;

  return (
    <View className="flex-1 bg-brand">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ServiceHeader title="Help centre" subtitle="Answers and support" />

      <ScrollView
        className="flex-1 rounded-t-[32px] bg-white"
        contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact */}
        <Text className="mb-3 text-lg font-bold text-brand-night">Talk to us</Text>
        <View className="rounded-3xl bg-brand-air px-4">
          {contacts.map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() => open(c.url)}
              accessibilityRole="button"
              accessibilityLabel={`${c.label}: ${c.value}`}
              className={`flex-row items-center py-4 active:opacity-70 ${
                i < contacts.length - 1 ? 'border-b border-white' : ''
              }`}
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
                <Ionicons name={c.icon} size={22} color="#281C9D" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-brand-night">{c.label}</Text>
                <Text className="text-xs text-brand-night/60">{c.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9a96c8" />
            </Pressable>
          ))}
        </View>

        {/* FAQ */}
        <Text className="mb-3 mt-8 text-lg font-bold text-brand-night">Common questions</Text>
        {FAQS.map((f) => {
          const expanded = openId === f.id;
          return (
            <View key={f.id} className="mb-3 overflow-hidden rounded-2xl border border-brand-mist bg-white">
              <Pressable
                onPress={() => setOpenId(expanded ? null : f.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                className="flex-row items-center p-4"
              >
                <Text className="flex-1 pr-3 text-base font-semibold text-brand-night">
                  {f.question}
                </Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#281C9D"
                />
              </Pressable>
              {expanded && (
                <Text className="px-4 pb-4 text-sm leading-5 text-brand-night/70">{f.answer}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}