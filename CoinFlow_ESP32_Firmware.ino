/*
 * =================================================================================
 * CoinFlow ESP32 Smart Coin Sorting & Dispensing System Firmware
 * =================================================================================
 * Operational Rules:
 *   1. Emergency Stop: Halts ALL ESP32 work, turns off PWM on all 7 drawer servos, stops feed motor, shows "EMERGENCY STOP! / ALL MOTORS HALT" on LCD.
 *   2. Continue Work: Resumes ESP32 work and coin feeder loop right where it stopped, restores LCD screen.
 *   3. Coin Feed Servo (CH0): Sweeps 4 cm back & forth continuously when active.
 *   4. Compartment Drawers (CH1 - CH7 - SG90 360° Continuous Servos):
 *      - Reduced rotation duration: 1.3s (1300ms) for 10° smaller rotation angle.
 *      - Swapped rotation direction of Rs.1 Big slot (slot_4) drawer open/close function.
 *      - When a slot opens, the I2C LCD Display shows: "[COIN TYPE] Slot / DRAWER OPEN!".
 *   5. Web App RESET Button Click (Smart Toggle Logic):
 *      - Resets count of that slot to 0.
 *      - If drawer was CLOSED -> Opens drawer FORWARD (1.3s), updates LCD.
 *      - If drawer was OPEN -> Closes drawer BACKWARD (1.3s), updates LCD.
 * =================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
#include <LiquidCrystal_I2C.h>

// ---------------------------------------------------------------------------------
// 1. NETWORK & SYSTEM CONFIGURATION
// ---------------------------------------------------------------------------------
const char* WIFI_SSID     = "Meta Force"; // Wi-Fi SSID
const char* WIFI_PASSWORD = "11223344";   // Wi-Fi Password

// Fallback SoftAP Hotspot configuration if Wi-Fi router connection fails
const char* AP_SSID       = "CoinFlow_ESP32_AP";
const char* AP_PASSWORD   = "12345678";

// Servo Rotation Direction Tuning
#define INVERT_DRAWER_SERVOS false

// Server Instances
WebServer server(80);                              // HTTP REST Server on Port 80
WebSocketsServer webSocket = WebSocketsServer(81); // WebSocket Server on Port 81

// ---------------------------------------------------------------------------------
// 2. PCB HARDWARE PIN DEFINITIONS
// ---------------------------------------------------------------------------------
#define I2C_SDA_PIN    21
#define I2C_SCL_PIN    22

#define BUZZER_PIN     4   // Active Buzzer (+)
#define LED_GREEN_PIN  16  // Green Status LED
#define LED_RED_PIN    17  // Red Warning/Alarm LED

const int NUM_SLOTS = 7;

// Optical IR Sensor Pins (IR1 to IR7 - Reversed Order)
const int IR_PINS[NUM_SLOTS] = { 32, 33, 25, 26, 27, 14, 13 };

// PCA9685 Servo Channels
const int PCA_FEED_CHANNEL = 0; // CH0: Coin Insertion SG90 Motor (4cm sweep)
const int PCA_DRAWER_CHANNELS[NUM_SLOTS] = { 1, 2, 3, 4, 5, 6, 7 }; // CH1 - CH7 SG90 360° Servos

// Coin Slot Metadata (Sri Lanka Denominations)
const char* SLOT_IDS[NUM_SLOTS]    = { "slot_1", "slot_2", "slot_3", "slot_4", "slot_5", "slot_6", "slot_7" };
const char* COIN_TYPES[NUM_SLOTS]  = { "Rs.1 Small", "Rs.2 Small", "Rs.5", "Rs.1 Big", "Rs.10", "Rs.20", "Rs.2 Big" };
const int COIN_VALUES[NUM_SLOTS]    = { 1, 2, 5, 1, 10, 20, 2 };
const int MAX_LIMITS[NUM_SLOTS]     = { 10, 10, 10, 10, 10, 10, 10 }; // EXACT 10 COINS LIMIT PER SLOT

// ---------------------------------------------------------------------------------
// 3. I2C HARDWARE MODULE INSTANCES (PCA9685 & LCD DISPLAY)
// ---------------------------------------------------------------------------------
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40);
LiquidCrystal_I2C lcd(0x27, 16, 2); // 16x2 LCD Display at I2C Address 0x27

// Servo PWM Pulse Limits for standard 50Hz Servos
#define SERVOMIN  125 // 0 degrees / Full CCW Reverse (pulse out of 4096)
#define SERVOMAX  575 // 180 degrees / Full CW Forward (pulse out of 4096)

// Machine State Variables
int slotCounts[NUM_SLOTS] = { 0, 0, 0, 0, 0, 0, 0 };
bool drawerOpen[NUM_SLOTS] = { false, false, false, false, false, false, false };
bool feedEnabled = true;
bool manualPause = false;
bool emergencyStop = false;
String machineStatus = "active"; // "active", "paused", "slot_full", "error"

unsigned long lastSensorReadTime[NUM_SLOTS] = { 0 };
int lastIrState[NUM_SLOTS] = { HIGH, HIGH, HIGH, HIGH, HIGH, HIGH, HIGH };
unsigned long eventCounter = 0;
unsigned long lastBroadcastTime = 0;

// Non-blocking Feed Motor Oscillating Timing Variables (4 cm movement loop)
unsigned long lastFeedMotorTime = 0;
bool feedMotorPositionHigh = false;
int feedSpeedMs = 700; // Coin Feed Motor Sweep Interval in ms (Manually Adjustable from Web App)

// Alarm LED Blinking Variables
unsigned long lastAlarmBlinkTime = 0;
bool alarmLedState = false;

// ---------------------------------------------------------------------------------
// 4. SERVO DRIVER & PWM ZERO-CREEP HELPER FUNCTIONS
// ---------------------------------------------------------------------------------
void setServoAngle(uint8_t channel, int angle) {
  int pulse = map(angle, 0, 180, SERVOMIN, SERVOMAX);
  pwm.setPWM(channel, 0, pulse);
}

// Completely TURNS OFF the PWM signal on a channel so continuous servos cannot creep or spin!
void stopServoPwm(uint8_t channel) {
  pwm.setPWM(channel, 0, 0); // 0% duty cycle = 0 PWM signal (100% frozen)
}

// Controls SG90 360° Continuous Servo Direction & Duration
// Swapped open/close direction for Rs.5 (slotIdx == 2)
// Reduced rotation angle by 10° (950ms) ONLY for Rs.1 Small (0), Rs.2 Small (1), and Rs.5 (2)
void move360ServoDrawer(int slotIdx, int direction) {
  if (slotIdx < 0 || slotIdx >= NUM_SLOTS) return;
  uint8_t channel = PCA_DRAWER_CHANNELS[slotIdx];

  // SWAP DIRECTION ONLY FOR Rs.5 (slotIdx == 2)
  if (slotIdx == 2) {
    direction = -direction;
  }

  // Duration: 950ms for Rs.1 Small, Rs.2 Small, Rs.5 (reduced by 10° angle), 1300ms for others
  int moveDuration = (slotIdx == 0 || slotIdx == 1 || slotIdx == 2) ? 950 : 1300;

  if (direction > 0) {
    // Eject Drawer FORWARD
    int angle = INVERT_DRAWER_SERVOS ? 180 : 0;
    setServoAngle(channel, angle);
    delay(moveDuration);
    stopServoPwm(channel); // Turn off PWM completely
  } else if (direction < 0) {
    // Close Drawer BACKWARD
    int angle = INVERT_DRAWER_SERVOS ? 0 : 180;
    setServoAngle(channel, angle);
    delay(moveDuration);
    stopServoPwm(channel); // Turn off PWM completely
  } else {
    stopServoPwm(channel);
  }
}

void playCoinBeep() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(60);
  digitalWrite(BUZZER_PIN, LOW);
}

void playSlotFullAlarm() {
  digitalWrite(LED_GREEN_PIN, LOW);
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(150);
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }
}

void playSuccessBeep() {
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, HIGH);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(80);
  digitalWrite(BUZZER_PIN, LOW);
  delay(80);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(120);
  digitalWrite(BUZZER_PIN, LOW);
}

void updateLcdDisplay(const char* line1Text, const char* line2Text) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1Text);
  lcd.setCursor(0, 1);
  lcd.print(line2Text);
}

void updateLcdSlotOpen(int slotIdx) {
  char line1Buf[17];
  snprintf(line1Buf, sizeof(line1Buf), "%s Slot", COIN_TYPES[slotIdx]);
  updateLcdDisplay(line1Buf, "DRAWER OPEN!");
}

void refreshLcdDefaultScreen() {
  // Check if emergency stop is active
  if (emergencyStop) {
    updateLcdDisplay("EMERGENCY STOP!", "ALL MOTORS HALT");
    return;
  }

  // Check if any drawer is currently open
  int openSlotIdx = -1;
  for (int i = 0; i < NUM_SLOTS; i++) {
    if (drawerOpen[i]) {
      openSlotIdx = i;
      break;
    }
  }

  if (openSlotIdx >= 0) {
    updateLcdSlotOpen(openSlotIdx);
    return;
  }

  int totalCoins = 0;
  int totalValue = 0;
  for (int i = 0; i < NUM_SLOTS; i++) {
    totalCoins += slotCounts[i];
    totalValue += (slotCounts[i] * COIN_VALUES[i]);
  }

  char line1Buf[17];
  char line2Buf[17];
  snprintf(line1Buf, sizeof(line1Buf), "Total: Rs.%d", totalValue);
  snprintf(line2Buf, sizeof(line2Buf), "Coins: %d  RUN", totalCoins);

  updateLcdDisplay(line1Buf, line2Buf);
}

// ---------------------------------------------------------------------------------
// 5. TELEMETRY SNAPSHOT GENERATOR & WEBSOCKET BROADCAST
// ---------------------------------------------------------------------------------
String generateTelemetryJson(const char* eventType = NULL, const char* eventMsg = NULL, int slotIndex = -1) {
  StaticJsonDocument<1024> doc;

  // Device Info
  JsonObject device = doc.createNestedObject("device");
  device["deviceId"] = "coinflow-esp32-01";
  device["wifiConnected"] = (WiFi.status() == WL_CONNECTED);
  device["ipAddress"] = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  device["rssi"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -40;
  device["webSocketPort"] = 81;
  device["webSocketUrl"] = "ws://" + device["ipAddress"].as<String>() + ":81/";

  // Machine Info
  int totalCoins = 0;
  int totalVal = 0;
  bool anyFull = false;

  for (int i = 0; i < NUM_SLOTS; i++) {
    totalCoins += slotCounts[i];
    totalVal += (slotCounts[i] * COIN_VALUES[i]);
    if (slotCounts[i] >= MAX_LIMITS[i]) anyFull = true;
  }

  JsonObject machine = doc.createNestedObject("machine");
  machine["status"] = machineStatus;
  machine["feedEnabled"] = feedEnabled && !anyFull && !emergencyStop;
  machine["manualPause"] = manualPause;
  machine["emergencyStop"] = emergencyStop;
  machine["anySlotFull"] = anyFull;
  machine["totalCoins"] = totalCoins;
  machine["totalValue"] = totalVal;
  machine["feedSpeedMs"] = feedSpeedMs;
  machine["uptimeMs"] = millis();

  // Latest Event Info (if provided)
  if (eventType != NULL) {
    eventCounter++;
    JsonObject latestEvent = doc.createNestedObject("latestEvent");
    latestEvent["id"] = eventCounter;
    latestEvent["type"] = eventType;
    latestEvent["message"] = eventMsg;
    latestEvent["slotIndex"] = slotIndex;
    if (slotIndex >= 0 && slotIndex < NUM_SLOTS) {
      latestEvent["coinType"] = COIN_TYPES[slotIndex];
    }
  }

  // Slots Telemetry Array
  JsonArray slotsArr = doc.createNestedArray("slots");
  for (int i = 0; i < NUM_SLOTS; i++) {
    JsonObject slotObj = slotsArr.createNestedObject();
    slotObj["index"] = i;
    slotObj["id"] = SLOT_IDS[i];
    slotObj["name"] = COIN_TYPES[i];
    slotObj["coinValue"] = COIN_VALUES[i];
    slotObj["count"] = slotCounts[i];
    slotObj["maximumCount"] = MAX_LIMITS[i];
    slotObj["slotValue"] = slotCounts[i] * COIN_VALUES[i];
    
    int capPct = map(slotCounts[i], 0, MAX_LIMITS[i], 0, 100);
    slotObj["capacityPercentage"] = constrain(capPct, 0, 100);
    slotObj["full"] = (slotCounts[i] >= MAX_LIMITS[i]);
    slotObj["enabled"] = true;
    slotObj["sensorPin"] = IR_PINS[i];
    slotObj["sensorActive"] = (digitalRead(IR_PINS[i]) == LOW);
    slotObj["drawerState"] = drawerOpen[i] ? "open" : "closed";
    slotObj["servoChannel"] = PCA_DRAWER_CHANNELS[i];
  }

  String output;
  serializeJson(doc, output);
  return output;
}

void broadcastTelemetry(const char* eventType = NULL, const char* eventMsg = NULL, int slotIndex = -1) {
  String jsonPayload = generateTelemetryJson(eventType, eventMsg, slotIndex);
  webSocket.broadcastTXT(jsonPayload);
}

// ---------------------------------------------------------------------------------
// INDIVIDUAL SLOT DRAWER ACTIONS (EJECT, CLOSE, RESET TOGGLE)
// ---------------------------------------------------------------------------------

void executeSlotEject(int slotIdx) {
  if (emergencyStop) return; // Ignore if emergency stop is active
  if (slotIdx >= 0 && slotIdx < NUM_SLOTS) {
    drawerOpen[slotIdx] = true;
    updateLcdSlotOpen(slotIdx); // DISPLAY OPEN SLOT ON LCD!
    move360ServoDrawer(slotIdx, 1); // FORWARD
    playCoinBeep();
    String msgStr = String(COIN_TYPES[slotIdx]) + " drawer opened.";
    broadcastTelemetry("drawer_ejected", msgStr.c_str(), slotIdx);
  }
}

void executeSlotClose(int slotIdx) {
  if (emergencyStop) return;
  if (slotIdx >= 0 && slotIdx < NUM_SLOTS) {
    move360ServoDrawer(slotIdx, -1); // BACKWARD
    drawerOpen[slotIdx] = false;
    refreshLcdDefaultScreen(); // REFRESH LCD
    playCoinBeep();
    String msgStr = String(COIN_TYPES[slotIdx]) + " drawer closed.";
    broadcastTelemetry("drawer_closed", msgStr.c_str(), slotIdx);
  }
}

void executeSlotReset(int slotIdx) {
  if (emergencyStop) return;
  if (slotIdx >= 0 && slotIdx < NUM_SLOTS) {
    slotCounts[slotIdx] = 0; // Make count of that slot ZERO!
    
    if (!drawerOpen[slotIdx]) {
      // Currently CLOSED -> Open FORWARD
      drawerOpen[slotIdx] = true;
      updateLcdSlotOpen(slotIdx); // DISPLAY OPEN SLOT ON LCD!
      move360ServoDrawer(slotIdx, 1);
    } else {
      // Currently OPEN -> Close BACKWARD
      move360ServoDrawer(slotIdx, -1);
      drawerOpen[slotIdx] = false;
    }

    bool anyFull = false;
    for (int i = 0; i < NUM_SLOTS; i++) {
      if (slotCounts[i] >= MAX_LIMITS[i]) anyFull = true;
    }

    if (!anyFull && !manualPause && !emergencyStop) {
      machineStatus = "active";
      feedEnabled = true;
      digitalWrite(LED_RED_PIN, LOW);
      digitalWrite(LED_GREEN_PIN, HIGH);
    }

    playSuccessBeep();
    refreshLcdDefaultScreen(); // LCD display updates making count 0!
    String msgStr = String(COIN_TYPES[slotIdx]) + " reset to 0.";
    broadcastTelemetry("slot_reset_success", msgStr.c_str(), slotIdx);
  }
}

void executeResetAllSlots() {
  if (emergencyStop) return;
  for (int i = 0; i < NUM_SLOTS; i++) {
    slotCounts[i] = 0;
    if (drawerOpen[i]) {
      move360ServoDrawer(i, -1); // Close drawer BACKWARD
      drawerOpen[i] = false;
    }
  }
  machineStatus = "active";
  feedEnabled = true;
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, HIGH);
  playSuccessBeep();
  refreshLcdDefaultScreen();
  broadcastTelemetry("reset_all_slots", "All compartments reset.", -1);
}

// Helper to resolve slot index from JSON payload
int parseSlotIndexFromJson(StaticJsonDocument<500>& doc) {
  int slotIdx = -1;
  if (doc.containsKey("slotIndex")) {
    slotIdx = doc["slotIndex"].as<int>();
  } else if (doc.containsKey("slot")) {
    slotIdx = doc["slot"].as<int>();
  }
  
  if (slotIdx == -1 && doc.containsKey("slotId")) {
    const char* slotId = doc["slotId"];
    for (int i = 0; i < NUM_SLOTS; i++) {
      if (strcmp(SLOT_IDS[i], slotId) == 0) {
        slotIdx = i;
        break;
      }
    }
  }
  return slotIdx;
}

// ---------------------------------------------------------------------------------
// 6. WEBSOCKET EVENT HANDLER (INCOMING WEB APP COMMANDS)
// ---------------------------------------------------------------------------------
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[ESP32 WS] Client #%u Disconnected!\n", num);
      break;

    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[ESP32 WS] Client #%u Connected from %s\n", num, ip.toString().c_str());
      
      String currentStatus = generateTelemetryJson("client_connected", "Connected to ESP32 CoinFlow", -1);
      webSocket.sendTXT(num, currentStatus);
      break;
    }

    case WStype_TEXT: {
      String msg = String((char*)payload);
      
      if (msg == "ping") {
        webSocket.sendTXT(num, "pong");
        return;
      }
      if (msg == "get_status") {
        String snapshot = generateTelemetryJson();
        webSocket.sendTXT(num, snapshot);
        return;
      }

      StaticJsonDocument<500> doc;
      DeserializationError error = deserializeJson(doc, payload);
      if (error) return;

      const char* command = doc["command"];

      // STOP COIN FEEDER SERVO IMMEDIATELY
      if (command && (strcmp(command, "stop_feeder") == 0 || strcmp(command, "pause") == 0)) {
        feedEnabled = false;
        manualPause = true;
        setServoAngle(PCA_FEED_CHANNEL, 0); // Completely stop coin insertion motor!
        digitalWrite(LED_GREEN_PIN, LOW);
        digitalWrite(LED_RED_PIN, HIGH);
        broadcastTelemetry("feeder_stopped", "Coin feeder servo stopped.", -1);
      }
      // MANUAL OPEN DRAWER
      else if (command && strcmp(command, "eject_slot") == 0) {
        int slotIdx = parseSlotIndexFromJson(doc);
        executeSlotEject(slotIdx);
      }
      // MANUAL CLOSE DRAWER
      else if (command && strcmp(command, "close_slot") == 0) {
        int slotIdx = parseSlotIndexFromJson(doc);
        executeSlotClose(slotIdx);
      }
      // RESET SLOT COUNTER & TOGGLE DRAWER
      else if (command && strcmp(command, "reset_all_slots") == 0) {
        executeResetAllSlots();
      }
      else if (command && strcmp(command, "reset_slot") == 0) {
        int slotIdx = parseSlotIndexFromJson(doc);
        if (slotIdx >= 0 && slotIdx < NUM_SLOTS) {
          executeSlotReset(slotIdx);
        } else {
          executeResetAllSlots();
        }
      }
      // EMERGENCY STOP: HALT ALL ESP32 WORK IMMEDIATELY!
      else if (command && strcmp(command, "emergency_stop") == 0) {
        emergencyStop = true;
        feedEnabled = false;
        manualPause = true;
        machineStatus = "paused";
        
        setServoAngle(PCA_FEED_CHANNEL, 0); // Stop feeder servo
        for (int i = 0; i < NUM_SLOTS; i++) {
          stopServoPwm(PCA_DRAWER_CHANNELS[i]); // Turn off PWM on all 7 drawer servos
        }

        digitalWrite(LED_GREEN_PIN, LOW);
        digitalWrite(LED_RED_PIN, HIGH);
        updateLcdDisplay("EMERGENCY STOP!", "ALL MOTORS HALT");
        broadcastTelemetry("emergency_stop", "All ESP32 motor work halted.", -1);
      }
      // CONTINUE WORK: RESUME ESP32 WORK RIGHT WHERE IT STOPPED!
      else if (command && strcmp(command, "resume_machine") == 0) {
        emergencyStop = false;
        manualPause = false;
        feedEnabled = true;
        machineStatus = "active";
        digitalWrite(LED_RED_PIN, LOW);
        digitalWrite(LED_GREEN_PIN, HIGH);
        playSuccessBeep();
        refreshLcdDefaultScreen(); // Restores LCD & resumes feeder loop where it stopped!
        broadcastTelemetry("resume_machine", "Machine resumed work where it stopped.", -1);
      }
      else if (command && strcmp(command, "set_feed_speed") == 0) {
        int speedVal = doc["speed"] | doc["val"] | 700;
        if (speedVal >= 150 && speedVal <= 3000) {
          feedSpeedMs = speedVal;
          char msgBuf[64];
          snprintf(msgBuf, sizeof(msgBuf), "Coin Feed Speed set to %d ms", feedSpeedMs);
          broadcastTelemetry("feed_speed_updated", msgBuf, -1);
        }
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------------
// 7. HTTP REST API HANDLERS
// ---------------------------------------------------------------------------------
void handleHttpStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", generateTelemetryJson());
}

void handleHttpControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String action = server.arg("action");
  int slotIdx = server.arg("slot").toInt();

  if (action == "stop_feeder" || action == "pause") {
    feedEnabled = false;
    manualPause = true;
    setServoAngle(PCA_FEED_CHANNEL, 0);
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(LED_RED_PIN, HIGH);
    broadcastTelemetry("feeder_stopped", "Coin feeder servo stopped.", -1);
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Feeder Stopped\"}");
  }
  else if (action == "eject") {
    executeSlotEject(slotIdx);
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Drawer Ejected\"}");
  }
  else if (action == "close") {
    executeSlotClose(slotIdx);
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Drawer Closed\"}");
  }
  else if (action == "resume") {
    emergencyStop = false;
    manualPause = false;
    feedEnabled = true;
    machineStatus = "active";
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_GREEN_PIN, HIGH);
    playSuccessBeep();
    refreshLcdDefaultScreen();
    broadcastTelemetry("resume_machine", "Machine resumed work where it stopped.", -1);
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Resumed Work\"}");
  } 
  else if (action == "emergency_stop") {
    emergencyStop = true;
    feedEnabled = false;
    manualPause = true;
    machineStatus = "paused";
    setServoAngle(PCA_FEED_CHANNEL, 0);
    for (int i = 0; i < NUM_SLOTS; i++) {
      stopServoPwm(PCA_DRAWER_CHANNELS[i]);
    }
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(LED_RED_PIN, HIGH);
    updateLcdDisplay("EMERGENCY STOP!", "ALL MOTORS HALT");
    broadcastTelemetry("emergency_stop", "All ESP32 motor work halted.", -1);
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Emergency Stop Activated\"}");
  } 
  else if (action == "speed") {
    int val = server.arg("val").toInt();
    if (val >= 150 && val <= 3000) {
      feedSpeedMs = val;
      char msgBuf[64];
      snprintf(msgBuf, sizeof(msgBuf), "Coin Feed Speed set to %d ms", feedSpeedMs);
      broadcastTelemetry("feed_speed_updated", msgBuf, -1);
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Speed Updated\"}");
    } else {
      server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid Speed Value\"}");
    }
  } 
  else {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Unknown Action\"}");
  }
}

void handleHttpReset() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  int slotIdx = -1;
  if (server.hasArg("slot")) {
    String slotArg = server.arg("slot");
    if (slotArg.startsWith("slot_")) {
      for (int i = 0; i < NUM_SLOTS; i++) {
        if (slotArg == SLOT_IDS[i]) { slotIdx = i; break; }
      }
    } else {
      slotIdx = slotArg.toInt();
    }
  } else if (server.hasArg("slotIndex")) {
    slotIdx = server.arg("slotIndex").toInt();
  }

  if (slotIdx >= 0 && slotIdx < NUM_SLOTS) {
    executeSlotReset(slotIdx);
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Slot Reset Toggled\"}");
  } else {
    executeResetAllSlots();
    server.send(200, "application/json", "{\"success\":true,\"message\":\"All Slots Reset\"}");
  }
}

void handleHttpSimulateCoin() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  int slotIdx = server.arg("slot").toInt();

  if (slotIdx >= 0 && slotIdx < NUM_SLOTS) {
    slotCounts[slotIdx]++;
    String msgStr = String(COIN_TYPES[slotIdx]) + " coin inserted.";

    if (slotCounts[slotIdx] >= MAX_LIMITS[slotIdx]) {
      machineStatus = "slot_full";
      feedEnabled = false;
      setServoAngle(PCA_FEED_CHANNEL, 0); // Stop feed motor
      
      playSlotFullAlarm();
      
      // EJECT ONLY THAT PARTICULAR 360° DRAWER SERVO FORWARD
      executeSlotEject(slotIdx);

      broadcastTelemetry("slot_full", (String(COIN_TYPES[slotIdx]) + " slot reached maximum capacity.").c_str(), slotIdx);
    } else {
      playCoinBeep();
      broadcastTelemetry("coin_detected", msgStr.c_str(), slotIdx);
    }

    refreshLcdDefaultScreen();
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Coin Simulated\"}");
  } else {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid Slot Index\"}");
  }
}

// ---------------------------------------------------------------------------------
// 8. SETUP FUNCTION
// ---------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println("🚀 CoinFlow ESP32 Smart Coin Sorting & Dispensing System");
  Serial.println("=======================================================");

  // Initialize I2C Bus on GPIO 21 (SDA) and GPIO 22 (SCL)
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  // Initialize PCA9685 PWM Servo Driver (50Hz standard servo frequency)
  pwm.begin();
  pwm.setPWMFreq(50);

  // Set initial feed motor position
  setServoAngle(PCA_FEED_CHANNEL, 0);

  // CRITICAL FIX: TURN OFF PWM SIGNAL ON ALL DRAWER SERVOS AT BOOTUP SO THEY NEVER MOVE!
  for (int i = 0; i < NUM_SLOTS; i++) {
    stopServoPwm(PCA_DRAWER_CHANNELS[i]);
  }

  // Initialize 16x2 I2C LCD Display
  lcd.init();
  lcd.backlight();
  updateLcdDisplay("CoinFlow Sorter", "Connecting Wi-Fi");

  // Initialize LED & Buzzer Pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);

  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);

  // Initialize Optical IR Sensor Pins with internal pullups & initial state snapshot
  for (int i = 0; i < NUM_SLOTS; i++) {
    pinMode(IR_PINS[i], INPUT_PULLUP);
    lastIrState[i] = digitalRead(IR_PINS[i]);
  }

  // Wi-Fi Connection Setup
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  WiFi.setSleep(false); // High performance WiFi radio mode

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) { // Extended 20-second connection window
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    playSuccessBeep();
    digitalWrite(LED_GREEN_PIN, HIGH);

    Serial.println("\n✅ Connected to Wi-Fi!");
    Serial.print("📡 ESP32 IP Address: ");
    Serial.println(WiFi.localIP());

    String ipStr = WiFi.localIP().toString();
    updateLcdDisplay("CoinFlow Online", ipStr.c_str());
    delay(2000);
    refreshLcdDefaultScreen();
  } else {
    Serial.printf("\n⚠️ Wi-Fi Connection Timeout (Status Code: %d)! Launching SoftAP Hotspot...\n", WiFi.status());
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP(AP_SSID, AP_PASSWORD);

    Serial.print("📶 Fallback SoftAP IP: ");
    Serial.println(WiFi.softAPIP());
    updateLcdDisplay("Hotspot Mode", "192.168.4.1");
    delay(2000);
    refreshLcdDefaultScreen();
  }

  // HTTP REST API Route Handlers
  server.on("/api/status", HTTP_GET, handleHttpStatus);
  server.on("/api/control", HTTP_POST, handleHttpControl);
  server.on("/api/reset", HTTP_POST, handleHttpReset);
  server.on("/api/simulate/coin", HTTP_POST, handleHttpSimulateCoin);
  server.begin();
  Serial.println("✅ HTTP Server Started on Port 80");

  // WebSocket Server Setup
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("✅ WebSocket Server Started on Port 81");
}

// ---------------------------------------------------------------------------------
// 9. MAIN LOOP (HARDWARE SENSOR READINGS, FEED MOTOR & EVENT BROADCASTING)
// ---------------------------------------------------------------------------------
void loop() {
  server.handleClient();
  webSocket.loop();

  // Check if any slot is full
  bool anySlotIsFull = false;
  for (int i = 0; i < NUM_SLOTS; i++) {
    if (slotCounts[i] >= MAX_LIMITS[i]) {
      anySlotIsFull = true;
      break;
    }
  }

  // 1. COIN INSERTION MOTOR LOOP (SG90 4cm PUSH-PULL OSCILLATION LOOP)
  // Runs continuously ONLY when machine is active, not in emergency stop, and NO slot is full!
  if (feedEnabled && !manualPause && !emergencyStop && !anySlotIsFull) {
    if (millis() - lastFeedMotorTime > feedSpeedMs) { // Sweeps back & forth using manually set speed (ms)
      lastFeedMotorTime = millis();
      feedMotorPositionHigh = !feedMotorPositionHigh;
      
      // Sweep angle between 0° and 60° (approximates 4 cm tray feed movement)
      setServoAngle(PCA_FEED_CHANNEL, feedMotorPositionHigh ? 60 : 0);
    }
    digitalWrite(LED_GREEN_PIN, HIGH);
  } else {
    // STOP Coin Insertion Feed Motor when paused, stopped, or any slot is full
    setServoAngle(PCA_FEED_CHANNEL, 0);
  }

  // 2. ALARM INDICATOR BLINKING LOOP WHEN A SLOT IS FULL OR EMERGENCY STOP
  if (anySlotIsFull || emergencyStop) {
    digitalWrite(LED_GREEN_PIN, LOW);
    if (millis() - lastAlarmBlinkTime > 500) { // Blink Red LED every 500ms
      lastAlarmBlinkTime = millis();
      alarmLedState = !alarmLedState;
      digitalWrite(LED_RED_PIN, alarmLedState ? HIGH : LOW);
    }
  }

  // 3. READ 7 OPTICAL IR SENSORS (EXACT 10 COINS LIMIT PER SLOT)
  if (feedEnabled && !manualPause && !emergencyStop && !anySlotIsFull) {
    for (int i = 0; i < NUM_SLOTS; i++) {
      int currentState = digitalRead(IR_PINS[i]);

      // Detect transition from HIGH -> LOW (Falling edge trigger)
      if (currentState == LOW && lastIrState[i] == HIGH) {
        if (millis() - lastSensorReadTime[i] > 350) { // 350ms Debounce
          lastSensorReadTime[i] = millis();

          slotCounts[i]++;
          Serial.printf("🪙 Coin Detected in Slot #%d (%s, Value: Rs.%d)! Total: %d/10\n",
                        i, COIN_TYPES[i], COIN_VALUES[i], slotCounts[i]);

          String coinMsgStr = String(COIN_TYPES[i]) + " coin inserted.";

          // CHECK IF SLOT REACHED EXACT 10 COINS CAPACITY
          if (slotCounts[i] >= MAX_LIMITS[i]) {
            machineStatus = "slot_full";
            feedEnabled = false;
            setServoAngle(PCA_FEED_CHANNEL, 0); // Stop feed motor immediately!

            playSlotFullAlarm();
            
            // EJECT ONLY THAT PARTICULAR 360° DRAWER SERVO FORWARD
            executeSlotEject(i);

            broadcastTelemetry("slot_full", (String(COIN_TYPES[i]) + " slot reached maximum capacity.").c_str(), i);
          } else {
            playCoinBeep(); // Short coin beep
            
            char line1Buf[17];
            char line2Buf[17];
            snprintf(line1Buf, sizeof(line1Buf), "+ %s", COIN_TYPES[i]);
            int totalVal = 0;
            for (int k = 0; k < NUM_SLOTS; k++) totalVal += (slotCounts[k] * COIN_VALUES[k]);
            snprintf(line2Buf, sizeof(line2Buf), "Total: Rs.%d", totalVal);
            updateLcdDisplay(line1Buf, line2Buf);

            broadcastTelemetry("coin_detected", coinMsgStr.c_str(), i);
          }
        }
      }
      lastIrState[i] = currentState;
    }
  }

  // Periodic Telemetry Sync Broadcast every 30 seconds
  if (millis() - lastBroadcastTime > 30000) {
    lastBroadcastTime = millis();
    broadcastTelemetry();
  }
}
