import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { scanAndConnect, sendCommand, requestPermissions } from '../../components/Bluetooth';
import LiveGraph from '../../components/LiveGraph';

const HomeScreen = () => {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [pressureData, setPressureData] = useState<number[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [cycleCount, setCycleCount] = useState('');
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const handleConnect = async () => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) {
      Alert.alert('Permissions Required', 'Please grant Bluetooth and Location permissions.');
      return;
    }

    const { connected } = await scanAndConnect((value: number) => {
      if (!isNaN(value) && isFinite(value)) {
        setPressureData(prev => [...prev.slice(-29), value]);

        // Simulate cycle completion detection (you can refine this with your actual BLE message)
        if (value === 0) {
          setCyclesCompleted(prev => prev + 1);
        }
      }
    });

    setDeviceConnected(connected);
    if (!connected) {
      Alert.alert('Connection Failed', 'Could not connect to ESP32_CUFF');
    }
  };

  const handleStart = () => {
    const cycleNum = parseInt(cycleCount);
    if (!deviceConnected) {
      Alert.alert('Not Connected', 'Please connect to the device first.');
      return;
    }
    if (isNaN(cycleNum) || cycleNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of cycles.');
      return;
    }

    sendCommand(`CYCLES:${cycleNum}`);
    sendCommand('START');
    setCyclesCompleted(0);
    setIsStarted(true);
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

      {/* Connection status */}
      <Text style={[styles.connectionStatus, { color: deviceConnected ? 'green' : 'red' }]}>
        {deviceConnected ? 'Connected to ESP32_CUFF' : 'Not Connected'}
      </Text>

      <Button title="Connect" onPress={handleConnect} />

      {/* Cycle input */}
    <TextInput
  style={styles.input}
  keyboardType="numeric"
  placeholder="Enter the no. of cycles"
  placeholderTextColor="#888" // 👈 Darker gray color
  value={cycleCount}
  onChangeText={setCycleCount}
  editable={!isStarted}
/>

      <Button
        title="Start"
        onPress={handleStart}
        disabled={!deviceConnected || isStarted}
      />
      <Button
        title="Stop"
        onPress={handleStop}
        disabled={!deviceConnected || !isStarted}
      />

      {/* Cycle status */}
      <Text style={styles.cycleText}>
        {isStarted ? `Cycle ${cyclesCompleted} of ${cycleCount}` : ''}
      </Text>

      <LiveGraph pressureData={pressureData} isStarted={isStarted} />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  connectionStatus: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  cycleText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});
