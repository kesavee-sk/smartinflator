import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides top header globally (just in case)
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,        // Hides top "home"
          tabBarLabel: () => null,   // Hides bottom "home" text
          tabBarIcon: () => null,    // Hides broken icon
        }}
      />
    </Tabs>
  );
}
