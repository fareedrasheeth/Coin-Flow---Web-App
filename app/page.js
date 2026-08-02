'use client';
import React from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import LatestCoinCard from '@/components/LatestCoinCard';
import CoinSlotCard from '@/components/CoinSlotCard';
import SimulationToolbar from '@/components/SimulationToolbar';
import {
  Coins,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Wifi,
  WifiOff,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function OverviewPage() {
  const {
    slots,
    totalCoins,
    totalValue,
    machineState,
    espConnected,
    resumeMachine,
    setEmergencyModal,
    resetAllSlots,
  } = useCoinFlow();

  const activeSlotsCount = slots.filter((s) => s.status === 'available').length;
  const fullSlotsCount = slots.filter((s) => s.capacityPercentage >= 100).length;

  const getMachineStateBadge = () => {
    switch (machineState) {
      case 'active':
        return {
          title: 'Machine Active',
          desc: 'Coin entry enabled and IR sensors actively scanning',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          dot: 'bg-emerald-400 animate-ping',
        };
      case 'sorting':
        return {
          title: 'Sorting Coin',
          desc: 'Coin passing through size tray & IR detection',
          color: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/30',
          dot: 'bg-blue-400 animate-pulse',
        };
      case 'paused':
        return {
          title: 'Machine Paused',
          desc: 'Main coin entry servo halted',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          dot: 'bg-amber-400 animate-ping',
        };
      case 'slot_full':
        return {
          title: 'Compartment Full Alert',
          desc: 'A slot limit was reached. Entry servo halted. Reset required.',
          color: 'text-red-400',
          bg: 'bg-red-500/20 border-red-500/40',
          dot: 'bg-red-500 animate-ping',
        };
      case 'offline':
        return {
          title: 'ESP32 Offline',
          desc: 'Attempting Wi-Fi re-connection...',
          color: 'text-gray-400',
          bg: 'bg-gray-500/10 border-gray-500/30',
          dot: 'bg-gray-400',
        };
      default:
        return {
          title: 'Hardware Fault',
          desc: 'Sensor or servo fault detected',
          color: 'text-red-500',
          bg: 'bg-red-600/20 border-red-600/40',
          dot: 'bg-red-600 animate-ping',
        };
    }
  };

  const statusInfo = getMachineStateBadge();

  return (
    <AppShell pageTitle="Dashboard">
      {/* Top Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value Card */}
        <div className="rounded-3xl p-5 bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
              Total Value Collected
            </span>
            <div className="text-2xl font-extrabold text-emerald-500 mt-1">
              Rs. {totalValue.toLocaleString()}
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">Sri Lankan Rupees</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Total Coins Card */}
        <div className="rounded-3xl p-5 bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
              Total Coins
            </span>
            <div className="text-2xl font-extrabold text-indigo-500 dark:text-indigo-400 mt-1">
              {totalCoins} Coins
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">Across 7 Categories</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Active Slots Card */}
        <div className="rounded-3xl p-5 bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
              Active Slots
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {activeSlotsCount} of 7
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">Receiving Coins</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Full Slots Card */}
        <div className="rounded-3xl p-5 bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
              Full Slots
            </span>
            <div className={`text-2xl font-extrabold mt-1 ${fullSlotsCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {fullSlotsCount} of 7
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              {fullSlotsCount > 0 ? 'Ejection Active' : 'All Clear'}
            </span>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
              fullSlotsCount > 0
                ? 'bg-red-500/20 text-red-500 border-red-500/40 animate-bounce'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Machine Telemetry Banner */}
      <div className={`rounded-3xl p-6 border shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${statusInfo.bg}`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gray-900/80 border border-white/10 flex items-center justify-center text-2xl">
              <Activity className={`w-8 h-8 ${statusInfo.color}`} />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusInfo.dot}`} />
              <span className={`relative inline-flex rounded-full h-4 w-4 ${statusInfo.dot}`} />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{statusInfo.title}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
                {machineState}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{statusInfo.desc}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {machineState === 'paused' || machineState === 'slot_full' ? (
            <button
              onClick={resumeMachine}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
            >
              <Play className="w-4 h-4" /> Resume Machine
            </button>
          ) : (
            <button
              onClick={() => setEmergencyModal(true)}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
            >
              <ShieldAlert className="w-4 h-4" /> Emergency Stop
            </button>
          )}

          <button
            onClick={resetAllSlots}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/15 text-gray-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset All
          </button>
        </div>
      </div>

      {/* Developer Hardware Simulator Floating Control */}
      <SimulationToolbar />

      {/* Latest Coin Detected Component */}
      <LatestCoinCard />

      {/* Seven Coin Slot Cards Grid Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              7 Storage Compartment Slots
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Live capacity limits, IR sensor detection state & servo motor positions
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-500 dark:text-indigo-400">
            Real-time Telemetry
          </span>
        </div>

        {/* 7 Slot Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {slots.map((slot) => (
            <CoinSlotCard key={slot.id} slot={slot} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
