'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import TotalSavingsCard from '@/components/TotalSavingsCard';
import CoinSlotCard from '@/components/CoinSlotCard';
import ActivityFeed from '@/components/ActivityFeed';
import CoinDropAnimation from '@/components/CoinDropAnimation';
import { useCoins } from '@/hooks/useCoins';
import { useVoice } from '@/hooks/useVoice';
import { exportToCSV } from '@/lib/exportUtils';
import { Toaster, toast } from 'react-hot-toast';

export default function DashboardPage() {
  const { slots, totalSavings, activityFeed, coinAnimation } = useCoins();
  const { enabled: voiceEnabled, setEnabled: setVoiceEnabled, announceCoin } = useVoice();
  const [isKiosk, setIsKiosk] = useState(false);

  // Announce coin when detected
  useEffect(() => {
    if (coinAnimation) {
      announceCoin(coinAnimation.denomination, coinAnimation.label);
    }
  }, [coinAnimation, announceCoin]);

  const toggleKiosk = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsKiosk(true);
      toast.success("Kiosk Mode Activated");
    } else {
      document.exitFullscreen();
      setIsKiosk(false);
    }
  };

  const handleExport = () => {
    const reportData = slots.map(s => ({
      Coin: s.label,
      Count: s.coinCount,
      Value: s.totalValue,
      Fill: `${s.fillPercentage}%`
    }));
    exportToCSV(reportData, 'coinflow-inventory.csv');
    toast.success("Report exported successfully!");
  };

  return (
    <AppShell>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(20,20,30,0.95)',
            color: '#F0F4FF',
            border: '1px solid rgba(108,99,255,0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />

      {/* Coin Drop Animation */}
      <CoinDropAnimation coinAnimation={coinAnimation} />

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">
          Dashboard
        </h1>
        <p className="text-text-secondary text-sm">
          Real-time monitoring of your smart coin sorting machine
        </p>
      </motion.div>

      {/* Total Savings */}
      <TotalSavingsCard totalSavings={totalSavings} />

      {/* Coin Slots Grid */}
      <div className="mt-8 mb-6">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-heading text-lg font-bold mb-4 flex items-center gap-2"
        >
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-accent" />
          Coin Slots
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {slots.map((slot, index) => (
            <CoinSlotCard key={slot.slot_id} slot={slot} index={index} />
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityFeed events={activityFeed} />
        </div>
        <div>
          <QuickActions 
            voiceEnabled={voiceEnabled} 
            setVoiceEnabled={setVoiceEnabled} 
            toggleKiosk={toggleKiosk}
            handleExport={handleExport}
          />
        </div>
      </div>
    </AppShell>
  );
}

function QuickActions({ voiceEnabled, setVoiceEnabled, toggleKiosk, handleExport }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="glass-card p-5"
    >
      <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Quick Actions
      </h3>
      <div className="space-y-2">
        <div className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-card-border">
           <div className="flex items-center gap-3">
             <span className="text-lg">🔊</span>
             <div>
               <p className="text-xs font-semibold">Voice Mode</p>
               <p className="text-[10px] text-text-secondary">Speech updates</p>
             </div>
           </div>
           <div 
             className={`toggle-switch ${voiceEnabled ? 'active' : ''}`} 
             onClick={() => setVoiceEnabled(!voiceEnabled)} 
           />
        </div>
        <ActionButton 
          icon="📺" 
          label="Kiosk Mode" 
          description="Full screen dashboard" 
          onClick={toggleKiosk}
        />
        <ActionButton 
          icon="📊" 
          label="Export Report" 
          description="Download CSV Data" 
          onClick={handleExport}
        />
        <ActionButton icon="🔗" label="Share QR Code" description="Share collection report" />
      </div>
    </motion.div>
  );
}

function ActionButton({ icon, label, description, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-card-border 
        hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[10px] text-text-secondary">{description}</p>
      </div>
    </motion.button>
  );
}
