import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

export type Service = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
};

export const SERVICES: Service[] = [
  { id: 'airtime', label: 'Airtime', icon: 'call-outline', href: '/services/airtime' },
  { id: 'data', label: 'Data', icon: 'cellular-outline', href: '/services/data' },
  { id: 'electricity', label: 'Electricity', icon: 'flash-outline', href: '/services/electricity' },
  { id: 'cable', label: 'Cable TV', icon: 'tv-outline', href: '/services/cable-tv' },
];