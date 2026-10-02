import type { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;
export type TxStatus = 'success' | 'pending' | 'failed';
export type TxCategory = 'airtime' | 'data' | 'electricity' | 'cable' | 'funding';

export type Transaction = {
  id: string;
  title: string;
  sub: string; // phone number, meter number, bank name...
  amount: number; // negative = money out, positive = money in
  date: string; // ISO date
  status: TxStatus;
  category: TxCategory;
  reference: string;
  method: string;
};

export const CATEGORY_META: Record<TxCategory, { label: string; icon: IconName }> = {
  airtime: { label: 'Airtime', icon: 'call-outline' },
  data: { label: 'Data', icon: 'cellular-outline' },
  electricity: { label: 'Electricity', icon: 'flash-outline' },
  cable: { label: 'Cable TV', icon: 'tv-outline' },
  funding: { label: 'Wallet funding', icon: 'wallet-outline' },
};

const ago = (days: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// TODO: replace this demo data with real data from your API
export const TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'MTN 2GB Data', sub: '08031234567', amount: -1000, date: ago(0, 9, 41), status: 'success', category: 'data', reference: 'TNJ-0001-4821', method: 'Wallet' },
  { id: '2', title: 'Wallet funding', sub: 'Bank transfer', amount: 5000, date: ago(1, 16, 12), status: 'success', category: 'funding', reference: 'TNJ-0002-4820', method: 'Bank transfer' },
  { id: '3', title: 'Ikeja Electric', sub: 'Meter 4512 ••• 890', amount: -3500, date: ago(2, 11, 5), status: 'pending', category: 'electricity', reference: 'TNJ-0003-4819', method: 'Wallet' },
  { id: '4', title: 'Airtel Airtime', sub: '08024567890', amount: -500, date: ago(3, 19, 30), status: 'failed', category: 'airtime', reference: 'TNJ-0004-4818', method: 'Wallet' },
  { id: '5', title: 'DSTV Compact', sub: 'Decoder 7024 ••• 311', amount: -12500, date: ago(4, 8, 15), status: 'success', category: 'cable', reference: 'TNJ-0005-4817', method: 'Wallet' },
  { id: '6', title: 'Glo 5GB Data', sub: '08051112233', amount: -1500, date: ago(6, 14, 2), status: 'success', category: 'data', reference: 'TNJ-0006-4816', method: 'Wallet' },
  { id: '7', title: 'Wallet funding', sub: 'Card payment', amount: 10000, date: ago(8, 10, 40), status: 'success', category: 'funding', reference: 'TNJ-0007-4815', method: 'Card' },
];

export const STATUS_STYLE: Record<TxStatus, { box: string; text: string; label: string }> = {
  success: { box: 'bg-green-50', text: 'text-green-700', label: 'Successful' },
  pending: { box: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  failed: { box: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
};

export const naira = (n: number) => '₦' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const timeLabel = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
};

export const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const fullDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${timeLabel(iso)}`;
};