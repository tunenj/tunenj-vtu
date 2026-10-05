import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

type Props = { title: string; subtitle?: string };

export default function ServiceHeader({ title, subtitle }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-6">
      <View className="h-11 flex-row items-center">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3 h-9 w-9 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </Pressable>
        <View>
          <Text className="text-xl font-semibold text-white">{title}</Text>
          {subtitle ? <Text className="text-xs text-white/70">{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}