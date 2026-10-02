import "../global.css";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";

SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}