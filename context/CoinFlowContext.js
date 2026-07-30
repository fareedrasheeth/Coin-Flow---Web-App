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

  // Synchronize theme attribute on mount and theme change
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

  // --- Exactly 7 IR Sensors (One below each hole) & 8 Servos ---
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

  // --- Activity Feed & History ---
  const [activityFeed, setActivityFeed] = useState(() => [
    {
      id: 'act_init_1',
      title: 'WebSocket Connected',
      description: `ESP32 connected via WebSocket (${DEFAULT_WEBSOCKET_URL})`,
      timestamp: BASE_TIMESTAMP,
      severity: 'info',
      icon: 'Wifi',
    },
    {
      id: 'act_init_2',
      title: '7 IR Sensors Active',
      description: 'All 7 optical coin sorting IR sensors calibrated & ready',
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

  // --- Core Coin Insertion Handler ---
  const insertCoin = useCallback(
    (slotId) => {
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

      const slot = slots.find((s) => s.id === slotId || s.slot_id === slotId);
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

      // Update 7 IR sensor state
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
        `Detected at ${slot.gpioSensor}. Slot count updated to ${updatedCount} (Rs.${updatedValue})`,
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

  // --- WebSocket Connection & Real-Time ESP32 Event Listener ---
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
        // Handle incoming WebSocket telemetry event from ESP32
        if (data.event === 'coin_detected' || data.event === 'coin_inserted') {
          insertCoin(data.slotId || data.slot_id);
        } else if (data.event === 'slot_full') {
          const slot = slots.find((s) => s.id === data.slotId || s.slot_id === data.slotId);
          if (slot) {
            setMachineState('slot_full');
            setCoinEntryEnabled(false);
            setFullSlotModal({ isOpen: true, slot });
            announceSequence([
              `${slot.label} compartment is full.`,
              'Coin insertion has been paused.',
              'Please remove the coins.',
            ]);
          }
        } else if (data.event === 'slot_reset_success') {
          const slotId = data.slotId;
          const targetSlot = slots.find((s) => s.id === slotId || s.slot_id === slotId);
          if (targetSlot) {
            setSlots((prev) =>
              prev.map((s) => (s.id === targetSlot.id ? { ...s, count: 0, totalValue: 0, capacityPercentage: 0, status: 'available' } : s))
            );
            setMachineState('active');
            setCoinEntryEnabled(true);
            announceSequence([`${targetSlot.label} compartment has been reset.`, 'The machine is ready.']);
          }
        }
      }
    );
  }, [wsUrl, insertCoin, slots, announceSequence]);

  // --- Slot Reset Workflow ---
  const requestSlotReset = useCallback((slot) => {
    setResetConfirmModal({ isOpen: true, slot });
  }, []);

  const confirmSlotReset = useCallback(
    (slotId) => {
      const targetSlot = slots.find((s) => s.id === slotId || s.slot_id === slotId);
      if (!targetSlot) return;

      const nowStr = new Date().toISOString();

      // Send WebSocket command to ESP32 hardware
      sendWebSocketCommand({
        action: 'reset_slot',
        slotId: targetSlot.id,
        gpioServo: targetSlot.gpioServo,
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
        `Slot count reset to 0. WebSocket reset command sent to ESP32. Servo returned to 0°.`,
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

  // --- Simulation Controls ---
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

  const handleEmergencyStop = useCallback(() => {
    sendWebSocketCommand({ action: 'emergency_stop' });
    setMachineState('paused');
    setCoinEntryEnabled(false);
    setEmergencyModal(false);
    speakText('Coin insertion has been paused.');
    addActivity('Emergency Stop Activated', 'WebSocket command sent to halt ESP32', 'error', 'ShieldAlert');
  }, [speakText, addActivity]);

  const resumeMachine = useCallback(() => {
    sendWebSocketCommand({ action: 'resume_machine' });
    setMachineState('active');
    setCoinEntryEnabled(true);
    speakText('The machine is ready.');
    addActivity('Machine Resumed', 'WebSocket resume command sent', 'success', 'Play');
  }, [speakText, addActivity]);

  const resetAllSlots = useCallback(() => {
    sendWebSocketCommand({ action: 'reset_all' });
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
    addActivity('All Slots Reset', 'Cleared all 7 slot counts. Sent WebSocket reset all.', 'success', 'RotateCcw');
  }, [speakText, addActivity]);

  const updateSlotLimit = useCallback((slotId, newLimit, newLimitType) => {
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
        // Actions
        insertCoin,
        requestSlotReset,
        confirmSlotReset,
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
