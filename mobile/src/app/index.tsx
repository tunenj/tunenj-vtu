import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Set to false before you release the app
const ALWAYS_SHOW_ONBOARDING = true;

export default function Index() {
  const [target, setTarget] = useState<"/onboarding" | "/login" | null>(null);

  useEffect(() => {
    (async () => {
      if (ALWAYS_SHOW_ONBOARDING) {
        await AsyncStorage.removeItem("hasOnboarded");
      }
      const seen = await AsyncStorage.getItem("hasOnboarded");
      console.log("hasOnboarded:", seen);
      setTarget(seen ? "/login" : "/onboarding");
    })();
  }, []);

  if (!target) return null;
  return <Redirect href={target} />;
}