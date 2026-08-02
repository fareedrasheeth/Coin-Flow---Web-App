// Reusable Native Browser WebSocket & REST Control Service for ESP32 CoinFlow Hardware

let socket = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let manuallyDisconnected = false;
let reconnectAttempts = 0;
let lastProcessedEventId = null;

// Diagnostics snapshot store
let diagnosticsData = {
  esp32Ip: '192.168.43.120',
  websocketUrl: 'ws://192.168.43.120:81/',
  readyState: -1, // -1: NONE, 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
  readyStateLabel: 'UNINITIALIZED',
  status: 'disconnected',
  reconnectAttempts: 0,
  lastError: null,
  lastCloseCode: null,
  lastCloseReason: null,
  lastRawMessage: null,
  lastParsedJson: null,
  messagesReceivedCount: 0,
  lastConnectedTime: null,
  lastMessageTime: null,
  lastPingTime: null,
  lastPongTime: null,
  httpAvailable: null, // true | false | null
  httpsWarning: false,
  wifiSignal: -50,
};

let statusChangeCallback = null;
let dataCallback = null;
let errorCallback = null;
let diagnosticsCallback = null;

/**
 * Sanitizes input IP address to a clean IPv4 string.
 */
export function sanitizeIpAddress(rawIp) {
  if (!rawIp) return '192.168.43.120';
  let cleaned = rawIp.trim();
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.replace(/^wss?:\/\//i, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split(':')[0];
  return cleaned || '192.168.43.120';
}

/**
 * Gets saved ESP32 IP address from localStorage safely.
 */
export function getStoredIp() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('coinflow_esp32_ip');
    if (saved) return sanitizeIpAddress(saved);
  }
  return '192.168.43.120';
}

/**
 * Saves ESP32 IP address to localStorage safely.
 */
export function setStoredIp(ip) {
  const cleanIp = sanitizeIpAddress(ip);
  if (typeof window !== 'undefined') {
    localStorage.setItem('coinflow_esp32_ip', cleanIp);
  }
  return cleanIp;
}

/**
 * Maps WebSocket readyState integer to human readable string label.
 */
export function getReadyStateLabel(state) {
  switch (state) {
    case 0:
      return '0 - CONNECTING';
    case 1:
      return '1 - OPEN';
    case 2:
      return '2 - CLOSING';
    case 3:
      return '3 - CLOSED';
    default:
      return '-1 - UNINITIALIZED';
  }
}

/**
 * Updates diagnostic state and invokes diagnostic callback if subscribed.
 */
function updateDiagnostics(patch) {
  diagnosticsData = {
    ...diagnosticsData,
    ...patch,
    readyStateLabel: getReadyStateLabel(
      patch.readyState !== undefined ? patch.readyState : socket ? socket.readyState : -1
    ),
  };
  if (diagnosticsCallback) {
    diagnosticsCallback({ ...diagnosticsData });
  }
}

export function getDiagnosticsSnapshot() {
  return {
    ...diagnosticsData,
    readyState: socket ? socket.readyState : -1,
    readyStateLabel: getReadyStateLabel(socket ? socket.readyState : -1),
  };
}

/**
 * Performs pre-flight HTTP ping test to GET http://ESP32_IP/api/status
 */
export async function checkESP32HttpReachability(ipAddress) {
  const cleanIp = sanitizeIpAddress(ipAddress);
  const url = `http://${cleanIp}/api/status`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json().catch(() => ({}));
      updateDiagnostics({ httpAvailable: true });
      return { reachable: true, data: json };
    } else {
      updateDiagnostics({ httpAvailable: false });
      return { reachable: false, status: response.status, message: `HTTP ${response.status}` };
    }
  } catch (err) {
    updateDiagnostics({ httpAvailable: false });
    return { reachable: false, message: err.name === 'AbortError' ? 'HTTP Request Timeout' : err.message };
  }
}

/**
 * Initiates native browser WebSocket connection to ws://ESP32_IP:81/
 */
