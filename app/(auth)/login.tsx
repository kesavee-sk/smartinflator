import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

// ✅ Type for the user object
type User = {
  username: string;
};

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null); // ✅ typed user
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // ✅ Simulate login process
  const handleLogin = () => {
    if (username === "Admin" && password === "1234") {
      setIsLoading(true);
      setTimeout(() => {
        setUser({ username }); // ✅ no TypeScript error now
        setIsLoading(false);
      }, 1000); // simulate async login delay
    } else {
      alert("Invalid credentials");
    }
  };

  // ✅ Redirect after login
  useEffect(() => {
    if (user) {
      router.replace("/(tabs)/home"); // ✅ route to your tab screen
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}> Smart Inflator</Text>

      <TextInput
  placeholder="Username"
  placeholderTextColor="#888" // darker placeholder
  value={username}
  onChangeText={setUsername}
  style={{
    color: '#000', // Make text visible
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: '#fff', // Contrast background
  }}
/>

<TextInput
  placeholder="Password"
  placeholderTextColor="#888"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={!showPassword}
  style={{
    color: '#000',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  }}
/>


      <Button
        title={isLoading ? "Logging in..." : "Login"}
        onPress={handleLogin}
        disabled={isLoading}
      />

      {isLoading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
});
