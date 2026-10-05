import type { ReactNode, RefObject } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  right?: ReactNode; // for example a show/hide eye button
  locked?: boolean; // read-only field with a lock icon
  inputRef?: RefObject<TextInput | null>;
};

export default function FormField({ label, error, hint, right, locked, inputRef, ...props }: Props) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-brand-night">{label}</Text>
      <View
        className={`h-14 flex-row items-center rounded-2xl border px-4 ${
          locked
            ? 'border-brand-air bg-brand-air/60'
            : error
              ? 'border-red-500 bg-white'
              : 'border-brand-mist bg-white'
        }`}
      >
        <TextInput
          ref={inputRef}
          editable={!locked}
          placeholderTextColor="#9a96c8"
          autoCorrect={false}
          className={`flex-1 text-base ${locked ? 'text-brand-night/60' : 'text-brand-night'}`}
          {...props}
        />
        {locked ? <Ionicons name="lock-closed-outline" size={18} color="#9a96c8" /> : right}
      </View>
      {error ? (
        <Text className="mt-1 text-xs text-red-600">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-xs text-brand-night/60">{hint}</Text>
      ) : null}
    </View>
  );
}