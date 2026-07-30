'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { Coins, Clock, ArrowUpRight, Zap, CheckCircle2 } from 'lucide-react';

export default function LatestCoinCard() {
  const { latestCoin } = useCoinFlow();

  if (!latestCoin) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 via-gray-900 to-gray-900 border border-indigo-500/30 p-6 shadow-xl text-white">
      {/* Background Animated Glow */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Header Tag */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Coins className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Latest Coin Detected
            </h3>
            <p className="text-[11px] text-gray-400">IR Telemetry Feed</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Live Event
        </span>
      </div>

      {/* Main Content with Animated Coin Drop */}
      <AnimatePresence mode="wait">
        <motion.div
          key={latestCoin.detectedAt}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 rounded-2xl p-4 border border-white/10"
        >
          {/* Left Info */}
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg shadow-indigo-500/30 shrink-0"
            >
              🪙
            </motion.div>
            <div>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                {latestCoin.label || latestCoin.type}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Detected at{' '}
                  {new Date(latestCoin.detectedAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Stats */}
          <div className="grid grid-cols-2 gap-3 sm:border-l sm:border-white/10 sm:pl-4">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase font-medium">Slot Count</span>
              <span className="text-lg font-bold text-white">{latestCoin.slotCount} Coins</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase font-medium">Slot Value</span>
              <span className="text-lg font-bold text-emerald-400">Rs. {latestCoin.slotValue}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
