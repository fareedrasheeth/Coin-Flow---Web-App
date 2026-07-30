'use client';
import React from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { Cpu, CheckCircle2, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

export default function SensorsPage() {
  const { sensors, speakText } = useCoinFlow();

  const handleTestSensor = (sensorName) => {
    speakText(`Testing ${sensorName}.`);
  };

  return (
    <AppShell pageTitle="IR Sensor Diagnostics">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-indigo-500" />
              <span>7 Optical IR Sensor Array Diagnostics</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monitoring 7 optical IR coin sensors installed directly below each sorting hole on the size tray.
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            7 / 7 IR Sensors Active
          </span>
        </div>

        {/* 7 Sensor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {sensors.map((sen) => {
            const isError = sen.status === 'error';
            const isTriggered = sen.status === 'triggered';
            return (
              <div
                key={sen.id}
                className={`p-5 rounded-3xl backdrop-blur-xl border transition-all ${
                  isError
                    ? 'bg-red-500/10 border-red-500/40 shadow-xl'
                    : isTriggered
                    ? 'bg-indigo-500/10 border-indigo-500/40 shadow-xl'
                    : 'bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-white/10 shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      isError
                        ? 'bg-red-500/20 text-red-500 border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {sen.gpio}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{sen.name}</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{sen.type || 'Detection Sensor'}</p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase">Signal State</span>
                    <span className="font-bold text-emerald-500 font-mono">{sen.signalState || 'HIGH'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase">Detections</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">
                      {sen.detectionCount || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-white/10 pt-3">
                  <span>
                    Last:{' '}
                    {sen.lastTriggered
                      ? new Date(sen.lastTriggered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Idle'}
                  </span>
                  <button
                    onClick={() => handleTestSensor(sen.name)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-400 font-semibold text-[10px] transition-colors"
                  >
                    Test Sensor
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
