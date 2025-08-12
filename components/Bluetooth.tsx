import { BleManager, Characteristic, Device } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { Platform, PermissionsAndroid } from 'react-native';

const SERVICE_UUID = 'fdad788e-d0f7-41f6-b28a-92600249857e'; 
const CHARACTERISTIC_UUID = '98d9ab80-5156-4c7c-a552-ca2c8038346e';
const DEVICE_NAME = 'ESP32_CUFF'; 

let connectedDevice: Device | null = null;
let writeCharacteristic: Characteristic | null = null;

const bleManager = new BleManager();

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(granted).every(val => val === 'granted');
  }
  return true;
};

export const scanAndConnect = async (
  onData: (rawValue: string) => void
): Promise<{ connected: boolean; characteristic: Characteristic | null }> => {
  console.log('Starting BLE Scan...');

  return new Promise(resolve => {
    bleManager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        resolve({ connected: false, characteristic: null });
        return;
      }

      if (device?.name) {
        console.log(' Found device:', device.name);
      }

      if (device && device.name === DEVICE_NAME) {
        console.log('Target device found. Attempting to connect...');
        bleManager.stopDeviceScan();

        try {
          const connected = await device.connect();
          console.log('Connected to device:', connected.name);

          await connected.discoverAllServicesAndCharacteristics();
          const services = await connected.services();

          for (const service of services) {
            if (service.uuid.toLowerCase() === SERVICE_UUID) {
              const characteristics = await service.characteristics();
              for (const char of characteristics) {
                if (char.uuid.toLowerCase() === CHARACTERISTIC_UUID) {
                  console.log(' Found correct characteristic. Setting up monitor...');

                  char.monitor((err, updatedChar) => {
                    if (err) {
                      console.error('Monitor error:', err);
                      return;
                    }

                    if (updatedChar?.value) {
                      const decoded = Buffer.from(updatedChar.value, 'base64').toString();
                      onData(decoded); // Pass raw string here
                    }
                  });

                  connectedDevice = connected;
                  writeCharacteristic = char;

                  console.log('Connection and monitoring established.');
                  resolve({ connected: true, characteristic: char });
                  return;
                }
              }
            }
          }

          console.warn('Matching service or characteristic not found.');
          resolve({ connected: false, characteristic: null });

        } catch (e) {
          console.error('Connection error:', e);
          resolve({ connected: false, characteristic: null });
        }
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      console.warn('⏱Scan timeout');
      resolve({ connected: false, characteristic: null });
    }, 10000);
  });
};

export const sendCommand = (command: string) => {
  if (writeCharacteristic) {
    const base64Command = Buffer.from(command).toString('base64');
    writeCharacteristic
      .writeWithResponse(base64Command)
      .then(() => console.log('Command sent:', command))
      .catch(err => console.error('Failed to send command:', err));
  } else {
    console.warn('Cannot send command. Characteristic not available.');
  }
};
