'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { RotateCcw, AlertCircle, X, Check } from 'lucide-react';

export default function ResetConfirmModal() {
  const { resetConfirmModal, setResetConfirmModal, confirmSlotReset } = useCoinFlow();
  const { isOpen, slot } = resetConfirmModal;

  if (!isOpen || !slot) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-white"
        >
          <button
            onClick={() => setResetConfirmModal({ isOpen: false, slot: null })}
            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4">
            <RotateCcw className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Confirm Slot Reset
          </h3>
          <p className="text-sm text-gray-300 mb-6">
            Have you removed all coins from the <span className="font-semibold text-emerald-400">{slot.label}</span> compartment?
          </p>

          <div className="p-3 bg-white/5 border border-white/10 rounded-xl mb-6 text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Current Count:</span>
              <span className="font-medium text-white">{slot.count} coins</span>
            </div>
            <div className="flex justify-between">
              <span>Current Value:</span>
              <span className="font-medium text-white">Rs. {slot.totalValue}</span>
            </div>
            <p className="text-[11px] text-amber-400 pt-1">
              Resetting will return the compartment servo to home position and set the slot counter to zero.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setResetConfirmModal({ isOpen: false, slot: null })}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmSlotReset(slot.id)}
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Reset</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
