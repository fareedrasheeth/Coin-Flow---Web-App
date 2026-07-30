'use client';
import React from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { Zap, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ServosPage() {
  const { servos, speakText } = useCoinFlow();

  const handleTestServo = (servoName) => {
    speakText(`Testing ${servoName}.`);
  };

  return (
    <AppShell pageTitle="Servo Motors Diagnostics">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              <span>PWM Servo Actuators & Ejection Motors</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monitoring 1 main coin entry servo and 7 storage compartment ejection servos (0° Home / 90° Eject position).
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            8 PWM Servo Drivers Active
          </span>
        </div>

        {/* 8 Servos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {servos.map((ser) => {
            const isEjecting = ser.status === 'ejecting' || ser.currentAngle > 0;
            return (
              <div
                key={ser.id}
                className={`p-5 rounded-3xl backdrop-blur-xl border transition-all ${
                  isEjecting
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-xl'
                    : 'bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-white/10 shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10">
                    {ser.gpio}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{ser.name}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{ser.role || 'Slot Ejector'}</p>

                {/* Gauge Info */}
                <div className="my-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 uppercase">Current Angle</span>
                    <span className="font-bold text-amber-400 font-mono text-sm">{ser.currentAngle}°</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                      style={{ width: `${(ser.currentAngle / 90) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pt-0.5 font-mono">
                    <span>Home: {ser.homeAngle || 0}°</span>
                    <span>Eject: {ser.ejectAngle || 90}°</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100 dark:border-white/10 pt-3">
                  <span className="capitalize font-medium text-gray-800 dark:text-gray-200">
                    {ser.status}
                  </span>
                  <button
                    onClick={() => handleTestServo(ser.name)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-[10px] transition-colors"
                  >
                    Test Servo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
