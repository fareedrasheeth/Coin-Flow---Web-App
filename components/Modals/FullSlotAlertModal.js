'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { AlertTriangle, ShieldAlert, CheckCircle2, RotateCcw, X } from 'lucide-react';

export default function FullSlotAlertModal() {
  const { fullSlotModal, setFullSlotModal, requestSlotReset } = useCoinFlow();
  const { isOpen, slot } = fullSlotModal;

  if (!isOpen || !slot) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-gray-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden text-white"
        >
          {/* Top Warning Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-red-600 animate-pulse" />

          <button
            onClick={() => setFullSlotModal({ isOpen: false, slot: null })}
            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                High Priority Alert
              </span>
              <h2 className="text-2xl font-bold mt-1 text-white">{slot.label} Compartment Full</h2>
              <p className="text-sm text-gray-400 mt-1">
                The {slot.label} compartment has reached its limit. Coin insertion has been paused.
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Coin Type:</span>
              <span className="font-semibold text-white">{slot.label}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Current Count:</span>
              <span className="font-semibold text-white">{slot.count} Coins</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Current Slot Value:</span>
              <span className="font-semibold text-emerald-400">Rs. {slot.totalValue}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Ejection Servo Status:</span>
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Active (Pushed 90°)
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Machine Status:</span>
              <span className="font-semibold text-red-400 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Paused (Entry Blocked)
              </span>
            </div>
          </div>

          {/* Action Message */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Please remove the physical coins from the compartment, then click "Reset Slot" to resume.</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setFullSlotModal({ isOpen: false, slot: null })}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
            >
              Acknowledge Alert
            </button>
            <button
              onClick={() => {
                setFullSlotModal({ isOpen: false, slot: null });
                requestSlotReset(slot);
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Slot Now</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
