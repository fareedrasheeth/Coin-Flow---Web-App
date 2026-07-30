'use client';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function TotalSavingsCard({ totalSavings }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (val) =>
    new Intl.NumberFormat('en-LK').format(Math.round(val))
  );
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    spring.set(totalSavings);
  }, [totalSavings, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card glow-border relative overflow-hidden p-6 md:p-8"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-text-secondary text-sm font-medium mb-1">Total Savings</p>
            <div className="flex items-baseline gap-2">
              <span className="text-text-secondary text-2xl font-heading font-bold">Rs.</span>
              <motion.span
                className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold neon-text"
              >
                {displayValue}
              </motion.span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1">
            <motion.div
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(0, 255, 148, 0.15)', color: '#00FF94' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              +12.5% this week
            </motion.div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <QuickStat label="Today" value={`Rs. ${Math.floor(totalSavings * 0.05)}`} trend="+18%" />
          <QuickStat label="This Week" value={`Rs. ${Math.floor(totalSavings * 0.25)}`} trend="+12%" />
          <QuickStat label="Coins Sorted" value={Math.floor(totalSavings / 5).toString()} trend="↑" />
        </div>
      </div>

      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-accent/10 to-primary/5 blur-2xl pointer-events-none" />
    </motion.div>
  );
}

function QuickStat({ label, value, trend }) {
  return (
    <div className="text-center md:text-left">
      <p className="text-text-secondary text-[10px] md:text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="font-heading font-bold text-sm md:text-base">{value}</p>
      <p className="text-success text-[10px] font-medium">{trend}</p>
    </div>
  );
}
