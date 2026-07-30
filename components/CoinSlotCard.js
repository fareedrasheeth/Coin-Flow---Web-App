'use client';
import { motion } from 'framer-motion';

export default function CoinSlotCard({ slot, index }) {
  const isDanger = slot.status === 'FULL' || slot.status === 'EJECTING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card relative overflow-hidden p-5 ${
        isDanger ? 'border-danger/40' : ''
      }`}
      style={{
        animation: isDanger ? 'slot-danger-flash 2s ease-in-out infinite' : undefined,
      }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${slot.color}20`, border: `1px solid ${slot.color}40` }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay: index * 0.5 }}
            >
              🪙
            </motion.div>
            <div>
              <h3 className="font-heading font-bold text-sm">{slot.label}</h3>
              <p className="text-text-secondary text-[10px]">Slot #{index + 1}</p>
            </div>
          </div>
          <StatusBadge status={slot.status} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-text-secondary text-[10px] uppercase tracking-wider">Count</p>
            <motion.p
              className="font-heading font-bold text-lg"
              key={slot.coinCount}
              initial={{ scale: 1.3, color: slot.color }}
              animate={{ scale: 1, color: 'inherit' }}
              transition={{ duration: 0.3 }}
            >
              {slot.coinCount}
            </motion.p>
          </div>
          <div>
            <p className="text-text-secondary text-[10px] uppercase tracking-wider">Value</p>
            <p className="font-heading font-bold text-lg" style={{ color: slot.color }}>
              Rs.{slot.totalValue}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-text-secondary text-[10px]">Slot Fill</span>
            <span className="text-[10px] font-semibold" style={{ color: isDanger ? '#FF4D6D' : slot.color }}>
              {slot.fillPercentage}%
            </span>
          </div>
          <div className="progress-track">
            <motion.div
              className={`progress-fill ${isDanger ? 'danger' : ''}`}
              initial={{ width: 0 }}
              animate={{ width: `${slot.fillPercentage}%` }}
              transition={{ duration: 1, delay: 0.2 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Servo Threshold */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-text-secondary text-[10px]">Servo @ Rs.{slot.servoThreshold}</span>
          {isDanger && (
            <motion.span
              className="text-[10px] font-bold text-danger"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              ⚡ TRIGGERED
            </motion.span>
          )}
        </div>
      </div>

      {/* Glow overlay for danger state */}
      {isDanger && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(255,77,109,0.1) 0%, transparent 70%)' }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      {/* Color accent */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ background: slot.color }}
      />
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: 'badge-active',
    FULL: 'badge-full',
    EJECTING: 'badge-ejecting',
  };

  return (
    <span className={`badge ${styles[status] || 'badge-active'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'ACTIVE' ? 'bg-success' : status === 'FULL' ? 'bg-danger' : 'bg-warning'
      }`} />
      {status}
    </span>
  );
}
