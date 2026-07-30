'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { COIN_SLOTS } from '@/lib/constants';
import { generateMockSlotData, generateMockEvents } from '@/lib/mockData';

export default function AdminPage() {
  const [slots, setSlots] = useState(() => generateMockSlotData());
  const [events, setEvents] = useState(() => generateMockEvents(30));
  const [activeTab, setActiveTab] = useState('slots');
  const [showConfirm, setShowConfirm] = useState(null);
  const [servoValues, setServoValues] = useState(() => {
    const sv = {};
    COIN_SLOTS.forEach((s) => { sv[s.slot_id] = s.servoThreshold; });
    return sv;
  });

  const resetSlot = (slotId) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.slot_id === slotId
          ? { ...s, coinCount: 0, totalValue: 0, fillPercentage: 0, status: 'ACTIVE' }
          : s
      )
    );
    setShowConfirm(null);
  };

  const resetAll = () => {
    setSlots((prev) =>
      prev.map((s) => ({ ...s, coinCount: 0, totalValue: 0, fillPercentage: 0, status: 'ACTIVE' }))
    );
    setShowConfirm(null);
  };

  const tabs = [
    { id: 'slots', label: 'Slot Management', icon: '🎰' },
    { id: 'events', label: 'Event History', icon: '📋' },
    { id: 'config', label: 'Configuration', icon: '⚙️' },
    { id: 'users', label: 'Users', icon: '👥' },
  ];

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Admin Panel</h1>
        <p className="text-text-secondary text-sm">Manage your coin sorting machine</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-white/5 text-text-secondary border border-card-border hover:border-primary/20'
            }`}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'slots' && (
          <motion.div
            key="slots"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button className="btn-danger text-xs" onClick={() => setShowConfirm('all')}>
                🔄 Reset All Slots
              </button>
              <button className="btn-primary text-xs">📄 Export PDF</button>
              <button className="btn-secondary text-xs">📊 Export Excel</button>
            </div>

            {/* Slots Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Slot</th>
                      <th>Coin Count</th>
                      <th>Total Value</th>
                      <th>Fill %</th>
                      <th>Status</th>
                      <th>Servo Threshold</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot, i) => (
                      <motion.tr
                        key={slot.slot_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🪙</span>
                            <span className="font-semibold text-sm">{slot.label}</span>
                          </div>
                        </td>
                        <td className="font-mono font-semibold">{slot.coinCount}</td>
                        <td className="font-mono font-semibold" style={{ color: slot.color }}>
                          Rs.{slot.totalValue}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="progress-track w-16">
                              <div
                                className={`progress-fill ${slot.fillPercentage >= 90 ? 'danger' : ''}`}
                                style={{ width: `${slot.fillPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono">{slot.fillPercentage}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            slot.status === 'ACTIVE' ? 'badge-active' :
                            slot.status === 'FULL' ? 'badge-full' : 'badge-ejecting'
                          }`}>
                            {slot.status}
                          </span>
                        </td>
                        <td className="font-mono text-sm">Rs.{slot.servoThreshold}</td>
                        <td>
                          <button
                            className="btn-secondary text-[10px] px-3 py-1.5"
                            onClick={() => setShowConfirm(slot.slot_id)}
                          >
                            Reset
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Coin</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((evt, i) => (
                      <motion.tr
                        key={evt.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <td className="text-text-secondary text-xs font-mono whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${evt.type === 'servo' ? 'badge-ejecting' : 'badge-active'}`}>
                            {evt.type === 'servo' ? '⚙️ Servo' : '🪙 Coin'}
                          </span>
                        </td>
                        <td className="font-semibold text-sm">{evt.coinLabel}</td>
                        <td className="text-xs">{evt.message}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass-card p-6">
              <h3 className="font-heading font-bold text-sm mb-4">Servo Trigger Configuration</h3>
              <p className="text-text-secondary text-xs mb-6">
                Set the value threshold at which each slot auto-ejects coins
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {COIN_SLOTS.map((slot) => (
                  <div key={slot.slot_id} className="p-4 rounded-xl bg-white/[0.03] border border-card-border">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🪙</span>
                      <span className="font-semibold text-sm">{slot.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-xs">Rs.</span>
                      <input
                        type="number"
                        className="input-field text-center font-mono font-bold"
                        value={servoValues[slot.slot_id] || 500}
                        onChange={(e) =>
                          setServoValues((prev) => ({
                            ...prev,
                            [slot.slot_id]: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button className="btn-primary">💾 Save Configuration</button>
                <button className="btn-secondary">↩️ Reset to Defaults</button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass-card p-6">
              <h3 className="font-heading font-bold text-sm mb-4">User Management</h3>
              <div className="space-y-3">
                {[
                  { name: 'Admin User', email: 'admin@coinflow.lk', role: 'Admin', avatar: 'A' },
                  { name: 'Operator', email: 'operator@coinflow.lk', role: 'User', avatar: 'O' },
                  { name: 'Viewer', email: 'viewer@coinflow.lk', role: 'User', avatar: 'V' },
                ].map((user, i) => (
                  <motion.div
                    key={user.email}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-card-border"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-text-secondary text-xs">{user.email}</p>
                    </div>
                    <span className={`badge ${user.role === 'Admin' ? 'badge-ejecting' : 'badge-active'}`}>
                      {user.role}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-static p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading font-bold text-lg mb-2">⚠️ Confirm Reset</h3>
              <p className="text-text-secondary text-sm mb-6">
                {showConfirm === 'all'
                  ? 'Are you sure you want to reset ALL slot counts? This cannot be undone.'
                  : `Are you sure you want to reset the ${
                      COIN_SLOTS.find((s) => s.slot_id === showConfirm)?.label
                    } slot?`}
              </p>
              <div className="flex gap-3">
                <button
                  className="btn-danger flex-1"
                  onClick={() => (showConfirm === 'all' ? resetAll() : resetSlot(showConfirm))}
                >
                  Yes, Reset
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowConfirm(null)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
