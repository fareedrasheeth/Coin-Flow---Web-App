'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { ShieldAlert, X } from 'lucide-react';

export default function EmergencyModal() {
  const { emergencyModal, setEmergencyModal, handleEmergencyStop } = useCoinFlow();

  if (!emergencyModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-gray-900 border border-red-500/50 rounded-3xl p-6 shadow-2xl text-white"
        >
          <button
            onClick={() => setEmergencyModal(false)}
            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 mb-4 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">
            Confirm Emergency Stop
          </h3>
          <p className="text-sm text-gray-300 mb-6">
            Are you sure you want to trigger an immediate Emergency Stop? This will immediately halt the main coin entry servo and block all new coin sorting.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setEmergencyModal(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEmergencyStop}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>HALT MACHINE</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
