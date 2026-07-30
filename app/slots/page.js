'use client';
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import CoinSlotCard from '@/components/CoinSlotCard';
import { Grid, Sliders, RotateCcw, Save, ShieldCheck } from 'lucide-react';

export default function CoinSlotsPage() {
  const { slots, updateSlotLimit, resetAllSlots } = useCoinFlow();
  const [selectedSlot, setSelectedSlot] = useState(slots[0].id);

  const activeSlot = slots.find((s) => s.id === selectedSlot) || slots[0];
  const [limitVal, setLimitVal] = useState(activeSlot.maximumLimit);
  const [limitType, setLimitType] = useState(activeSlot.limitType);

  const handleSaveLimit = () => {
    updateSlotLimit(activeSlot.id, parseInt(limitVal, 10), limitType);
  };

  return (
    <AppShell pageTitle="Coin Storage Slots">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Grid className="w-6 h-6 text-indigo-500" />
            <span>Coin Storage Compartments & Limits</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure individual slot limits based on maximum coin count or monetary value limit (Rs.).
          </p>
        </div>

        <button
          onClick={resetAllSlots}
          className="px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/15 text-gray-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset All Compartments
        </button>
      </div>

      {/* Slot Limit Configurator Panel */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-gray-900 to-gray-900 p-6 rounded-3xl border border-indigo-500/30 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-sm text-white">Capacity Limit Configurator</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Select Slot */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Select Compartment:</label>
            <select
              value={selectedSlot}
              onChange={(e) => {
                setSelectedSlot(e.target.value);
                const s = slots.find((item) => item.id === e.target.value);
                if (s) {
                  setLimitVal(s.maximumLimit);
                  setLimitType(s.limitType);
                }
              }}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} (Current Limit: {s.limitType === 'count' ? `${s.maximumLimit} coins` : `Rs.${s.maximumLimit}`})
                </option>
              ))}
            </select>
          </div>

          {/* Select Limit Type */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Limit Criteria:</label>
            <select
              value={limitType}
              onChange={(e) => setLimitType(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
            >
              <option value="value">Maximum Slot Value (Rs.)</option>
              <option value="count">Maximum Coin Count</option>
            </select>
          </div>

          {/* Limit Value */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Max {limitType === 'count' ? 'Coin Count' : 'Value (Rs.)'}:
            </label>
            <input
              type="number"
              min="10"
              step="10"
              value={limitVal}
              onChange={(e) => setLimitVal(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveLimit}
            className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Save className="w-4 h-4" /> Save Slot Limit
          </button>
        </div>
      </div>

      {/* Grid of 7 Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {slots.map((slot) => (
          <CoinSlotCard key={slot.id} slot={slot} />
        ))}
      </div>
    </AppShell>
  );
}
