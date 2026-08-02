'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SRI_LANKAN_COINS, ALL_SENSORS, ALL_SERVOS } from '@/lib/constants';
import {
  connectESP32,
  disconnectESP32,
  sendESP32Command,
  sendESP32RestControl,
  checkESP32HttpReachability,
  sanitizeIpAddress,
  getStoredIp,
  setStoredIp,
  getDiagnosticsSnapshot,
} from '@/lib/esp32WebSocket';

const CoinFlowContext = createContext(null);

export function CoinFlowProvider({ children }) {
  // --- ESP32 IP & WebSocket Connection State ---
  const [esp32Ip, setEsp32IpState] = useState('192.168.43.120');
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  const [espConnected, setEspConnected] = useState(false);
  const [machineState, setMachineState] = useState('active');
  const [coinEntryEnabled, setCoinEntryEnabled] = useState(true);
  const [wifiSignal, setWifiSignal] = useState(92);
  const [httpReachable, setHttpReachable] = useState(null); // null | true | false
  const [diagnostics, setDiagnostics] = useState(() => getDiagnosticsSnapshot());

  const websocketUrl = `ws://${esp32Ip}:81/`;
  const apiBaseUrl = `http://${esp32Ip}`;

  const lastProcessedEventIdRef = useRef(null);

  // Load stored IP on initial client mount safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = getStoredIp();
      setEsp32IpState(stored);
    }
  }, []);

  const setEsp32Ip = useCallback((rawIp) => {
    const clean = sanitizeIpAddress(rawIp);
    setEsp32IpState(clean);
    setStoredIp(clean);
  }, []);

  // --- Theme State ---
  const [theme, setTheme] = useState('dark');

  const handleSetTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('coinflow_theme', newTheme);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('coinflow_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        handleSetTheme(savedTheme);
      } else {
        handleSetTheme('dark');
      }
    }
  }, [handleSetTheme]);

  // --- Voice Announcement Engine ---
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  // --- 7 Coin Slots State ---
  const [slots, setSlots] = useState(() =>
    SRI_LANKAN_COINS.map((c) => ({
      ...c,
      count: 0,
      totalValue: 0,
      limitType: c.defaultLimitType,
      maximumLimit: c.defaultLimit,
      capacityPercentage: 0,
      status: 'available',
      sensorStatus: 'active',
      servoStatus: 'ready',
      servoAngle: 0,
      lastDetectedAt: null,
    }))
  );

  const totalCoins = slots.reduce((acc, s) => acc + s.count, 0);
  const totalValue = slots.reduce((acc, s) => acc + s.totalValue, 0);

  // --- Latest Coin Card State ---
  const [latestCoin, setLatestCoin] = useState({
    type: 'None',
    value: 0,
    slotId: null,
    label: 'Awaiting Coin Insertion',
    detectedAt: null,
    slotCount: 0,
    slotValue: 0,
  });

  const [activeToast, setActiveToast] = useState(null);
  const [fullSlotModal, setFullSlotModal] = useState({ isOpen: false, slot: null });
  const [resetConfirmModal, setResetConfirmModal] = useState({ isOpen: false, slot: null });
  const [emergencyModal, setEmergencyModal] = useState(false);

  // --- SG90 Coin Insertion Motor Speed (ms interval) ---
  const [feedSpeedMs, setFeedSpeedMs] = useState(700);

  const handleSetFeedSpeed = useCallback(
    (speed) => {
      const validSpeed = Math.max(150, Math.min(3000, Number(speed)));
      setFeedSpeedMs(validSpeed);

      // Send WebSocket command to ESP32
      sendESP32Command({ command: 'set_feed_speed', speed: validSpeed });

      // Send HTTP REST fallback command
      if (esp32Ip) {
        sendESP32RestControl(esp32Ip, `action=speed&val=${validSpeed}`);
      }
    },
    [esp32Ip]
  );

  // --- 7 Optical IR Sensors ---
  const [sensors, setSensors] = useState(() =>
    ALL_SENSORS.map((s) => ({
      ...s,
      status: 'active',
      lastTriggered: null,
      detectionCount: 0,
      signalState: 'HIGH',
    }))
  );

  const [servos, setServos] = useState(() =>
    ALL_SERVOS.map((s) => ({
      ...s,
      currentAngle: 0,
      status: 'ready',
      lastMoved: null,
    }))
  );

  // --- Activity Log & History ---
  const [activityFeed, setActivityFeed] = useState(() => [
    {
      id: 'act_init_1',
      title: 'ESP32 Native WebSocket Client Ready',
      description: `Targeting ws://${esp32Ip}:81/`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      icon: 'Wifi',
    },
    {
      id: 'act_init_2',
      title: '7 Optical IR Sensors Calibrated',
      description: 'System ready for coin sorting and telemetry',
      timestamp: new Date().toISOString(),
      severity: 'success',
      icon: 'CheckCircle',
    },
  ]);

  const [coinHistory, setCoinHistory] = useState([]);

  // --- Voice Synthesis Setup ---
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);
          const englishIndex = available.findIndex((v) => v.lang.includes('en'));
          if (englishIndex !== -1) setSelectedVoiceIndex(englishIndex);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      return () => {
        if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const lastSpokenRef = useRef({ text: '', timestamp: 0 });

  const speakText = useCallback(
    (text) => {
      if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
      
      const now = Date.now();
      // Deduplicate identical speech requests within 3 seconds so voice never speaks twice
      if (lastSpokenRef.current.text === text && (now - lastSpokenRef.current.timestamp < 3000)) {
        return;
      }
      lastSpokenRef.current = { text, timestamp: now };

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (voices.length > 0 && voices[selectedVoiceIndex]) {
          utterance.voice = voices[selectedVoiceIndex];
        }
        utterance.volume = volume;
        utterance.rate = rate;
        utterance.pitch = pitch;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Speech Synthesis Error:', err);
      }
    },
    [voiceEnabled, volume, rate, pitch, voices, selectedVoiceIndex]
  );

  const announceSequence = useCallback(
    (messages) => {
      if (!voiceEnabled) return;
      messages.forEach((msg, idx) => {
        setTimeout(() => {
          speakText(msg);
        }, idx * 1800);
      });
    },
    [voiceEnabled, speakText]
  );

  const addActivity = useCallback((title, description, severity = 'info', icon = 'Activity') => {
    const newAct = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      description,
      timestamp: new Date().toISOString(),
      severity,
      icon,
    };
    setActivityFeed((prev) => [newAct, ...prev]);
  }, []);

  // --- Coin Insertion Processing ---
  const insertCoin = useCallback(
    (targetSlotIdentifier) => {
      const slot = slots.find(
        (s) =>
          s.id === targetSlotIdentifier ||
          s.slot_id === targetSlotIdentifier ||
          s.name.toLowerCase() === String(targetSlotIdentifier).toLowerCase() ||
          s.label.toLowerCase() === String(targetSlotIdentifier).toLowerCase()
      );
      if (!slot) return;

      const nowStr = new Date().toISOString();
      let isSlotFullNow = false;

      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slot.id) return s;
          const newCount = s.count + 1;
          const newValue = newCount * s.coinValue;
          const maxLimit = s.maximumLimit;
          const maxPossible = s.limitType === 'count' ? maxLimit : maxLimit / s.coinValue;
          const newCapPct = Math.min(100, Math.round((newCount / maxPossible) * 100));

          if (newCapPct >= 100) isSlotFullNow = true;

          return {
            ...s,
            count: newCount,
            totalValue: newValue,
            capacityPercentage: newCapPct,
            status: newCapPct >= 100 ? 'full' : newCapPct >= 80 ? 'almost_full' : 'available',
            servoStatus: isSlotFullNow ? 'ejecting' : s.servoStatus,
            servoAngle: isSlotFullNow ? 90 : 0,
            lastDetectedAt: nowStr,
          };
        })
      );

      const updatedCount = slot.count + 1;
      const updatedValue = updatedCount * slot.coinValue;

      setLatestCoin({
        type: slot.label,
        value: slot.coinValue,
        slotId: slot.id,
        label: slot.label,
        detectedAt: nowStr,
        slotCount: updatedCount,
        slotValue: updatedValue,
      });

      setSensors((prev) =>
        prev.map((sen) =>
          sen.gpio === slot.gpioSensor
            ? { ...sen, status: 'triggered', detectionCount: sen.detectionCount + 1, lastTriggered: nowStr }
            : sen
        )
      );

      setCoinHistory((prev) => [
        {
          eventId: `EVT-LK-${Math.floor(1000 + Math.random() * 9000)}`,
          coinType: slot.label,
          coinValue: slot.coinValue,
          slotName: slot.name,
          slotId: slot.id,
          detectionTime: nowStr,
          sensorId: slot.gpioSensor,
          espDevice: `ESP32-${esp32Ip}`,
          status: 'Processed',
        },
        ...prev,
      ]);

      setActiveToast({
        id: Date.now(),
        title: `${slot.label} Coin Inserted`,
        text: `Value: Rs.${slot.coinValue} • Count: ${updatedCount}`,
        color: slot.color,
      });
      setTimeout(() => setActiveToast(null), 3200);

      addActivity(
        `${slot.label} Inserted`,
        `Detected by IR Sensor. Count updated to ${updatedCount} (Rs.${updatedValue})`,
        'success',
        'Coins'
      );
    },
    [slots, esp32Ip, addActivity]
  );

  const handleStatusChange = useCallback((status) => {
    setWsStatus(status);
    setDiagnostics(getDiagnosticsSnapshot());
    if (status === 'connected') {
      setEspConnected(true);
      setMachineState('active');
      setHttpReachable(true);
    } else if (status === 'disconnected' || status === 'error') {
      setEspConnected(false);
      setMachineState('offline');
    }
  }, []);

  // --- WebSocket Ingestion & Synchronization ---
  useEffect(() => {
    connectESP32({
      ipAddress: esp32Ip,
      onStatusChange: handleStatusChange,
      onDiagnosticsChange: (diag) => {
        setDiagnostics(diag);
        if (diag.wifiSignal !== undefined) setWifiSignal(diag.wifiSignal);
      },
      onData: (data) => {
        if (!data) return;

        // 1. Process Device Diagnostics Snapshot if present
        if (data.device) {
          if (data.device.rssi) {
            // Convert RSSI (e.g. -50 dBm) to signal percentage (0-100%)
            const pct = Math.min(100, Math.max(0, 2 * (data.device.rssi + 100)));
            setWifiSignal(pct);
          }
        }

        // 2. Process Machine Status Object if present
        if (data.machine) {
          if (data.machine.status) setMachineState(data.machine.status);
          if (data.machine.feedEnabled !== undefined) setCoinEntryEnabled(data.machine.feedEnabled);
        }

        // 3. Process Latest Event with Deduplication Guard
        if (data.latestEvent && !data._duplicateEvent) {
          const evt = data.latestEvent;
          const eventId = evt.id;

          if (lastProcessedEventIdRef.current !== eventId) {
            lastProcessedEventIdRef.current = eventId;

            // Trigger Browser Voice Output for new event
            if (evt.message) {
              speakText(evt.message);
            }

            if (evt.type === 'coin_detected' || evt.type === 'coin_inserted') {
              insertCoin(evt.slotIndex ?? evt.coinType ?? evt.slotId);
            }
          }
        }

        // 4. Process Simple Direct WebSocket Events
        if (data.event === 'coin_detected' || data.event === 'coin_inserted') {
          insertCoin(data.slotId || data.slot_id || data.coinType);
          if (data.message && !data._duplicateEvent) {
            speakText(data.message);
          }
        } else if (data.event === 'slot_full') {
          const target = slots.find(
            (s) => s.id === data.slotId || s.slot_id === data.slotId || s.label === data.coinType
          );
          if (target) {
            setMachineState('slot_full');
            setCoinEntryEnabled(false);
            setFullSlotModal({ isOpen: true, slot: target });
            speakText(`${target.label} slot reached maximum capacity.`);
          }
        } else if (data.event === 'slot_reset_success' || data.event === 'slot_reset') {
          const target = slots.find(
            (s) => s.id === data.slotId || s.slot_id === data.slotId || s.label === data.coinType
          );
          if (target) {
            setSlots((prev) =>
              prev.map((s) => (s.id === target.id ? { ...s, count: 0, totalValue: 0, capacityPercentage: 0, status: 'available' } : s))
            );
            setMachineState('active');
            setCoinEntryEnabled(true);
            speakText(`${target.label} slot reset completed. Machine is ready.`);
          }
        }

        // 5. Process Full Slots Array telemetry payload
        if (Array.isArray(data.slots)) {
          setSlots((prev) =>
            prev.map((s, idx) => {
              const remote = data.slots.find((rs) => rs.index === idx || rs.id === s.id || rs.id === s.slot_id);
              if (!remote) return s;
              const newCount = remote.count !== undefined ? remote.count : s.count;
              const newValue = remote.slotValue !== undefined ? remote.slotValue : newCount * s.coinValue;
              const maxCount = remote.maximumCount || s.maximumLimit;
              const capPct = remote.capacityPercentage !== undefined ? remote.capacityPercentage : Math.min(100, Math.round((newCount / maxCount) * 100));

              return {
                ...s,
                count: newCount,
                totalValue: newValue,
                capacityPercentage: capPct,
                status: capPct >= 100 ? 'full' : capPct >= 80 ? 'almost_full' : 'available',
                sensorStatus: remote.sensorActive ? 'triggered' : 'active',
              };
            })
          );
        }
      },
    });

    return () => {
      // Clean up connection on unmount if needed
    };
  }, [esp32Ip, insertCoin, slots, speakText, handleStatusChange]);

  // --- PRE-FLIGHT HTTP REACHABILITY TEST ---
  const handleTestConnection = useCallback(async () => {
    setWsStatus('connecting');
    const result = await checkESP32HttpReachability(esp32Ip);
    setHttpReachable(result.reachable);

    if (result.reachable) {
      addActivity('ESP32 HTTP Ping Success', `Reachable at http://${esp32Ip}/api/status`, 'success', 'CheckCircle');
      connectESP32({
        ipAddress: esp32Ip,
        onStatusChange: handleStatusChange,
        onDiagnosticsChange: setDiagnostics,
      });
    } else {
      handleStatusChange('error');
      addActivity(
        'ESP32 Unreachable',
        `Could not connect to http://${esp32Ip}. Check IP & Wi-Fi network connection.`,
        'error',
        'AlertTriangle'
      );
    }
    return result;
  }, [esp32Ip, addActivity, handleStatusChange]);

  // --- MANUAL CONNECT / DISCONNECT ---
  const handleConnectESP32 = useCallback(() => {
    connectESP32({
      ipAddress: esp32Ip,
      onStatusChange: handleStatusChange,
      onDiagnosticsChange: setDiagnostics,
    });
  }, [esp32Ip, handleStatusChange]);

  const handleDisconnectESP32 = useCallback(() => {
    disconnectESP32();
    handleStatusChange('disconnected');
    addActivity('Manual Disconnect', 'User clicked disconnect in settings', 'warning', 'WifiOff');
  }, [addActivity, handleStatusChange]);

  // --- HTTP REST & WEBSOCKET CONTROLS ---

  // Stop Coin Feeder Motor Completely
  const stopCoinFeeder = useCallback(() => {
    sendESP32Command({ command: 'stop_feeder' });
    if (esp32Ip) {
      sendESP32RestControl(esp32Ip, 'stop_feeder');
    }
    setMachineState('paused');
    setCoinEntryEnabled(false);
    speakText('Coin feeder motor stopped.');
    addActivity('Feeder Motor Stopped', 'Coin feeder servo motor function stopped.', 'warning', 'Square');
  }, [esp32Ip, speakText, addActivity]);

  // 1. Reset Compartment Slot
  const requestSlotReset = useCallback((slot) => {
    setResetConfirmModal({ isOpen: true, slot });
  }, []);

  // 2. Manual Open Compartment Slot Drawer (Eject 6 cm OUT)
  const ejectSlotDrawer = useCallback(
    (slotIdOrIndex) => {
      let slotIdx = -1;
      if (typeof slotIdOrIndex === 'number') {
        slotIdx = slotIdOrIndex;
      } else {
        slotIdx = slots.findIndex((s) => s.id === slotIdOrIndex);
      }
      if (slotIdx < 0 || slotIdx >= slots.length) return;

      const targetSlot = slots[slotIdx];
      sendESP32Command({ command: 'eject_slot', slotIndex: slotIdx, slotId: targetSlot.id });
      if (esp32Ip) {
        sendESP32RestControl(esp32Ip, 'eject', { slotIndex: slotIdx });
      }

      setSlots((prev) =>
        prev.map((s, idx) =>
          idx === slotIdx ? { ...s, drawerState: 'open', status: 'open' } : s
        )
      );

      speakText(`${targetSlot.label} drawer opened.`);
      addActivity(
        `${targetSlot.label} Drawer Opened`,
        `Ejected drawer 6 cm OUT via manual web app control.`,
        'info',
        'Unlock'
      );
    },
    [slots, esp32Ip, speakText]
  );

  // 3. Manual Close Compartment Slot Drawer (Pull 6 cm IN)
  const closeSlotDrawer = useCallback(
    (slotIdOrIndex) => {
      let slotIdx = -1;
      if (typeof slotIdOrIndex === 'number') {
        slotIdx = slotIdOrIndex;
      } else {
        slotIdx = slots.findIndex((s) => s.id === slotIdOrIndex);
      }
      if (slotIdx < 0 || slotIdx >= slots.length) return;

      const targetSlot = slots[slotIdx];
      sendESP32Command({ command: 'close_slot', slotIndex: slotIdx, slotId: targetSlot.id });
      if (esp32Ip) {
        sendESP32RestControl(esp32Ip, 'close', { slotIndex: slotIdx });
      }

      setSlots((prev) =>
        prev.map((s, idx) =>
          idx === slotIdx ? { ...s, drawerState: 'closed', status: 'available' } : s
        )
      );

      speakText(`${targetSlot.label} drawer closed.`);
      addActivity(
        `${targetSlot.label} Drawer Closed`,
        `Closed drawer 6 cm IN via manual web app control.`,
        'success',
        'Lock'
      );
    },
    [slots, esp32Ip, speakText]
  );

  const confirmSlotReset = useCallback(
    async (slotId) => {
      const targetSlot = slots.find((s) => s.id === slotId || s.slot_id === slotId);
      if (!targetSlot) return;

      const slotIndex = slots.findIndex((s) => s.id === targetSlot.id);
      const nowStr = new Date().toISOString();

      // Dispatch HTTP REST command: POST http://ESP32_IP/api/reset?slot=X
      const restRes = await sendESP32RestControl(esp32Ip, 'reset', { slotIndex });

      // Fallback: Send WebSocket command
      sendESP32Command({
        command: 'reset_slot',
        slotId: targetSlot.id,
        slotIndex,
        gpioServo: targetSlot.gpioServo,
        timestamp: nowStr,
      });

      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== targetSlot.id) return s;
          const wasOpen = s.drawerState === 'open' || s.status === 'open' || s.status === 'full';
          return {
            ...s,
            count: 0,
            totalValue: 0,
            capacityPercentage: 0,
            drawerState: wasOpen ? 'closed' : 'open',
            status: wasOpen ? 'available' : 'open',
            servoStatus: 'ready',
            servoAngle: wasOpen ? 0 : 90,
          };
        })
      );

      setServos((prev) =>
        prev.map((ser) =>
          ser.gpio === targetSlot.gpioServo
            ? { ...ser, currentAngle: 0, status: 'ready', lastMoved: nowStr }
            : ser.id === 'servo_entry'
            ? { ...ser, status: 'ready' }
            : ser
        )
      );

      setMachineState('active');
      setCoinEntryEnabled(true);
      setResetConfirmModal({ isOpen: false, slot: null });
      if (fullSlotModal.slot?.id === targetSlot.id) {
        setFullSlotModal({ isOpen: false, slot: null });
      }

      addActivity(
        `${targetSlot.label} Compartment Reset`,
        restRes.success
          ? `HTTP REST POST http://${esp32Ip}/api/reset?slot=${slotIndex} Succeeded.`
          : `Sent WebSocket command "reset_slot" to ESP32 (${targetSlot.gpioServo}).`,
        'success',
        'RotateCcw'
      );

      speakText(`${targetSlot.label} slot reset completed. Machine is ready.`);
    },
    [slots, esp32Ip, fullSlotModal, addActivity, speakText]
  );

  // 2. Resume Machine
  const resumeMachine = useCallback(async () => {
    const restRes = await sendESP32RestControl(esp32Ip, 'resume');
    sendESP32Command({ command: 'resume_machine', timestamp: new Date().toISOString() });

    setMachineState('active');
    setCoinEntryEnabled(true);
    speakText('Machine is ready.');
    addActivity('Machine Resumed', restRes.success ? 'HTTP POST /api/control?action=resume success' : 'Sent WS command resume_machine', 'success', 'Play');
  }, [esp32Ip, speakText, addActivity]);

  // 3. Emergency Stop
  const handleEmergencyStop = useCallback(async () => {
    const restRes = await sendESP32RestControl(esp32Ip, 'emergency_stop');
    sendESP32Command({ command: 'emergency_stop', timestamp: new Date().toISOString() });

    setMachineState('paused');
    setCoinEntryEnabled(false);
    setEmergencyModal(false);
    speakText('Coin insertion has been paused.');
    addActivity('Emergency Stop Triggered', restRes.success ? 'HTTP POST /api/control?action=emergency_stop success' : 'Sent WS command emergency_stop', 'error', 'ShieldAlert');
  }, [esp32Ip, speakText, addActivity]);

  // 4. Simulate Coin REST API
  const handleSimulateCoinHttp = useCallback(
    async (slotIdentifier) => {
      const slotIdx = slots.findIndex((s) => s.id === slotIdentifier || s.slot_id === slotIdentifier);
      const targetSlot = slots[slotIdx] || slots[0];

      sendESP32RestControl(esp32Ip, 'simulate', { slotIndex: slotIdx >= 0 ? slotIdx : 0 });
      insertCoin(targetSlot.id);
    },
    [slots, esp32Ip, insertCoin]
  );

  // 5. Reset All Slots
  const resetAllSlots = useCallback(() => {
    sendESP32Command({ command: 'reset_all_slots', timestamp: new Date().toISOString() });
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        count: 0,
        totalValue: 0,
        capacityPercentage: 0,
        status: 'available',
        servoStatus: 'ready',
        servoAngle: 0,
      }))
    );
    setMachineState('active');
    setCoinEntryEnabled(true);
    speakText('Machine is ready.');
    addActivity('All Slots Cleared', 'Reset all counters to zero', 'success', 'RotateCcw');
  }, [speakText, addActivity]);

  // 6. Test Servo Movement
  const testServoMovement = useCallback(
    (servoId, gpio) => {
      sendESP32Command({
        command: 'test_servo',
        servoId,
        gpio,
        angle: 90,
        timestamp: new Date().toISOString(),
      });
      speakText('Testing servo motor.');
      addActivity('Test Servo Command', `Sent command for ${gpio}`, 'info', 'Zap');
    },
    [speakText, addActivity]
  );

  // 7. Update Slot Limit
  const updateSlotLimit = useCallback((slotId, newLimit, newLimitType) => {
    sendESP32Command({
      command: 'set_slot_limit',
      slotId,
      maximumLimit: newLimit,
      limitType: newLimitType,
      timestamp: new Date().toISOString(),
    });

    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;
        const maxPossible = newLimitType === 'count' ? newLimit : newLimit / s.coinValue;
        const newCapPct = Math.min(100, Math.round((s.count / maxPossible) * 100));
        return {
          ...s,
          maximumLimit: newLimit,
          limitType: newLimitType,
          capacityPercentage: newCapPct,
          status: newCapPct >= 100 ? 'full' : newCapPct >= 80 ? 'almost_full' : 'available',
        };
      })
    );
  }, []);

  // --- Simulation Triggers ---
  const triggerAlmostFullSim = useCallback(
    (slotId) => {
      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slotId) return s;
          const maxLimit = s.maximumLimit;
          const maxPossible = s.limitType === 'count' ? maxLimit : maxLimit / s.coinValue;
          const count80 = Math.ceil(maxPossible * 0.82);
          return {
            ...s,
            count: count80,
            totalValue: count80 * s.coinValue,
            capacityPercentage: 82,
            status: 'almost_full',
          };
        })
      );
      const slot = slots.find((s) => s.id === slotId);
      if (slot) {
        speakText(`${slot.label} compartment is almost full.`);
        addActivity(`${slot.label} Almost Full (Simulated)`, 'Capacity set to 82%', 'warning', 'AlertCircle');
      }
    },
    [slots, speakText, addActivity]
  );

  const triggerSlotFullSim = useCallback(
    (slotId) => {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) return;

      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slotId) return s;
          const maxLimit = s.maximumLimit;
          const maxPossible = s.limitType === 'count' ? maxLimit : maxLimit / s.coinValue;
          return {
            ...s,
            count: maxPossible,
            totalValue: maxPossible * s.coinValue,
            capacityPercentage: 100,
            status: 'full',
            servoStatus: 'ejecting',
            servoAngle: 90,
          };
        })
      );

      setMachineState('slot_full');
      setCoinEntryEnabled(false);
      setFullSlotModal({ isOpen: true, slot });

      addActivity(`${slot.label} Full (Simulated)`, 'Simulated 100% capacity', 'error', 'AlertTriangle');
      speakText(`${slot.label} slot reached maximum capacity.`);
    },
    [slots, addActivity, speakText]
  );

  const triggerSensorErrorSim = useCallback(() => {
    setMachineState('error');
    setSensors((prev) =>
      prev.map((sen, idx) => (idx === 0 ? { ...sen, status: 'error', signalState: 'FAULT' } : sen))
    );
    speakText('Sensor error detected.');
    addActivity('Hardware Error Simulated', 'Optical IR sensor fault', 'error', 'AlertOctagon');
  }, [speakText, addActivity]);

  const triggerServoErrorSim = useCallback(() => {
    setMachineState('error');
    setServos((prev) =>
      prev.map((ser, idx) => (idx === 0 ? { ...ser, status: 'error' } : ser))
    );
    speakText('Sensor error detected.');
    addActivity('Servo Motor Error Simulated', 'Coin entry servo position error', 'error', 'AlertOctagon');
  }, [speakText, addActivity]);

  const toggleESPConnectionSim = useCallback(() => {
    setEspConnected((prev) => {
      const nextState = !prev;
      if (!nextState) {
        setMachineState('offline');
        setWsStatus('disconnected');
        speakText('The machine is offline.');
        addActivity('ESP32 Disconnected', 'WebSocket connection lost', 'error', 'WifiOff');
      } else {
        setMachineState('active');
        setWsStatus('connected');
        speakText('Machine is ready.');
        addActivity('ESP32 Connected', 'WebSocket link established', 'success', 'Wifi');
      }
      return nextState;
    });
  }, [speakText, addActivity]);

  return (
    <CoinFlowContext.Provider
      value={{
        esp32Ip,
        setEsp32Ip,
        websocketUrl,
        apiBaseUrl,
        machineState,
        setMachineState,
        espConnected,
        wsStatus,
        wifiSignal,
        httpReachable,
        diagnostics,
        coinEntryEnabled,
        theme,
        setTheme: handleSetTheme,
        // Voice
        voiceEnabled,
        setVoiceEnabled,
        volume,
        setVolume,
        rate,
        setRate,
        pitch,
        setPitch,
        voices,
        selectedVoiceIndex,
        setSelectedVoiceIndex,
        speakText,
        // Data
        slots,
        totalCoins,
        totalValue,
        latestCoin,
        activeToast,
        fullSlotModal,
        setFullSlotModal,
        resetConfirmModal,
        setResetConfirmModal,
        emergencyModal,
        setEmergencyModal,
        sensors,
        servos,
        activityFeed,
        coinHistory,
        // Actions & Connection Controls
        handleConnectESP32,
        handleDisconnectESP32,
        handleTestConnection,
        feedSpeedMs,
        handleSetFeedSpeed,
        stopCoinFeeder,
        ejectSlotDrawer,
        closeSlotDrawer,
        insertCoin,
        handleSimulateCoinHttp,
        requestSlotReset,
        confirmSlotReset,
        testServoMovement,
        triggerAlmostFullSim,
        triggerSlotFullSim,
        triggerSensorErrorSim,
        triggerServoErrorSim,
        toggleESPConnectionSim,
        handleEmergencyStop,
        resumeMachine,
        resetAllSlots,
        updateSlotLimit,
      }}
    >
      {children}
    </CoinFlowContext.Provider>
  );
}

export function useCoinFlow() {
  const ctx = useContext(CoinFlowContext);
  if (!ctx) {
    throw new Error('useCoinFlow must be used within a CoinFlowProvider');
  }
  return ctx;
}