export function connectESP32({ ipAddress, onStatusChange, onData, onError, onDiagnosticsChange }) {
  if (typeof window === 'undefined') return;

  const cleanIp = sanitizeIpAddress(ipAddress);
  const url = `ws://${cleanIp}:81/`;

  if (onStatusChange) statusChangeCallback = onStatusChange;
  if (onData) dataCallback = onData;
  if (onError) errorCallback = onError;
  if (onDiagnosticsChange) diagnosticsCallback = onDiagnosticsChange;

  // Single connection guard: Prevent duplicate sockets
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    console.log('[ESP32 WS] Connection attempt ignored: Active WebSocket session already exists.');
    return;
  }

  manuallyDisconnected = false;

  const isHttps = window.location.protocol === 'https:';
  updateDiagnostics({
    esp32Ip: cleanIp,
    websocketUrl: url,
    httpsWarning: isHttps,
    status: 'connecting',
    readyState: 0,
  });

  if (isHttps) {
    console.warn(
      '[ESP32 WS] WARNING: Application running on HTTPS. Browsers block unencrypted ws:// connections from secure pages.'
    );
  }

  console.log(`[ESP32 WS] Connecting to ${url}`);
  statusChangeCallback?.('connecting');

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      reconnectAttempts = 0;
      const nowStr = new Date().toLocaleTimeString();

      console.log('[ESP32 WS] Connected');
      statusChangeCallback?.('connected');

      updateDiagnostics({
        status: 'connected',
        readyState: 1,
        reconnectAttempts: 0,
        lastConnectedTime: nowStr,
        lastError: null,
      });

      // Send immediate status command on open
      try {
        socket.send('get_status');
      } catch (err) {
        // ignore send error
      }

      // Heartbeat ping interval every 15 seconds
      clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          try {
            socket.send('ping');
            updateDiagnostics({ lastPingTime: new Date().toLocaleTimeString() });
          } catch (e) {
            // ignore heartbeat errors
          }
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      updateDiagnostics({
        lastRawMessage: event.data,
        lastMessageTime: new Date().toLocaleTimeString(),
        messagesReceivedCount: diagnosticsData.messagesReceivedCount + 1,
      });

      // Handle heartbeat pong response
      if (event.data === 'pong') {
        updateDiagnostics({ lastPongTime: new Date().toLocaleTimeString() });
        return;
      }

      try {
        const data = JSON.parse(event.data);

        if (data.type === 'pong' || data.event === 'pong') {
          updateDiagnostics({ lastPongTime: new Date().toLocaleTimeString() });
          return;
        }

        console.log('[ESP32 WS] Message received');
        updateDiagnostics({ lastParsedJson: data });

        // Event deduplication check
        if (data.latestEvent && data.latestEvent.id) {
          if (data.latestEvent.id === lastProcessedEventId) {
            data._duplicateEvent = true;
          } else {
            lastProcessedEventId = data.latestEvent.id;
            data._duplicateEvent = false;
          }
        }

        dataCallback?.(data);
      } catch (error) {
        console.error('[ESP32 WS] Invalid JSON:', event.data);
      }
    };

    socket.onerror = (error) => {
      const errMsg = `WebSocket connection failed to ${url}. ESP32 may be offline or unreachable.`;
      console.warn(`[ESP32 WS] Error: ${errMsg}`);
      statusChangeCallback?.('error');
      errorCallback?.(errMsg);

      updateDiagnostics({
        status: 'error',
        readyState: socket ? socket.readyState : 3,
        lastError: errMsg,
      });
    };

    socket.onclose = (event) => {
      clearInterval(heartbeatTimer);
      const closeCode = event.code;
      const closeReason = event.reason || 'Connection closed';

      console.log(`[ESP32 WS] Closed: code=${closeCode} reason=${closeReason}`);
      socket = null;

      updateDiagnostics({
        readyState: 3,
        lastCloseCode: closeCode,
        lastCloseReason: closeReason,
      });

      if (manuallyDisconnected) {
        statusChangeCallback?.('disconnected');
        updateDiagnostics({ status: 'disconnected' });
        return;
      }

      statusChangeCallback?.('reconnecting');
      updateDiagnostics({ status: 'reconnecting' });

      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);

      console.log(`[ESP32 WS] Reconnecting in ${delay} ms`);

      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        connectESP32({
          ipAddress: cleanIp,
          onStatusChange,
          onData,
          onError,
          onDiagnosticsChange,
        });
      }, delay);
    };
  } catch (err) {
    console.error('[ESP32 WS] Failed to instantiate WebSocket:', err);
    statusChangeCallback?.('error');
    errorCallback?.(err);

    updateDiagnostics({
      status: 'error',
      readyState: 3,
      lastError: err.message,
    });
  }
}

/**
 * Manually disconnects the WebSocket and halts automatic retries.
 */
export function disconnectESP32() {
  manuallyDisconnected = true;

  clearTimeout(reconnectTimer);
  clearInterval(heartbeatTimer);

  if (socket) {
    try {
      socket.close(1000, 'User initiated disconnect');
    } catch (e) {
      // ignore
    }
    socket = null;
  }

  statusChangeCallback?.('disconnected');
  updateDiagnostics({
    status: 'disconnected',
    readyState: 3,
    readyStateLabel: getReadyStateLabel(3),
  });
}

/**
 * Sends a WebSocket command payload to ESP32.
 */
export function sendESP32Command(commandData) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const payload = typeof commandData === 'string' ? commandData : JSON.stringify(commandData);
    socket.send(payload);
    return true;
  } else {
    console.warn('[ESP32 WS] Cannot send command: WebSocket is not in OPEN state.');
    return false;
  }
}

/**
 * HTTP REST Control helper for pause, resume, emergency_stop, reset, and coin simulation.
 */
export async function sendESP32RestControl(ipAddress, actionType, params = {}) {
  const cleanIp = sanitizeIpAddress(ipAddress);
  let url = `http://${cleanIp}/api/control?action=${actionType}`;

  if (actionType === 'reset') {
    url = `http://${cleanIp}/api/reset?slot=${params.slotIndex ?? 0}`;
  } else if (actionType === 'simulate') {
    url = `http://${cleanIp}/api/simulate/coin?slot=${params.slotIndex ?? 0}`;
  } else if (actionType === 'eject' || actionType === 'close') {
    url = `http://${cleanIp}/api/control?action=${actionType}&slot=${params.slotIndex ?? 0}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Server error');
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json().catch(() => ({ success: true }));
    return { success: true, data };
  } catch (err) {
    console.warn(`[ESP32 REST] HTTP control endpoint '${actionType}' failed:`, err.message);
    return { success: false, error: err.message };
  }
}
