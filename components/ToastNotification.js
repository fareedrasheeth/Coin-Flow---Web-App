'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { Coins, CheckCircle, Volume2 } from 'lucide-react';

export default function ToastNotification() {
  const { activeToast } = useCoinFlow();

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          key={activeToast.id}
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-20 right-6 z-50 flex items-center gap-4 p-4 rounded-2xl bg-gray-900/90 dark:bg-gray-800/95 backdrop-blur-xl border border-white/10 shadow-2xl text-white max-w-sm"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold shadow-inner"
            style={{ backgroundColor: activeToast.color || '#6C63FF' }}
          >
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-white truncate">{activeToast.title}</h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5 truncate">{activeToast.text}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
              <Volume2 className="w-3 h-3" />
              <span>Voice Announcement Spoken</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
