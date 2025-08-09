#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define SERVICE_UUID        "fdad788e-d0f7-41f6-b28a-92600249857e"
#define CHARACTERISTIC_UUID "98d9ab80-5156-4c7c-a552-ca2c8038346e"

#define MOTOR_PIN    18
#define SOLENOID_PIN 19

// Phase durations (ms) — as you requested
const unsigned long INFLATE_MS = 10000UL;  // 10 s
const unsigned long HOLD_MS    = 10000UL;  // 10 s
const unsigned long DEFLATE_MS = 15000UL;  // 15 s
const unsigned long RELAX_MS   = 3000UL;   // 3 s

enum Phase { IDLE, INFLATING, HOLDING, DEFLATING, RELAXING };
Phase phase = IDLE;

BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristic = nullptr;
bool deviceConnected = false;
bool stopRequested = false;

// Cycle control
int totalCycles = 0;
int currentCycle = 0;
unsigned long phaseStart = 0;

// Notification timing
unsigned long lastNotify = 0;
const unsigned long NOTIFY_INTERVAL = 1000UL; // send updates every 1s

// Forward
void enterPhase(Phase p);

// ---------------- BLE callbacks ----------------
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) override {
    deviceConnected = true;
    Serial.println("BLE: Central connected");
  }
  void onDisconnect(BLEServer *pServer) override {
    deviceConnected = false;
    Serial.println("BLE: Central disconnected");
    // Make sure motors are off on disconnect
    digitalWrite(MOTOR_PIN, LOW);
    digitalWrite(SOLENOID_PIN, LOW);
    // Optionally reset state to IDLE on disconnect:
    // phase = IDLE;
  }
};

class MyCharacteristicCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pChar) override {
   String val = pChar->getValue();
    String rx = String(val.c_str());
    rx.trim();
    Serial.println("BLE RX: " + rx);

    if (rx.startsWith("CYCLES:")) {
      int n = rx.substring(7).toInt();
      if (n > 0) {
        totalCycles = n;
        currentCycle = 0;
        stopRequested = false;
        Serial.printf("Set cycles = %d\n", totalCycles);
        // start first cycle
        enterPhase(INFLATING);
      } else {
        Serial.println("CYCLES value invalid");
      }
    } else if (rx == "START") {
      if (totalCycles > 0 && phase == IDLE) {
        enterPhase(INFLATING);
      }
    } else if (rx == "STOP") {
      stopRequested = true;
      // Immediately stop hardware and notify app
      digitalWrite(MOTOR_PIN, LOW);
      digitalWrite(SOLENOID_PIN, LOW);
      phase = IDLE;
      totalCycles = 0;
      currentCycle = 0;
      if (deviceConnected && pCharacteristic) {
        pCharacteristic->setValue("0"); // indicate stop / cycle terminated
        pCharacteristic->notify();
      }
      Serial.println("STOP received - stopped.");
    } else {
      Serial.println("Unknown command");
    }
  }
};

// ---------------- helpers ----------------
void sendIfConnected(const String &s) {
  if (deviceConnected && pCharacteristic) {
    pCharacteristic->setValue(s.c_str());
    pCharacteristic->notify();
  }
  Serial.println("TX: " + s);
}

void enterPhase(Phase p) {
  phase = p;
  phaseStart = millis();
  lastNotify = 0; // force immediate notify next loop
  if (p == INFLATING) {
    currentCycle++;
    Serial.printf(">> Starting cycle %d of %d\n", currentCycle, totalCycles);
    // set hardware for inflation: motor ON, valve CLOSED (assumption)
    digitalWrite(MOTOR_PIN, HIGH);
    digitalWrite(SOLENOID_PIN, HIGH);
    sendIfConnected("Phase:INFLATE");
  } else if (p == HOLDING) {
    digitalWrite(MOTOR_PIN, LOW); // stop motor, keep valve closed
    digitalWrite(SOLENOID_PIN, HIGH);
    sendIfConnected("Phase:HOLD");
  } else if (p == DEFLATING) {
    // open valve to deflate
    digitalWrite(MOTOR_PIN, LOW);
    digitalWrite(SOLENOID_PIN, LOW);
    sendIfConnected("Phase:DEFLATE");
  } else if (p == RELAXING) {
    digitalWrite(MOTOR_PIN, LOW);
    digitalWrite(SOLENOID_PIN, HIGH); // valve closed again
    sendIfConnected("Phase:RELAX");
  } else { // IDLE
    digitalWrite(MOTOR_PIN, LOW);
    digitalWrite(SOLENOID_PIN, LOW);
    sendIfConnected("Phase:IDLE");
  }
}

