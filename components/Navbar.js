'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { generateMockNotifications } from '@/lib/mockData';
import { NOTIFICATION_TYPES } from '@/lib/constants';
import { timeAgo } from '@/lib/mockData';

export default function Navbar({ onMenuClick }) {
  const { isDark, toggle } = useDarkMode();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => generateMockNotifications());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="navbar fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-4 md:px-6">
      {/* Left: Hamburger (mobile) + Title */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white text-sm font-bold">₵</span>
          </div>
          <span className="font-heading font-bold neon-text">CoinFlow</span>
        </div>
      </div>

      {/* Center: Search (desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-md ml-72">
        <div className="relative w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search coins, slots, events..."
            className="input-field pl-10 py-2 text-sm"
          />
        </div>
      </div>

      {/* Right: Toggle + Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <motion.button
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={toggle}
          whileTap={{ scale: 0.9, rotate: 180 }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.svg
                key="moon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </motion.svg>
            ) : (
              <motion.svg
                key="sun"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Notification Bell */}
        <div className="relative">
          <motion.button
            className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) markAllRead();
            }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="notification-dot"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute right-0 top-12 w-80 glass-card-static p-0 overflow-hidden"
              >
                <div className="p-4 border-b border-card-border">
                  <h3 className="font-heading font-semibold text-sm">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const type = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.COIN_DETECTED;
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-start gap-3 p-3 border-b border-card-border hover:bg-white/5 transition-colors ${
                            !n.read ? 'bg-primary/5' : ''
                          }`}
                        >
                          <span className="text-lg mt-0.5">{type.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{n.message}</p>
                            <p className="text-[10px] text-text-secondary mt-1">{timeAgo(n.timestamp)}</p>
                          </div>
                          <button
                            onClick={() => dismissNotification(n.id)}
                            className="text-text-secondary hover:text-danger transition-colors p-1"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <motion.div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-white text-sm font-bold">CF</span>
        </motion.div>
      </div>
    </header>
  );
}
