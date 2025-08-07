#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#define SERVICE_UUID        "fdad788e-d0f7-41f6-b28a-92600249857e"
#define CHARACTERISTIC_UUID "98d9ab80-5156-4c7c-a552-ca2c8038346e"
BLECharacteristic* pCharacteristic;
bool isStarted = false;
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1000;  
class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) {
    // Get the value as std::string
  String value = pCharacteristic->getValue(); 
    // Convert std::string to Arduino String
    String command = String(value.c_str());
    // Handle commands
    if (command == "START") {
      isStarted = true;
      Serial.println("Received START command");
    } else if (command == "STOP") {
      isStarted = false;
      Serial.println("Received STOP command");
    }
  }
};

void setup() {
  Serial.begin(115200);

  BLEDevice::init("SmartInflator");
  BLEServer* pServer = BLEDevice::createServer();
  BLEService* pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );

  pCharacteristic->setCallbacks(new MyCallbacks());
  pService->start();

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.println("BLE Smart Inflator ready...");
}

void loop() {
  if (isStarted && millis() - lastSendTime >= sendInterval) {
    lastSendTime = millis();
    int simulatedPressure = random(100, 160);  // Simulated pressure value
    String pressureData = "P:" + String(simulatedPressure);
    pCharacteristic->setValue(pressureData.c_str());
    pCharacteristic->notify();

    Serial.println("Sent: " + pressureData);
  }
  delay(10);
}
