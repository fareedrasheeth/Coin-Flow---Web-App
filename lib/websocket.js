// Backward compatibility re-export wrapper for ESP32 WebSocket service
import {
  connectESP32,
  disconnectESP32,
  sendESP32Command,
  sanitizeIpAddress,
  getStoredIp,
  setStoredIp,
} from './esp32WebSocket';

export function normalizeWsUrl(url) {
  const ip = sanitizeIpAddress(url);
  return `ws://${ip}:81/`;
}

export function connectWebSocket(url = 'ws://192.168.43.120:81/', onStateChange, onEvent) {
  const ip = sanitizeIpAddress(url);
  return connectESP32({
    ipAddress: ip,
    onStatusChange: onStateChange,
    onData: onEvent,
  });
}

export function sendWebSocketCommand(commandData) {
  return sendESP32Command(commandData);
}

export function disconnectWebSocket() {
  return disconnectESP32();
}

export {
  connectESP32,
  disconnectESP32,
  sendESP32Command,
  sanitizeIpAddress,
  getStoredIp,
  setStoredIp,
};
