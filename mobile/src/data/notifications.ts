import type { Ionicons } from '@expo/vector-icons';

export type NotificationKind =
  | 'transaction'
  | 'funding'
  | 'security'
  | 'promo'
  | 'system';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  date: string; // ISO date
  read: boolean;
  href?: string; // page to open when tapped, for example /transactions/1
};

export const KIND_ICON: Record<
  NotificationKind,
  keyof typeof Ionicons.glyphMap
> = {
  transaction: 'receipt-outline',
  funding: 'wallet-outline',
  security: 'shield-checkmark-outline',
  promo: 'gift-outline',
  system: 'information-circle-outline',
};

const ago = (days: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// TODO: replace this demo data with notifications from your API
export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    kind: 'transaction',
    title: 'Data purchase successful',
    body: 'Your MTN 2GB data for 08031234567 has been delivered.',
    date: ago(0, 9, 41),
    read: false,
    href: '/transactions/1',
  },
  {
    id: 'n2',
    kind: 'funding',
    title: 'Wallet funded',
    body: '₦5,000.00 has been added to your wallet.',
    date: ago(1, 16, 12),
    read: false,
    href: '/transactions/2',
  },
  {
    id: 'n3',
    kind: 'transaction',
    title: 'Electricity payment pending',
    body: 'Your Ikeja Electric payment is still processing. We will notify you when your token is ready.',
    date: ago(2, 11, 5),
    read: true,
    href: '/transactions/3',
  },
  {
    id: 'n4',
    kind: 'security',
    title: 'New login detected',
    body: 'Your account was logged in on a new device. If this was not you, change your password now.',
    date: ago(3, 20, 3),
    read: true,
    href: '/profile',
  },
  {
    id: 'n5',
    kind: 'promo',
    title: 'Invite friends, earn rewards',
    body: 'Share your referral code and get a bonus when they make their first purchase.',
    date: ago(5, 10, 0),
    read: true,
  },
];