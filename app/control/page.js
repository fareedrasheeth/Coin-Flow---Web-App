'use client';
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import {
  Sliders,
  Play,
  Pause,
  ShieldAlert,
  Zap,
  RotateCcw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function MachineControlPage() {
  const {
    machineState,
    resumeMachine,
    handleEmergencyStop,
    setEmergencyModal,
    resetAllSlots,
    toggleESPConnectionSim,
    espConnected,
    servos,
    slots,
    requestSlotReset,
    speakText,
  } = useCoinFlow();

  const [selectedSlotToReset, setSelectedSlotToReset] = useState(slots[0].id);

  const testServoMovement = (servoName) => {
    speakText(`Testing ${servoName}.`);
  };

  return (
    <AppShell pageTitle="Machine Control & Testing">
      <div className="space-y-6">
        {/* Top Control Panel */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-6 h-6 text-indigo-500" />
                <span>ESP32 Machine Control Dashboard</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Direct motor control, entry servo toggles, emergency stop, and compartment slot resets.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Current Status:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {machineState}
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={resumeMachine}
              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-5 h-5" /> Start / Resume Machine
            </button>

            <button
              onClick={handleEmergencyStop}
              className="p-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Pause className="w-5 h-5" /> Pause Coin Entry
            </button>

            <button
              onClick={() => setEmergencyModal(true)}
              className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition-all border border-red-500/50"
            >
              <ShieldAlert className="w-5 h-5" /> EMERGENCY STOP
            </button>

            <button
              onClick={toggleESPConnectionSim}
              className={`p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                espConnected
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              {espConnected ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
              <span>{espConnected ? 'Disconnect ESP32' : 'Reconnect ESP32'}</span>
            </button>
          </div>
        </div>

        {/* Servo Motors Manual Test Panel */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
            <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Individual Servo Actuator Testing</span>
            </h3>
            <span className="text-xs text-gray-400">PWM Servo Calibration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {servos.map((ser) => (
              <div
                key={ser.id}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">{ser.name}</span>
                    <span className="text-[10px] font-mono text-gray-400">{ser.gpio}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Angle: <span className="text-indigo-400 font-bold">{ser.currentAngle}°</span> (Home 0° / Eject 90°)
                  </div>
                </div>

                <button
                  onClick={() => testServoMovement(ser.name)}
                  className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" /> Test Sweep Movement
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Slot Resets Section */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-4">
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-500" />
            <span>Compartment Slot Resets</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="text-xs text-gray-400 block mb-1">Select Compartment to Reset:</label>
              <select
                value={selectedSlotToReset}
                onChange={(e) => setSelectedSlotToReset(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-white outline-none"
              >
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.count} coins • Rs.{s.totalValue})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const target = slots.find((s) => s.id === selectedSlotToReset);
                if (target) requestSlotReset(target);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all mt-auto"
            >
              <RotateCcw className="w-4 h-4" /> Reset Selected Slot
            </button>

            <button
              onClick={resetAllSlots}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors mt-auto"
            >
              <RotateCcw className="w-4 h-4" /> Clear All Slot Counters
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
