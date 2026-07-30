// ESP32 WebSocket Real-Time Communication Manager

let ws = null;
let reconnectTimer = null;
let listeners = [];

export function connectWebSocket(url = 'ws://192.168.1.104:81', onStateChange, onEvent) {
  if (typeof window === 'undefined') return;

  if (ws) {
    try {
      ws.close();
    } catch (e) {
      // ignore
    }
  }

  try {
    if (onStateChange) onStateChange('connecting');
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('✅ WebSocket Connected to ESP32:', url);
      if (onStateChange) onStateChange('connected');
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onEvent) onEvent(data);
        listeners.forEach((fn) => fn(data));
      } catch (err) {
        console.error('WebSocket payload parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('⚠️ WebSocket Error:', err);
      if (onStateChange) onStateChange('error');
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket Closed. Attempting reconnect in 5s...');
      if (onStateChange) onStateChange('disconnected');
      reconnectTimer = setTimeout(() => {
        connectWebSocket(url, onStateChange, onEvent);
      }, 5000);
    };
  } catch (err) {
    console.error('Failed to initiate WebSocket connection:', err);
    if (onStateChange) onStateChange('disconnected');
  }
}

export function sendWebSocketCommand(commandData) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(commandData));
    return true;
  } else {
    console.warn('Cannot send WebSocket command: ESP32 WebSocket disconnected');
    return false;
  }
}

export function disconnectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
}
