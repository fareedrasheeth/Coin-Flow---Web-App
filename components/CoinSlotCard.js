'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useCoinFlow } from '@/context/CoinFlowContext';
import {
  RotateCcw,
  Cpu,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';

export default function CoinSlotCard({ slot }) {
  const { requestSlotReset } = useCoinFlow();

  const isFull = slot.capacityPercentage >= 100 || slot.status === 'full';
  const isAlmostFull = slot.capacityPercentage >= 80 && !isFull;

  const getStatusBadge = () => {
    if (isFull) {
      return {
        label: 'FULL',
        bg: 'bg-red-500/20 text-red-400 border-red-500/40',
        dot: 'bg-red-500 animate-ping',
      };
    }
    if (isAlmostFull) {
      return {
        label: 'ALMOST FULL',
        bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        dot: 'bg-amber-500 animate-ping',
      };
    }
    if (slot.servoStatus === 'ejecting') {
      return {
        label: 'EJECTING',
        bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
        dot: 'bg-indigo-500 animate-ping',
      };
    }
    return {
      label: 'AVAILABLE',
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
    };
  };

  const badge = getStatusBadge();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`relative rounded-3xl p-5 backdrop-blur-xl transition-all duration-300 ${
        isFull
          ? 'bg-gray-900 border-2 border-red-500 shadow-2xl shadow-red-500/20 ring-4 ring-red-500/20'
          : isAlmostFull
          ? 'bg-gray-900/90 border border-amber-500/40 shadow-xl'
          : 'bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg'
      }`}
    >
      {/* Top Warning Highlight for Full Slot */}
      {isFull && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500 rounded-t-3xl animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-md"
            style={{ backgroundColor: slot.color || '#6C63FF' }}
          >
            🪙
          </div>
          <div>
            <h4 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
              {slot.label}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Value: Rs.{slot.coinValue}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${badge.bg}`}
        >
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs">
        <div>
          <span className="text-[10px] text-gray-400 block uppercase font-medium">Coin Count</span>
          <span className="text-base font-bold text-gray-900 dark:text-white">{slot.count} Coins</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 block uppercase font-medium">Slot Total</span>
          <span className="text-base font-bold text-emerald-500">Rs. {slot.totalValue}</span>
        </div>
      </div>

      {/* Progress Bar & Capacity */}
      <div className="space-y-1.5 my-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 dark:text-gray-400">Capacity</span>
          <span
            className={`font-mono font-bold ${
              isFull ? 'text-red-500' : isAlmostFull ? 'text-amber-500' : 'text-emerald-500'
            }`}
          >
            {slot.capacityPercentage}% ({slot.limitType === 'count' ? `${slot.count}/${slot.maximumLimit} coins` : `Rs.${slot.totalValue}/Rs.${slot.maximumLimit}`})
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull
                ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                : isAlmostFull
                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${Math.min(100, slot.capacityPercentage)}%` }}
          />
        </div>
      </div>

      {/* Hardware Telemetry: IR Sensor & Servo */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>IR:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
            {slot.sensorStatus || 'Active'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Servo:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {slot.servoAngle > 0 ? `${slot.servoAngle}° Ejected` : 'Ready 0°'}
          </span>
        </div>
      </div>

      {/* Footer: Reset Button */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Clock className="w-3 h-3" />
          <span>
            {slot.lastDetectedAt
              ? new Date(slot.lastDetectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Idle'}
          </span>
        </div>

        <button
          onClick={() => requestSlotReset(slot)}
          disabled={!isFull && slot.capacityPercentage < 80}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isFull
              ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg animate-pulse'
              : isAlmostFull
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
              : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Slot</span>
        </button>
      </div>
    </motion.div>
  );
}
