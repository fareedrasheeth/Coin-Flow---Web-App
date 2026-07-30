# ESP32 WebSocket Protocol Integration Guide for CoinFlow

This guide provides the complete WebSocket JSON protocol specification and copy-pasteable Arduino C++ code for your ESP32 coin sorting hardware.

---

## 1. Outgoing WebSocket Messages (ESP32 ➔ Web Application)

Send JSON string messages from the ESP32 over WebSocket port `81` whenever coins are detected or status changes occur.

### A. Coin Detection Event
Send this when an optical IR sensor detects a coin falling through a sorting hole:

```json
{
  "event": "coin_detected",
  "slotId": "slot_5",
  "coinType": "Rs.10",
  "coinValue": 10
}
```

### B. Slot Full Warning Event (100% Capacity)
Send this when a storage compartment reaches its limit:

```json
{
  "event": "slot_full",
  "slotId": "slot_5",
  "coinType": "Rs.10"
}
```

### C. Telemetry Sync Snapshot
Send this on client connection or periodically to sync status:

```json
{
  "event": "telemetry_sync",
  "status": "active",
  "coinEntryEnabled": true
}
```

---

## 2. Incoming WebSocket Commands (Web Application ➔ ESP32)

Your ESP32 receives JSON commands sent from the web application user interface:

### A. Reset Compartment Slot Command
Sent when the user clicks "Confirm Reset" for a full slot:

```json
{
  "command": "reset_slot",
  "slotId": "slot_5",
  "gpioServo": "GPIO 19",
  "timestamp": "2026-07-30T23:20:00Z"
}
```
* **ESP32 Action**: Set slot count to 0, move the compartment servo back to 0° (home position), and re-enable main coin entry servo.

### B. Emergency Stop Command
Sent when the user clicks the "EMERGENCY STOP" button:

```json
{
  "command": "emergency_stop",
  "timestamp": "2026-07-30T23:20:00Z"
}
```
* **ESP32 Action**: Set main coin entry servo to closed position (blocking new coin insertion) and pause sorting.

### C. Start / Resume Machine Command
Sent when the user clicks "Start / Resume Machine":

```json
{
  "command": "resume_machine",
  "timestamp": "2026-07-30T23:20:00Z"
}
```
* **ESP32 Action**: Re-enable main entry servo and set machine status to `active`.

---

## 3. Sample ESP32 Arduino Code Snippet (`ESP32_CoinFlow_WebSocket.ino`)

Copy and flash this code to your ESP32 using Arduino IDE (Requires `WebSockets` by Markus Sattler and `ArduinoJson` libraries):

```cpp
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

WebSocketsServer webSocket = WebSocketsServer(81);

// Servo motors setup
Servo servoEntry;
Servo servoRs10;
// Add other servos...

// IR Sensor Pins
const int IR_RS10_PIN = 25;
// Add other IR pins...

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    StaticJsonDocument<500> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      const char* command = doc["command"];
      
      if (strcmp(command, "reset_slot") == 0) {
        const char* slotId = doc["slotId"];
        Serial.printf("Resetting slot %s\n", slotId);
        // Move compartment servo back to 0 degrees home position
        servoRs10.write(0);
        
        // Notify web app reset success
        StaticJsonDocument<200> response;
        response["event"] = "slot_reset_success";
        response["slotId"] = slotId;
        String output;
        serializeJson(response, output);
        webSocket.broadcastTXT(output);
      } 
      else if (strcmp(command, "emergency_stop") == 0) {
        Serial.println("Emergency Stop received!");
        servoEntry.write(90); // Block coin entry
      }
      else if (strcmp(command, "resume_machine") == 0) {
        Serial.println("Resume Machine received!");
        servoEntry.write(0); // Allow coin entry
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("ESP32 WebSocket IP: ws://");
  Serial.print(WiFi.localIP());
  Serial.println(":81");

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  pinMode(IR_RS10_PIN, INPUT);
  servoEntry.attach(4);
  servoRs10.attach(19);
  servoEntry.write(0); // Open
  servoRs10.write(0);  // Home
}

void loop() {
  webSocket.loop();

  // Sample coin detection reading for Rs.10 slot
  if (digitalRead(IR_RS10_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(IR_RS10_PIN) == LOW) {
      StaticJsonDocument<200> doc;
      doc["event"] = "coin_detected";
      doc["slotId"] = "slot_5";
      doc["coinType"] = "Rs.10";
      doc["coinValue"] = 10;
      
      String output;
      serializeJson(doc, output);
      webSocket.broadcastTXT(output);
      delay(300); // Prevent double detection
    }
  }
}
```
