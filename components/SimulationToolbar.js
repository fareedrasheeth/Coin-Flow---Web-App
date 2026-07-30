'use client';
import React, { useState } from 'react';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { SRI_LANKAN_COINS } from '@/lib/constants';
import {
  Sparkles,
  Coins,
  AlertCircle,
  AlertTriangle,
  WifiOff,
  Wifi,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  Radio,
} from 'lucide-react';

export default function SimulationToolbar() {
  const [expanded, setExpanded] = useState(true);
  const {
    insertCoin,
    triggerAlmostFullSim,
    triggerSlotFullSim,
    triggerSensorErrorSim,
    triggerServoErrorSim,
    toggleESPConnectionSim,
    espConnected,
    wsStatus,
  } = useCoinFlow();

  const [selectedSlotForTest, setSelectedSlotForTest] = useState('slot_5');

  return (
    <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-4 shadow-2xl text-gray-900 dark:text-white transition-all">
      {/* Bar Header */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>ESP32 WebSocket Hardware Simulator</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-500/30">
                WebSocket Dev Mode
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Simulate coin detection, voice synthesis, 7 IR sensors, and slot ejection
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Insert Coins Row */}
          <div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-indigo-500" /> Simulate Real-Time Coin Insertion:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {SRI_LANKAN_COINS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => insertCoin(c.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-white/5 hover:bg-indigo-500/20 border border-gray-200 dark:border-white/10 hover:border-indigo-500/50 text-gray-900 dark:text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm flex flex-col items-center gap-0.5"
                >
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{c.name}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Rs. {c.coinValue}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Event Triggers */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Target Slot:</span>
              <select
                value={selectedSlotForTest}
                onChange={(e) => setSelectedSlotForTest(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs outline-none"
              >
                {SRI_LANKAN_COINS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => triggerAlmostFullSim(selectedSlotForTest)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Trigger 80% Almost Full</span>
            </button>

            <button
              onClick={() => triggerSlotFullSim(selectedSlotForTest)}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Trigger 100% Full Slot</span>
            </button>

            <button
              onClick={triggerSensorErrorSim}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Sensor Fault</span>
            </button>

            <button
              onClick={toggleESPConnectionSim}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                espConnected
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {espConnected ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" /> Disconnect ESP32
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" /> Reconnect WebSocket
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
