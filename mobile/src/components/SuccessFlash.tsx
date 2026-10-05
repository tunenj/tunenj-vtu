import { Modal, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = { visible: boolean; message?: string };

// Small success pop-up: a tick and a short message. Close it from the page with a timer.
export default function SuccessFlash({ visible, message }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-10">
        <View
          accessible
          accessibilityLabel={message ?? 'Success'}
          className="items-center rounded-3xl bg-white px-10 py-8"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-air">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-brand">
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
          </View>
          {message ? (
            <Text className="mt-4 text-center text-base font-semibold text-brand-night">
              {message}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}