import { Buffer } from 'buffer';
global.Buffer = Buffer;
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'new NativeEventEmitter',
]);

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait one frame before navigating (prevents layout errors)
    const timeout = setTimeout(() => {
      setReady(true);
      router.replace("/(auth)/login");
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View>
      <Text>Redirecting...</Text>
    </View>
  );
}
