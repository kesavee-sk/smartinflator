import 'dotenv/config';

export default {
  expo: {
    name: "smartinflator",
    slug: "smartinflator",
    version: "1.0.0",
    orientation: "portrait",

    // ✅ Custom app icon (make sure it exists at this path)
    icon: "./assets/icon.png",

    scheme: "smartinflator",
    userInterfaceStyle: "light",

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    assetBundlePatterns: ["**/*"],

    ios: {
      supportsTablet: true,
      infoPlist: {
        NSBluetoothAlwaysUsageDescription: "This app uses Bluetooth to connect to the Smart Inflator device.",
        NSBluetoothPeripheralUsageDescription: "This app needs Bluetooth to function properly with medical devices.",
        NSLocationWhenInUseUsageDescription: "Bluetooth scanning requires access to location.",
      }
    },

    android: {
      package: "com.anonymous.smartinflator",

      // ✅ Adaptive icon support for Android
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },

      permissions: [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH_ADVERTISE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ],

      minSdkVersion: 24,
      compileSdkVersion: 35,
      targetSdkVersion: 35
    },

    web: {
      favicon: "./assets/favicon.png"
    },

    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "1.8.0",
          }
        }
      ]
    ],

    extra: {
      eas: {
        projectId: "902aa0aa-7df2-415c-84fe-cd5365187ec6"
      }
    }
  }
};
