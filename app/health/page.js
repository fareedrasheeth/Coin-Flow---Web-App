'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { generateMockHealthData } from '@/lib/mockData';

export default function HealthPage() {
  const [health] = useState(() => generateMockHealthData());
  const [lastHeartbeat, setLastHeartbeat] = useState(() => Date.now());
  const [heartbeatAge, setHeartbeatAge] = useState(0);

  useEffect(() => {
    // Simulate heartbeat every 5 seconds
    const hbInterval = setInterval(() => {
      setLastHeartbeat(Date.now());
    }, 5000);
    // Update age display
    const ageInterval = setInterval(() => {
      setHeartbeatAge(Math.floor((Date.now() - lastHeartbeat) / 1000));
    }, 1000);
    return () => {
      clearInterval(hbInterval);
      clearInterval(ageInterval);
    };
  }, [lastHeartbeat]);

  if (!health) return <AppShell><div className="skeleton h-96 rounded-2xl" /></AppShell>;

  const isConnected = heartbeatAge < 15;

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Machine Health</h1>
        <p className="text-text-secondary text-sm">Live hardware status monitoring</p>
      </motion.div>

      {/* Connection Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`glass-card p-5 mb-6 border ${
          isConnected ? 'border-success/30' : 'border-danger/40'
        }`}
        style={{
          boxShadow: isConnected ? '0 0 20px rgba(0,255,148,0.1)' : '0 0 20px rgba(255,77,109,0.2)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className={`w-4 h-4 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: isConnected ? 2 : 1 }}
              style={{ boxShadow: isConnected ? '0 0 12px rgba(0,255,148,0.5)' : '0 0 12px rgba(255,77,109,0.5)' }}
            />
            <div>
              <p className="font-heading font-bold text-lg">
                {isConnected ? 'ESP32 Connected' : '⚠️ Machine Disconnected'}
              </p>
              <p className="text-text-secondary text-xs">
                Last heartbeat: {heartbeatAge}s ago · Uptime: {health.esp32.uptime}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-text-secondary">Latency:</span>
            <span className="font-bold text-success">{health.esp32.latency}ms</span>
          </div>
        </div>
      </motion.div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatusCard
          title="ESP32 MCU"
          status={health.esp32.status}
          details={[
            { label: 'Latency', value: `${health.esp32.latency}ms` },
            { label: 'Uptime', value: health.esp32.uptime },
          ]}
          icon="🔧"
          delay={0.3}
        />
        <StatusCard
          title="MQTT Broker"
          status={health.mqtt.status}
          details={[
            { label: 'Broker', value: health.mqtt.broker },
            { label: 'Last Message', value: health.mqtt.lastMessage },
          ]}
          icon="📡"
          delay={0.4}
        />
        <StatusCard
          title="Power Supply"
          status={health.power.status}
          details={[
            { label: 'Voltage', value: health.power.voltage },
            { label: 'Current', value: health.power.current },
          ]}
          icon="⚡"
          delay={0.5}
        />
      </div>

      {/* IR Sensors */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-5 mb-4"
      >
        <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
          <span>👁️</span> IR Sensors (7 Slots)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {health.irSensors.map((sensor, i) => (
            <motion.div
              key={sensor.slotId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-card-border"
            >
              <span className={`status-dot ${sensor.status}`} />
              <div className="flex-1">
                <p className="text-xs font-semibold">{sensor.label}</p>
                <p className="text-[10px] text-text-secondary">Last: {sensor.lastRead}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase ${
                sensor.status === 'online' ? 'text-success' : 'text-warning'
              }`}>
                {sensor.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Servos */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card p-5"
      >
        <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
          <span>⚙️</span> Servo Motors (7 Slots)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {health.servos.map((servo, i) => (
            <motion.div
              key={servo.slotId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-card-border"
            >
              <span className={`status-dot ${servo.status}`} />
              <div className="flex-1">
                <p className="text-xs font-semibold">{servo.label}</p>
                <p className="text-[10px] text-text-secondary">{servo.activations} activations</p>
              </div>
              <span className={`text-[10px] font-bold uppercase ${
                servo.status === 'online' ? 'text-success' : 'text-danger'
              }`}>
                {servo.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AppShell>
  );
}

function StatusCard({ title, status, details, icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-heading font-bold text-sm">{title}</h3>
        </div>
        <span className={`status-dot ${status}`} />
      </div>
      <div className="space-y-2">
        {details.map((d) => (
          <div key={d.label} className="flex justify-between items-center">
            <span className="text-text-secondary text-xs">{d.label}</span>
            <span className="text-xs font-semibold">{d.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
