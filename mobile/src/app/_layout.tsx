import "../global.css";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { NotificationsProvider } from "./context/NotificationsContext";

SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function RootLayout() {
  return (
    <NotificationsProvider>
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
    </NotificationsProvider>
  );
}