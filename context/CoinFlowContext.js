'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SRI_LANKAN_COINS, ALL_SENSORS, ALL_SERVOS, DEFAULT_WEBSOCKET_URL } from '@/lib/constants';
import { connectWebSocket, sendWebSocketCommand } from '@/lib/websocket';

const CoinFlowContext = createContext(null);

const BASE_TIMESTAMP = '2026-07-30T22:00:00.000Z';
const FIXED_SLOT_COUNTS = [12, 10, 15, 8, 14, 6, 18];
const FIXED_SENSOR_COUNTS = [12, 10, 15, 8, 14, 6, 18];

function generateInitialHistory() {
  const history = [];
  const baseTime = 1785360000000;
  for (let i = 1; i <= 35; i++) {
    const c = SRI_LANKAN_COINS[(i - 1) % SRI_LANKAN_COINS.length];
    history.push({
      eventId: `EVT-LK-${1000 + i}`,
      coinType: c.label,
      coinValue: c.coinValue,
      slotName: c.name,
      slotId: c.id,
      detectionTime: new Date(baseTime - i * 140000).toISOString(),
      sensorId: c.gpioSensor,
      espDevice: 'ESP32-COIN-01',
      status: 'Processed',
    });
  }
  return history;
}

export function CoinFlowProvider({ children }) {
  // --- Machine Status & WebSocket State ---
  const [machineState, setMachineState] = useState('active');
  const [espConnected, setEspConnected] = useState(true);
  const [wsUrl, setWsUrl] = useState(DEFAULT_WEBSOCKET_URL);
  const [wsStatus, setWsStatus] = useState('connected');
  const [coinEntryEnabled, setCoinEntryEnabled] = useState(true);
  const [wifiSignal, setWifiSignal] = useState(92);

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
    }
  }, []);

  useEffect(() => {
    handleSetTheme(theme);
  }, [theme, handleSetTheme]);

  // --- Voice Announcement Engine ---
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  // --- 7 Coin Slots State ---
  const [slots, setSlots] = useState(() =>
    SRI_LANKAN_COINS.map((c, idx) => {
      const initialCount = FIXED_SLOT_COUNTS[idx] || 10;
      const initialValue = initialCount * c.coinValue;
      const limit = c.defaultLimit;
      const maxPossible = c.defaultLimitType === 'count' ? limit : limit / c.coinValue;
      const capPct = Math.min(100, Math.round((initialCount / maxPossible) * 100));
      return {
        ...c,
        count: initialCount,
        totalValue: initialValue,
        limitType: c.defaultLimitType,
        maximumLimit: limit,
        capacityPercentage: capPct,
        status: capPct >= 100 ? 'full' : capPct >= 80 ? 'almost_full' : 'available',
        sensorStatus: 'active',
        servoStatus: 'ready',
        servoAngle: 0,
        lastDetectedAt: BASE_TIMESTAMP,
      };
    })
  );

  const totalCoins = slots.reduce((acc, s) => acc + s.count, 0);
  const totalValue = slots.reduce((acc, s) => acc + s.totalValue, 0);

  // --- Latest Coin Card State ---
  const [latestCoin, setLatestCoin] = useState({
    type: 'Rs.2 Big',
    value: 2,
    slotId: 'slot_7',
    label: 'Rs.2 Big',
    detectedAt: BASE_TIMESTAMP,
    slotCount: 18,
    slotValue: 36,
  });

  const [activeToast, setActiveToast] = useState(null);
  const [fullSlotModal, setFullSlotModal] = useState({ isOpen: false, slot: null });
  const [resetConfirmModal, setResetConfirmModal] = useState({ isOpen: false, slot: null });
  const [emergencyModal, setEmergencyModal] = useState(false);

  // --- 7 Optical IR Sensors & 8 Servo Motors ---
  const [sensors, setSensors] = useState(() =>
    ALL_SENSORS.map((s, idx) => ({
      ...s,
      status: 'active',
      lastTriggered: BASE_TIMESTAMP,
      detectionCount: FIXED_SENSOR_COUNTS[idx] || 20,
      signalState: 'HIGH',
    }))
  );

  const [servos, setServos] = useState(() =>
    ALL_SERVOS.map((s) => ({
      ...s,
      currentAngle: 0,
      status: 'ready',
      lastMoved: BASE_TIMESTAMP,
    }))
  );

  // --- Activity Log & History ---
  const [activityFeed, setActivityFeed] = useState(() => [
    {
      id: 'act_init_1',
      title: 'WebSocket Protocol Active',
      description: `Listening for ESP32 telemetry events on ${DEFAULT_WEBSOCKET_URL}`,
      timestamp: BASE_TIMESTAMP,
      severity: 'info',
      icon: 'Wifi',
    },
    {
      id: 'act_init_2',
      title: '7 Optical IR Sensors Ready',
      description: 'Connected below sorting holes on hardware tray',
      timestamp: BASE_TIMESTAMP,
      severity: 'success',
      icon: 'CheckCircle',
    },
  ]);

  const [coinHistory, setCoinHistory] = useState(() => generateInitialHistory());

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

  const speakText = useCallback(
    (text) => {
      if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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
      if (!espConnected) {
        speakText('The machine is offline.');
        addActivity('Insertion Blocked', 'ESP32 is offline', 'error', 'WifiOff');
        return;
      }

      if (!coinEntryEnabled || machineState === 'paused' || machineState === 'slot_full') {
        speakText('Coin insertion has been paused.');
        addActivity('Coin Rejected', 'Machine is paused or a slot is full', 'warning', 'AlertOctagon');
        return;
      }

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
      let isSlotAlmostFull = false;

      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slot.id) return s;
          const newCount = s.count + 1;
          const newValue = newCount * s.coinValue;
          const maxLimit = s.maximumLimit;
          const maxPossible = s.limitType === 'count' ? maxLimit : maxLimit / s.coinValue;
          const newCapPct = Math.min(100, Math.round((newCount / maxPossible) * 100));

          if (newCapPct >= 100) {
            isSlotFullNow = true;
          } else if (newCapPct >= 80 && s.capacityPercentage < 80) {
            isSlotAlmostFull = true;
          }

          const newStatus = isSlotFullNow
            ? 'full'
            : newCapPct >= 80
            ? 'almost_full'
            : 'available';

          return {
            ...s,
            count: newCount,
            totalValue: newValue,
            capacityPercentage: newCapPct,
            status: newStatus,
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

      // Update 7 IR optical sensors
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
          espDevice: 'ESP32-COIN-01',
          status: 'Processed',
        },
        ...prev,
      ]);

      setActiveToast({
        id: Date.now(),
        title: `${slot.label} Coin Inserted`,
        text: `Value: Rs.${slot.coinValue} • Total Slot Count: ${updatedCount}`,
        color: slot.color,
      });
      setTimeout(() => setActiveToast(null), 3200);

      addActivity(
        `${slot.label} Inserted`,
        `Detected by ${slot.gpioSensor}. Count updated to ${updatedCount} (Rs.${updatedValue})`,
        'success',
        'Coins'
      );

      // AUTOMATIC VOICE ANNOUNCEMENT: "Rs.1 small coin inserted."
      speakText(`${slot.label} coin inserted.`);

      if (isSlotFullNow) {
        setMachineState('slot_full');
        setCoinEntryEnabled(false);

        setServos((prev) =>
          prev.map((ser) =>
            ser.gpio === slot.gpioServo
              ? { ...ser, currentAngle: 90, status: 'ejecting', lastMoved: nowStr }
              : ser.id === 'servo_entry'
              ? { ...ser, status: 'disabled' }
              : ser
          )
        );

        setFullSlotModal({
          isOpen: true,
          slot: {
            ...slot,
            count: updatedCount,
            totalValue: updatedValue,
          },
        });

        addActivity(
          `${slot.label} Compartment Full!`,
          `Capacity reached 100%. Compartment servo activated (90°). Main coin entry paused.`,
          'error',
          'AlertTriangle'
        );

        announceSequence([
          `${slot.label} compartment is full.`,
          'Coin insertion has been paused.',
          'Please remove the coins.',
        ]);
      } else if (isSlotAlmostFull) {
        addActivity(
          `${slot.label} Compartment Almost Full`,
          `Capacity reached 80%. Please prepare to empty compartment.`,
          'warning',
          'AlertCircle'
        );

        announceSequence([`${slot.label} compartment is almost full.`]);
      }
    },
    [espConnected, coinEntryEnabled, machineState, slots, speakText, addActivity, announceSequence]
  );

  // --- WebSocket Listener & Telemetry Processing ---
  useEffect(() => {
    connectWebSocket(
      wsUrl,
      (state) => {
        setWsStatus(state);
        if (state === 'connected') {
          setEspConnected(true);
          setMachineState('active');
        } else if (state === 'disconnected' || state === 'error') {
          setEspConnected(false);
          setMachineState('offline');
        }
      },
      (data) => {
        if (!data) return;

        // INCOMING WEBSOCKET EVENT FROM ESP32:
        // 1. Coin Detection Event
        if (data.event === 'coin_detected' || data.event === 'coin_inserted') {
          insertCoin(data.slotId || data.slot_id || data.coinType);
        }
        // 2. Full Slot Event
        else if (data.event === 'slot_full') {
          const target = slots.find(
            (s) => s.id === data.slotId || s.slot_id === data.slotId || s.label === data.coinType
          );
          if (target) {
            setMachineState('slot_full');
            setCoinEntryEnabled(false);
            setFullSlotModal({ isOpen: true, slot: target });
            announceSequence([
              `${target.label} compartment is full.`,
              'Coin insertion has been paused.',
              'Please remove the coins.',
            ]);
          }
        }
        // 3. Almost Full Event
        else if (data.event === 'slot_almost_full') {
          const target = slots.find(
            (s) => s.id === data.slotId || s.slot_id === data.slotId || s.label === data.coinType
          );
          if (target) {
            announceSequence([`${target.label} compartment is almost full.`]);
          }
        }
        // 4. Slot Reset Confirmed Event
        else if (data.event === 'slot_reset_success') {
          const target = slots.find(
            (s) => s.id === data.slotId || s.slot_id === data.slotId || s.label === data.coinType
          );
          if (target) {
            setSlots((prev) =>
              prev.map((s) => (s.id === target.id ? { ...s, count: 0, totalValue: 0, capacityPercentage: 0, status: 'available' } : s))
            );
            setMachineState('active');
            setCoinEntryEnabled(true);
            announceSequence([`${target.label} compartment has been reset.`, 'The machine is ready.']);
          }
        }
        // 5. Telemetry Sync Snapshot Event
        else if (data.event === 'telemetry_sync') {
          if (data.status) setMachineState(data.status);
          if (data.coinEntryEnabled !== undefined) setCoinEntryEnabled(data.coinEntryEnabled);
        }
        // 6. Hardware Fault Event
        else if (data.event === 'hardware_error') {
          setMachineState('error');
          speakText('Sensor error detected.');
          addActivity('ESP32 Hardware Error', data.message || 'Sensor reading fault', 'error', 'AlertOctagon');
        }
      }
    );
  }, [wsUrl, insertCoin, slots, speakText, announceSequence, addActivity]);

  // --- OUTGOING WEBSOCKET COMMAND DISPATCHERS ---

  // 1. Reset Slot Command
  const requestSlotReset = useCallback((slot) => {
    setResetConfirmModal({ isOpen: true, slot });
  }, []);

  const confirmSlotReset = useCallback(
    (slotId) => {
      const targetSlot = slots.find((s) => s.id === slotId || s.slot_id === slotId);
      if (!targetSlot) return;

      const nowStr = new Date().toISOString();

      // Dispatch WebSocket JSON Command to ESP32
      sendWebSocketCommand({
        command: 'reset_slot',
        slotId: targetSlot.id,
        gpioServo: targetSlot.gpioServo,
        timestamp: nowStr,
      });

      // Reset slot count & value locally
      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== targetSlot.id) return s;
          return {
            ...s,
            count: 0,
            totalValue: 0,
            capacityPercentage: 0,
            status: 'available',
            servoStatus: 'ready',
            servoAngle: 0,
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

      const otherFull = slots.some((s) => s.id !== targetSlot.id && s.capacityPercentage >= 100);
      if (!otherFull) {
        setMachineState('active');
        setCoinEntryEnabled(true);
      }

      setResetConfirmModal({ isOpen: false, slot: null });
      if (fullSlotModal.slot?.id === targetSlot.id) {
        setFullSlotModal({ isOpen: false, slot: null });
      }

      addActivity(
        `${targetSlot.label} Compartment Reset`,
        `Dispatched WebSocket command "reset_slot" to ESP32 (${targetSlot.gpioServo}). Counter zeroed.`,
        'success',
        'RotateCcw'
      );

      announceSequence([
        `${targetSlot.label} compartment has been reset.`,
        'The machine is ready.',
      ]);
    },
    [slots, fullSlotModal, addActivity, announceSequence]
  );

  // 2. Start / Resume Machine Command
  const resumeMachine = useCallback(() => {
    sendWebSocketCommand({
      command: 'resume_machine',
      timestamp: new Date().toISOString(),
    });
    setMachineState('active');
    setCoinEntryEnabled(true);
    speakText('The machine is ready.');
    addActivity('Machine Resumed', 'Sent WebSocket command "resume_machine" to ESP32', 'success', 'Play');
  }, [speakText, addActivity]);

  // 3. Emergency Stop Command
  const handleEmergencyStop = useCallback(() => {
    sendWebSocketCommand({
      command: 'emergency_stop',
      timestamp: new Date().toISOString(),
    });
    setMachineState('paused');
    setCoinEntryEnabled(false);
    setEmergencyModal(false);
    speakText('Coin insertion has been paused.');
    addActivity('Emergency Stop Triggered', 'Sent WebSocket command "emergency_stop" to ESP32', 'error', 'ShieldAlert');
  }, [speakText, addActivity]);

  // 4. Reset All Slots Command
  const resetAllSlots = useCallback(() => {
    sendWebSocketCommand({
      command: 'reset_all_slots',
      timestamp: new Date().toISOString(),
    });
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
    speakText('The machine is ready.');
    addActivity('All Slots Cleared', 'Sent WebSocket command "reset_all_slots" to ESP32', 'success', 'RotateCcw');
  }, [speakText, addActivity]);

  // 5. Test Servo Movement Command
  const testServoMovement = useCallback(
    (servoId, gpio) => {
      sendWebSocketCommand({
        command: 'test_servo',
        servoId,
        gpio,
        angle: 90,
        timestamp: new Date().toISOString(),
      });
      speakText(`Testing servo motor.`);
      addActivity('Test Servo Command', `Sent WebSocket command "test_servo" for ${gpio}`, 'info', 'Zap');
    },
    [speakText, addActivity]
  );

  // 6. Update Slot Limit Command
  const updateSlotLimit = useCallback((slotId, newLimit, newLimitType) => {
    sendWebSocketCommand({
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

      addActivity(`${slot.label} Full (Simulated)`, 'Simulated 100% capacity and servo ejection', 'error', 'AlertTriangle');
      announceSequence([
        `${slot.label} compartment is full.`,
        'Coin insertion has been paused.',
        'Please remove the coins.',
      ]);
    },
    [slots, addActivity, announceSequence]
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
        speakText('The machine is ready.');
        addActivity('ESP32 Connected', 'WebSocket link established', 'success', 'Wifi');
      }
      return nextState;
    });
  }, [speakText, addActivity]);

  return (
    <CoinFlowContext.Provider
      value={{
        machineState,
        setMachineState,
        espConnected,
        wsUrl,
        setWsUrl,
        wsStatus,
        coinEntryEnabled,
        wifiSignal,
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
        // Actions & WebSocket Commands
        insertCoin,
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
