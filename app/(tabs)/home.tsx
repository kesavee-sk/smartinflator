import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Alert } from 'react-native';
import { scanAndConnect, sendCommand, requestPermissions } from '../../components/Bluetooth';
import LiveGraph from '../../components/LiveGraph';

const HomeScreen = () => {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [pressureData, setPressureData] = useState<number[]>([]);
  const [isStarted, setIsStarted] = useState(false);

  const handleConnect = async () => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) {
      Alert.alert('Permissions Required', 'Please grant Bluetooth and Location permissions.');
      return;
    }

    const { connected } = await scanAndConnect((value: number) => {
      if (!isNaN(value) && isFinite(value)) {
        setPressureData(prev => [...prev.slice(-29), value]);
      }
    });

    setDeviceConnected(connected);
    if (!connected) {
      Alert.alert('Connection Failed', 'Could not connect to ESP32_CUFF');
    }
  };

  const handleStart = () => {
    if (deviceConnected) {
      sendCommand('START');
      setIsStarted(true);
    } else {
      Alert.alert('Not Connected', 'Please connect to the device first.');
    }
  };

  const handleStop = () => {
    if (deviceConnected) {
      sendCommand('STOP');
      setIsStarted(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Inflator Monitor</Text>
      <Button title="Connect" onPress={handleConnect} />
      <Button title="Start" onPress={handleStart} disabled={!deviceConnected || isStarted} />
      <Button title="Stop" onPress={handleStop} disabled={!deviceConnected || !isStarted} />
      <LiveGraph pressureData={pressureData} isStarted={isStarted} />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});
