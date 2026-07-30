'use client';
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import {
  Settings,
  Volume2,
  VolumeX,
  Grid,
  Cpu,
  Monitor,
  Play,
  CheckCircle2,
  Info,
  Radio,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    voiceEnabled,
    setVoiceEnabled,
    volume,
    setVolume,
    rate,
    setRate,
    pitch,
    setPitch,
    voices,
    selectedVoiceIndex,
    setSelectedVoiceIndex,
    speakText,
    theme,
    setTheme,
    wsUrl,
    setWsUrl,
    wsStatus,
  } = useCoinFlow();

  const [inputWsUrl, setInputWsUrl] = useState(wsUrl);

  const handleTestVoice = () => {
    speakText('Rs.20 big coin inserted. Testing automatic voice output announcement.');
  };

  const handleSaveWsUrl = () => {
    setWsUrl(inputWsUrl);
    speakText('WebSocket URL updated.');
  };

  return (
    <AppShell pageTitle="System Settings">
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-500" />
            <span>CoinFlow Hardware & App Settings</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure ESP32 WebSocket transmission endpoints, automatic voice output announcements, and theme preferences.
          </p>
        </div>

        {/* 1. ESP32 WebSocket Communication Protocol Settings */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  ESP32 WebSocket Transmission Protocol
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Real-time bidirectional WebSocket client connecting to your ESP32 hardware
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                wsStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-500 border-red-500/30'
              }`}
            >
              {wsStatus.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                ESP32 WebSocket Server Endpoint URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputWsUrl}
                  onChange={(e) => setInputWsUrl(e.target.value)}
                  placeholder="ws://192.168.1.104:81"
                  className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white outline-none font-mono focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveWsUrl}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5" /> Connect WebSocket
                </button>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              The WebSocket client receives real-time IR sensor detection events and sends servo control commands to your ESP32.
            </p>
          </div>
        </div>

        {/* 2. Voice Announcement Output Settings */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Automatic Voice Output Announcements
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Browser SpeechSynthesis API text-to-speech output system. (No microphone/voice input)
                </p>
              </div>
            </div>

            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                voiceEnabled
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-white/10'
              }`}
            >
              {voiceEnabled ? 'VOICE ENABLED' : 'VOICE MUTED'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Text-to-Speech Voice Engine:</label>
              <select
                value={selectedVoiceIndex}
                onChange={(e) => setSelectedVoiceIndex(parseInt(e.target.value, 10))}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-white outline-none"
              >
                {voices.length === 0 ? (
                  <option value={0}>Default Browser English Voice</option>
                ) : (
                  voices.map((v, i) => (
                    <option key={i} value={i}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Announcement Volume:</span>
                <span className="font-mono text-emerald-500 font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Speech Speed Rate:</span>
                <span className="font-mono text-indigo-500 font-bold">{rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Voice Pitch:</span>
                <span className="font-mono text-purple-500 font-bold">{pitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Announce sample: "Rs.20 big coin inserted."</span>
            </div>

            <button
              onClick={handleTestVoice}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5" /> Test Speech Output
            </button>
          </div>
        </div>

        {/* 3. Display & Theme Settings */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-3">
            <Monitor className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Display & Theme Preferences</h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-900 dark:text-white block">Theme Mode</span>
              <span className="text-gray-500 dark:text-gray-400">Switch between Apple Light Mode and Dark Mode</span>
            </div>

            <button
              onClick={() => {
                const next = theme === 'dark' ? 'light' : 'dark';
                setTheme(next);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              Toggle Theme ({theme.toUpperCase()})
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
