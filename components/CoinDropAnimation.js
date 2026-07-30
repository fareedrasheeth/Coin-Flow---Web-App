'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CoinDropAnimation({ coinAnimation }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (coinAnimation) {
      const newParticles = Array.from({ length: 5 }, (_, i) => ({
        id: `${Date.now()}_${i}`,
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
        delay: Math.random() * 0.5,
        size: 20 + Math.random() * 20,
        duration: 1.5 + Math.random() * 1,
      }));
      const renderTimer = setTimeout(() => {
        setParticles(newParticles);
      }, 0);
      const timer = setTimeout(() => setParticles([]), 3000);
      return () => {
        clearTimeout(renderTimer);
        clearTimeout(timer);
      };
    }
  }, [coinAnimation]);

  const screenH = typeof window !== 'undefined' ? window.innerHeight + 50 : 800;

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="fixed pointer-events-none z-50"
          style={{ left: p.x, top: -50, fontSize: p.size }}
          initial={{ y: -50, opacity: 0, rotate: 0 }}
          animate={{
            y: screenH,
            opacity: [0, 1, 1, 0],
            rotate: 720,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        >
          🪙
        </motion.div>
      ))}
      {coinAnimation && (
        <motion.div
          className="fixed top-20 left-1/2 z-50 pointer-events-none"
          style={{ transform: 'translateX(-50%)' }}
          initial={{ opacity: 0, y: -20, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [-20, 30, 30, 60],
            scale: [0.5, 1.2, 1, 0.8],
          }}
          transition={{ duration: 2 }}
        >
          <div className="glass-card-static px-4 py-2 flex items-center gap-2">
            <span className="text-lg">🪙</span>
            <span className="font-heading font-bold text-sm neon-text">+Rs.{coinAnimation.denomination}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
