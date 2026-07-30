'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '@/lib/mockData';

export default function ActivityFeed({ events }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm flex items-center gap-2">
          <motion.span
            className="w-2 h-2 rounded-full bg-success"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          Real-Time Activity
        </h3>
        <span className="text-text-secondary text-[10px]">Live Feed</span>
      </div>

      <div className="space-y-2 min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 text-text-secondary"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 opacity-30">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-xs">Waiting for coin events...</p>
              <p className="text-[10px] mt-1">Insert a coin to see activity here</p>
            </motion.div>
          ) : (
            events.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, x: -30, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 30, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-card-border"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{
                    background: event.type === 'servo' ? 'rgba(255,184,0,0.15)' : 'rgba(108,99,255,0.15)',
                    border: `1px solid ${event.type === 'servo' ? 'rgba(255,184,0,0.3)' : 'rgba(108,99,255,0.3)'}`,
                  }}
                >
                  {event.type === 'servo' ? '⚙️' : '🪙'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{event.message}</p>
                  <p className="text-[10px] text-text-secondary">
                    {event.denomination && `+Rs.${event.denomination}`}
                    {' · '}
                    {timeAgo(event.timestamp)}
                  </p>
                </div>
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: 3, duration: 0.5 }}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
