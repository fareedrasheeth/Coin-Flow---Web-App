'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SRI_LANKAN_COINS, ALL_SENSORS, ALL_SERVOS, MACHINE_STATES } from '@/lib/constants';

const CoinFlowContext = createContext(null);

export function CoinFlowProvider({ children }) {
  // --- Machine Status State ---
  const [machineState, setMachineState] = useState('active'); // active, sorting, paused, slot_full, reset_required, offline, error
  const [espConnected, setEspConnected] = useState(true);
  const [coinEntryEnabled, setCoinEntryEnabled] = useState(true);
  const [wifiSignal, setWifiSignal] = useState(92);
  const [theme, setTheme] = useState('dark');

  // --- Voice Announcement State & Engine ---
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  // --- Coin Slots State ---
  const [slots, setSlots] = useState(() =>
    SRI_LANKAN_COINS.map((c) => {
      const initialCount = Math.floor(Math.random() * 15) + 5;
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
        lastDetectedAt: new Date(Date.now() - Math.random() * 300000).toISOString(),
      };
    })
  );

  // --- Totals ---
  const totalCoins = slots.reduce((acc, s) => acc + s.count, 0);
  const totalValue = slots.reduce((acc, s) => acc + s.totalValue, 0);

  // --- Latest Coin Card State ---
  const [latestCoin, setLatestCoin] = useState({
    type: 'Rs.2 Big',
    value: 2,
    slotId: 'slot_7',
    label: 'Rs.2 Big',
    detectedAt: new Date().toISOString(),
    slotCount: 18,
    slotValue: 36,
  });

  // --- Toast Notification State ---
  const [activeToast, setActiveToast] = useState(null);

  // --- Modals State ---
  const [fullSlotModal, setFullSlotModal] = useState({ isOpen: false, slot: null });
  const [resetConfirmModal, setResetConfirmModal] = useState({ isOpen: false, slot: null });
  const [emergencyModal, setEmergencyModal] = useState(false);

  // --- Sensors & Servos Detailed State ---
  const [sensors, setSensors] = useState(() =>
    ALL_SENSORS.map((s) => ({
      ...s,
      status: 'active',
      lastTriggered: new Date(Date.now() - Math.random() * 100000).toISOString(),
      detectionCount: Math.floor(Math.random() * 40) + 10,
      signalState: 'HIGH',
    }))
  );

  const [servos, setServos] = useState(() =>
    ALL_SERVOS.map((s) => ({
      ...s,
      currentAngle: 0,
      status: 'ready',
      lastMoved: new Date(Date.now() - Math.random() * 200000).toISOString(),
    }))
  );

  // --- Live Activity Log ---
  const [activityFeed, setActivityFeed] = useState(() => [
    {
      id: 'act_init_1',
      title: 'Machine Online',
      description: 'ESP32 connected via Wi-Fi (192.168.1.104)',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      severity: 'info',
      icon: 'Wifi',
    },
    {
      id: 'act_init_2',
      title: 'Self-Diagnostic Passed',
      description: 'All 8 IR Sensors and 8 Servo Motors initialized',
      timestamp: new Date(Date.now() - 540000).toISOString(),
      severity: 'success',
      icon: 'CheckCircle',
    },
  ]);

  // --- History Records for Table ---
  const [coinHistory, setCoinHistory] = useState(() => {
    const history = [];
    const now = Date.now();
    const coinTypes = SRI_LANKAN_COINS;
    for (let i = 1; i <= 35; i++) {
      const c = coinTypes[Math.floor(Math.random() * coinTypes.length)];
      history.push({
        eventId: `EVT-LK-${1000 + i}`,
        coinType: c.label,
        coinValue: c.coinValue,
        slotName: c.name,
        slotId: c.id,
        detectionTime: new Date(now - i * 140000).toISOString(),
        sensorId: c.gpioSensor,
        espDevice: 'ESP32-COIN-01',
        status: 'Processed',
      });
    }
    return history;
  });

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
        window.speechSynthesis.cancel(); // Stop any pending speech
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

  // Voice announcements queue helper
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

  // --- Add Activity Log Helper ---
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

  // --- Trigger Coin Drop / Event Logic ---
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

      // Update slot state
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

      // Update Latest Coin Card
      setLatestCoin({
        type: slot.label,
        value: slot.coinValue,
        slotId: slot.id,
        label: slot.label,
        detectedAt: nowStr,
        slotCount: updatedCount,
        slotValue: updatedValue,
      });

      // Update IR Sensor counter
      setSensors((prev) =>
        prev.map((sen) =>
          sen.gpio === slot.gpioSensor
            ? { ...sen, status: 'triggered', detectionCount: sen.detectionCount + 1, lastTriggered: nowStr }
            : sen
        )
      );

      // Add to History
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

      // Show temporary animated toast notification for ~3s
      setActiveToast({
        id: Date.now(),
        title: `${slot.label} Coin Inserted`,
        text: `Value: Rs.${slot.coinValue} • Total Slot Count: ${updatedCount}`,
        color: slot.color,
      });
      setTimeout(() => setActiveToast(null), 3200);

      // Activity Feed
      addActivity(
        `${slot.label} Inserted`,
        `Detected at ${slot.gpioSensor}. Slot count updated to ${updatedCount} (Rs.${updatedValue})`,
        'success',
        'Coins'
      );

      // AUTOMATIC VOICE ANNOUNCEMENT
      // "Rs.1 small coin inserted." or "Rs.2 big coin inserted."
      const voiceCoinMessage = `${slot.label} coin inserted.`;
      speakText(voiceCoinMessage);

      // FULL SLOT LOGIC
      if (isSlotFullNow) {
        setMachineState('slot_full');
        setCoinEntryEnabled(false);

        // Update servo motor to ejecting
        setServos((prev) =>
          prev.map((ser) =>
            ser.gpio === slot.gpioServo
              ? { ...ser, currentAngle: 90, status: 'ejecting', lastMoved: nowStr }
              : ser.id === 'servo_entry'
              ? { ...ser, status: 'disabled' }
              : ser
          )
        );

        // Open Full Slot Alert Modal
        setFullSlotModal({
          isOpen: true,
          slot: {
            ...slot,
            count: updatedCount,
            totalValue: updatedValue,
          },
        });

        // Add Activity
        addActivity(
          `${slot.label} Compartment Full!`,
          `Capacity reached 100%. Compartment servo activated (90°). Main coin entry paused.`,
          'error',
          'AlertTriangle'
        );

        // Voice Sequence for Full Slot
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

  // --- Slot Reset Workflow ---
  const requestSlotReset = useCallback((slot) => {
    setResetConfirmModal({ isOpen: true, slot });
  }, []);

  const confirmSlotReset = useCallback(
    (slotId) => {
      const targetSlot = slots.find((s) => s.id === slotId || s.slot_id === slotId);
      if (!targetSlot) return;

      const nowStr = new Date().toISOString();

      // Reset slot count & value
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

      // Return compartment servo to home position (0°) & re-enable entry servo
      setServos((prev) =>
        prev.map((ser) =>
          ser.gpio === targetSlot.gpioServo
            ? { ...ser, currentAngle: 0, status: 'ready', lastMoved: nowStr }
            : ser.id === 'servo_entry'
            ? { ...ser, status: 'ready' }
            : ser
        )
      );

      // Check if any other slots are still full
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
        `Slot count and value reset to 0. Compartment servo returned to 0°. Machine active.`,
        'success',
        'RotateCcw'
      );

      // AUTOMATIC VOICE ANNOUNCEMENT FOR RESET
      announceSequence([
        `${targetSlot.label} compartment has been reset.`,
        'The machine is ready.',
      ]);
    },
    [slots, fullSlotModal, addActivity, announceSequence]
  );

  // --- Additional Controls ---
  const triggerAlmostFullSim = useCallback((slotId) => {
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
  }, [slots, speakText, addActivity]);

  const triggerSlotFullSim = useCallback((slotId) => {
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
  }, [slots, addActivity, announceSequence]);

  const triggerSensorErrorSim = useCallback(() => {
    setMachineState('error');
    setSensors((prev) =>
      prev.map((sen, idx) => (idx === 0 ? { ...sen, status: 'error', signalState: 'FAULT' } : sen))
    );
    speakText('Sensor error detected.');
    addActivity('Hardware Error Simulated', 'Entry IR sensor hardware fault', 'error', 'AlertOctagon');
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
        speakText('The machine is offline.');
        addActivity('ESP32 Disconnected', 'Wi-Fi connection lost', 'error', 'WifiOff');
      } else {
        setMachineState('active');
        speakText('The machine is ready.');
        addActivity('ESP32 Connected', 'Wi-Fi link established', 'success', 'Wifi');
      }
      return nextState;
    });
  }, [speakText, addActivity]);

  const handleEmergencyStop = useCallback(() => {
    setMachineState('paused');
    setCoinEntryEnabled(false);
    setEmergencyModal(false);
    speakText('Coin insertion has been paused.');
    addActivity('Emergency Stop Activated', 'Main coin entry servo disabled', 'error', 'ShieldAlert');
  }, [speakText, addActivity]);

  const resumeMachine = useCallback(() => {
    setMachineState('active');
    setCoinEntryEnabled(true);
    speakText('The machine is ready.');
    addActivity('Machine Resumed', 'Coin insertion active', 'success', 'Play');
  }, [speakText, addActivity]);

  const resetAllSlots = useCallback(() => {
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
    addActivity('All Slots Reset', 'All 7 slot counts and totals cleared', 'success', 'RotateCcw');
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
        coinEntryEnabled,
        wifiSignal,
        theme,
        setTheme,
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