// ---------------- Arduino setup ----------------
void setup() {
  Serial.begin(115200);
  pinMode(MOTOR_PIN, OUTPUT);
  pinMode(SOLENOID_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);
  digitalWrite(SOLENOID_PIN, LOW);

  BLEDevice::init("ESP32_CUFF");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pCharacteristic->setCallbacks(new MyCharacteristicCallbacks());

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // compatibility
  pAdvertising->setMinPreferred(0x12);
  pAdvertising->start();

  Serial.println("BLE started as ESP32_CUFF");
  phase = IDLE;
}

// ---------------- Main loop (state machine) ----------------
void loop() {
  unsigned long now = millis();

  // Send regular per-second updates during any non-IDLE phase
  if (phase != IDLE && (now - lastNotify >= NOTIFY_INTERVAL)) {
    lastNotify = now;

    // calculate seconds elapsed in this phase
    unsigned long elapsed = now - phaseStart;
    unsigned long sec = elapsed / 1000UL + 1; // 1-based second counter

    switch (phase) {
      case INFLATING:
        // cap at 10
        if (sec > (INFLATE_MS / 1000UL)) sec = INFLATE_MS / 1000UL;
        sendIfConnected("INFLATE:" + String(sec));
        break;
      case HOLDING:
        if (sec > (HOLD_MS / 1000UL)) sec = HOLD_MS / 1000UL;
        sendIfConnected("HOLD:" + String(sec));
        break;
      case DEFLATING:
        if (sec > (DEFLATE_MS / 1000UL)) sec = DEFLATE_MS / 1000UL;
        sendIfConnected("DEFLATE:" + String(sec));
        break;
      case RELAXING:
        if (sec > (RELAX_MS / 1000UL)) sec = RELAX_MS / 1000UL;
        sendIfConnected("RELAX:" + String(sec));
        break;
      default:
        break;
    }
  }

  // Phase transitions (non-blocking)
  if (phase == INFLATING && (now - phaseStart >= INFLATE_MS || stopRequested)) {
    if (stopRequested) { enterPhase(IDLE); stopRequested = false; return; }
    enterPhase(HOLDING);
  } else if (phase == HOLDING && (now - phaseStart >= HOLD_MS || stopRequested)) {
    if (stopRequested) { enterPhase(IDLE); stopRequested = false; return; }
    enterPhase(DEFLATING);
  } else if (phase == DEFLATING && (now - phaseStart >= DEFLATE_MS || stopRequested)) {
    if (stopRequested) { enterPhase(IDLE); stopRequested = false; return; }
    // after deflate, go to relax
    enterPhase(RELAXING);
  } else if (phase == RELAXING && (now - phaseStart >= RELAX_MS || stopRequested)) {
    if (stopRequested) { enterPhase(IDLE); stopRequested = false; return; }
    // cycle complete: notify app with "0" so your app increments cyclesCompleted
    sendIfConnected("0");
    Serial.printf("Cycle %d completed\n", currentCycle);

    if (currentCycle < totalCycles && !stopRequested) {
      // start next cycle
      enterPhase(INFLATING);
    } else {
      // all cycles done
      enterPhase(IDLE);
      totalCycles = 0;
      currentCycle = 0;
      sendIfConnected("All cycles completed");
      
    }
  }

  // keep CPU friendly
  delay(20);
}
