'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { ACHIEVEMENT_TIERS } from '@/lib/constants';
import { generateMockSlotData } from '@/lib/mockData';

export default function RewardsPage() {
  const [totalSavings] = useState(() => {
    const slots = generateMockSlotData();
    return slots.reduce((sum, s) => sum + s.totalValue, 0);
  });

  const currentTierIndex = ACHIEVEMENT_TIERS.findIndex((t) => totalSavings < t.threshold);
  const nextTier = ACHIEVEMENT_TIERS[currentTierIndex] || ACHIEVEMENT_TIERS[ACHIEVEMENT_TIERS.length - 1];
  const prevThreshold = currentTierIndex > 0 ? ACHIEVEMENT_TIERS[currentTierIndex - 1].threshold : 0;
  const progressToNext = Math.min(
    100,
    Math.round(((totalSavings - prevThreshold) / (nextTier.threshold - prevThreshold)) * 100)
  );

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Rewards & Achievements</h1>
        <p className="text-text-secondary text-sm">Unlock tiers by saving more coins!</p>
      </motion.div>

      {/* Current Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card glow-border p-6 mb-8 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-text-secondary text-sm">Current Savings</p>
              <p className="font-heading text-3xl font-bold neon-text">Rs. {totalSavings.toLocaleString()}</p>
            </div>
            <motion.div
              className="text-6xl"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              {nextTier.emoji}
            </motion.div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-text-secondary">Progress to {nextTier.label}</span>
            <span className="text-xs font-bold" style={{ color: nextTier.color }}>{progressToNext}%</span>
          </div>
          <div className="progress-track h-3">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${nextTier.color}, #00D4FF)` }}
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-text-secondary">Rs. {prevThreshold.toLocaleString()}</span>
            <span className="text-[10px] text-text-secondary">Rs. {nextTier.threshold.toLocaleString()}</span>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: nextTier.color }} />
      </motion.div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ACHIEVEMENT_TIERS.map((tier, index) => {
          const isUnlocked = totalSavings >= tier.threshold;
          const isNext = !isUnlocked && (index === 0 || totalSavings >= ACHIEVEMENT_TIERS[index - 1].threshold);

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              className={`glass-card relative overflow-hidden p-6 text-center ${
                isUnlocked ? '' : 'achievement-locked'
              }`}
              style={isUnlocked ? { borderColor: `${tier.color}40`, boxShadow: `0 0 20px ${tier.color}20` } : {}}
            >
              {/* Badge */}
              <motion.div
                className="text-6xl mb-4 inline-block"
                animate={isUnlocked ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                {tier.emoji}
              </motion.div>

              <h3 className="font-heading font-bold text-lg mb-1">{tier.label}</h3>
              <p className="text-text-secondary text-xs mb-4">
                Save Rs. {tier.threshold.toLocaleString()}
              </p>

              {isUnlocked ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `${tier.color}20`, color: tier.color, border: `1px solid ${tier.color}40` }}
                >
                  ✅ Unlocked
                </motion.div>
              ) : isNext ? (
                <div className="text-xs font-medium text-text-secondary">
                  🔓 Next Tier
                </div>
              ) : (
                <div className="text-xs text-text-secondary">🔒 Locked</div>
              )}

              {/* Decorative glow */}
              {isUnlocked && (
                <div
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ background: tier.color }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Savings Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="glass-card p-6 mt-8"
      >
        <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
          <span>💡</span> Tips to Level Up
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TipCard emoji="🪙" title="Collect Daily" description="Insert coins every day to build momentum" />
          <TipCard emoji="💰" title="Mix Denominations" description="Higher value coins unlock tiers faster" />
          <TipCard emoji="🎯" title="Set Goals" description="Aim for the next tier milestone each week" />
        </div>
      </motion.div>
    </AppShell>
  );
}

function TipCard({ emoji, title, description }) {
  return (
    <motion.div
      className="p-4 rounded-xl bg-white/[0.03] border border-card-border"
      whileHover={{ y: -2, borderColor: 'rgba(108,99,255,0.4)' }}
    >
      <span className="text-2xl mb-2 block">{emoji}</span>
      <h4 className="font-heading font-bold text-sm mb-1">{title}</h4>
      <p className="text-text-secondary text-xs">{description}</p>
    </motion.div>
  );
}
