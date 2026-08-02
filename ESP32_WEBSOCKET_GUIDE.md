# ESP32 Native WebSocket & HTTP REST Integration Guide for CoinFlow

This guide details the complete protocol specification for connecting the **CoinFlow Smart Coin Sorting Web Application** to your ESP32 hardware using native browser WebSockets and HTTP REST API control.

---

## 🔌 1. Connection Architecture

* **WebSocket Protocol**: Native Browser WebSocket (`ws://ESP32_IP:81/`)
* **WebSocket Server**: `WebSocketsServer webSocket(81);` (Port `81`)
* **HTTP REST API**: Server running on Port `80` (`http://ESP32_IP/api/...`)
* **Network Requirement**: ESP32 and Computer/Phone must be on the same Wi-Fi network (e.g. `Aathif's Galaxy J6`)

---

## 📡 2. Complete ESP32 WebSocket Status Payload Schema

The ESP32 periodically or event-driven broadcasts the full telemetry snapshot JSON object over WebSocket:

```json
{
  "device": {
    "deviceId": "coinflow-esp32-01",
    "wifiConnected": true,
    "ipAddress": "192.168.43.120",
    "rssi": -52,
    "webSocketPort": 81,
    "webSocketUrl": "ws://192.168.43.120:81/"
  },
  "machine": {
    "status": "active",
    "feedEnabled": true,
    "manualPause": false,
    "emergencyStop": false,
    "anySlotFull": false,
    "totalCoins": 14,
    "totalValue": 53,
    "uptimeMs": 45000
  },
  "latestEvent": {
    "id": 15,
    "type": "coin_detected",
    "message": "Rs.2 Big coin inserted",
    "slotIndex": 6,
    "coinType": "Rs.2 Big"
  },
  "slots": [
    {
      "index": 0,
      "id": "slot_1",
      "name": "Rs.1 Small",
      "coinValue": 1,
      "count": 4,
      "maximumCount": 10,
      "slotValue": 4,
      "capacityPercentage": 40,
      "full": false,
      "enabled": true,
      "sensorPin": 14,
      "sensorActive": false,
      "drawerState": "closed",
      "servoChannel": 1
    }
  ]
}
```

---

## 🌐 3. HTTP REST API Control Endpoints

The web application dispatches machine control commands via HTTP POST requests:

### A. Pre-flight Status Check
* **Method**: `GET`
* **URL**: `http://ESP32_IP/api/status`
* **Description**: Verifies HTTP reachability before attempting WebSocket connection.

### B. Machine Control (Pause / Resume / Emergency Stop)
* **Method**: `POST`
* **Pause URL**: `http://ESP32_IP/api/control?action=pause`
* **Resume URL**: `http://ESP32_IP/api/control?action=resume`
* **Emergency Stop URL**: `http://ESP32_IP/api/control?action=emergency_stop`

### C. Reset Slot Counter
* **Method**: `POST`
* **URL**: `http://ESP32_IP/api/reset?slot=5`

### D. Coin Insertion Simulation
* **Method**: `POST`
* **URL**: `http://ESP32_IP/api/simulate/coin?slot=0`

---

## ⚡ 4. Heartbeat Protocol

* The web application sends string `"ping"` over WebSocket every 15 seconds.
* The ESP32 responds with `"pong"` or `{"type": "pong"}` to keep the connection alive.
