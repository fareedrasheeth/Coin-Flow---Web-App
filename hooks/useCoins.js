'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { COIN_SLOTS } from '@/lib/constants';
import { generateMockSlotData } from '@/lib/mockData';
import { createMQTTClient } from '@/lib/mqtt';

export function useCoins() {
  const [slots, setSlots] = useState(() => generateMockSlotData());
  const [totalSavings, setTotalSavings] = useState(() => {
    const initial = generateMockSlotData();
    return initial.reduce((sum, s) => sum + s.totalValue, 0);
  });
  const [activityFeed, setActivityFeed] = useState([]);
  const [coinAnimation, setCoinAnimation] = useState(null);
  const intervalRef = useRef(null);

  const insertCoin = useCallback((slotId) => {
    setSlots((prev) => {
      const updated = prev.map((slot) => {
        if (slot.slot_id !== slotId) return slot;
        const newCount = slot.coinCount + 1;
        const newValue = newCount * slot.denomination;
        const newFill = Math.min(100, Math.round((newValue / slot.servoThreshold) * 100));
        const newStatus = newFill >= 100 ? 'FULL' : newFill >= 90 ? 'EJECTING' : 'ACTIVE';
        return {
          ...slot,
          coinCount: newCount,
          totalValue: newValue,
          fillPercentage: newFill,
          status: newStatus,
        };
      });
      return updated;
    });

    setTotalSavings((prev) => {
      const slot = COIN_SLOTS.find((s) => s.slot_id === slotId);
      return prev + (slot?.denomination || 0);
    });

    // Add to activity feed
    const slot = COIN_SLOTS.find((s) => s.slot_id === slotId);
    if (slot) {
      const event = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        message: `You inserted a ${slot.label} coin`,
        slotId,
        denomination: slot.denomination,
        timestamp: new Date().toISOString(),
        type: 'coin',
      };

      setActivityFeed((prev) => [event, ...prev].slice(0, 5));
      setCoinAnimation({ slotId, denomination: slot.denomination, label: slot.label });
      setTimeout(() => setCoinAnimation(null), 2000);
    }
  }, []);

  const resetSlot = useCallback((slotId) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.slot_id === slotId
          ? { ...slot, coinCount: 0, totalValue: 0, fillPercentage: 0, status: 'ACTIVE' }
          : slot
      )
    );
  }, []);

  const resetAll = useCallback(() => {
    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        coinCount: 0,
        totalValue: 0,
        fillPercentage: 0,
        status: 'ACTIVE',
      }))
    );
    setTotalSavings(0);
  }, []);

  // Simulate real-time coin insertions
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const randomSlot = COIN_SLOTS[Math.floor(Math.random() * COIN_SLOTS.length)];
      insertCoin(randomSlot.slot_id);
    }, 6000 + Math.random() * 8000); // Random interval 6-14s

    return () => clearInterval(intervalRef.current);
  }, [insertCoin]);

  return { slots, totalSavings, activityFeed, coinAnimation, insertCoin, resetSlot, resetAll };
}
