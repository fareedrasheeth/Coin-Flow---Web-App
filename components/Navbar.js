'use client';
import React, { useState, useEffect } from 'react';
import { useCoinFlow } from '@/context/CoinFlowContext';
import {
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Bell,
  Sun,
  Moon,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Radio,
} from 'lucide-react';

export default function Navbar({ title = 'Overview Dashboard' }) {
  const {
    espConnected,
    wsStatus,
    wsUrl,
    wifiSignal,
    theme,
    setTheme,
    voiceEnabled,
    setVoiceEnabled,
    volume,
    setVolume,
    activityFeed,
  } = useCoinFlow();

  const [currentTime, setCurrentTime] = useState('');
  const [showVoiceControls, setShowVoiceControls] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }) +
          ' • ' +
          now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const unreadCount = activityFeed.filter((a) => a.severity === 'warning' || a.severity === 'error').length;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-4 md:px-8 py-3 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Title & Live Time */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3 h-3" /> WebSocket ESP32 IoT
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{currentTime}</p>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* WebSocket Connection Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium">
            <span className="relative flex h-2.5 w-2.5">
              {espConnected && wsStatus === 'connected' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : wsStatus === 'connecting' ? (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 animate-pulse"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              )}
            </span>
            <span className="text-gray-700 dark:text-gray-200 flex items-center gap-1">
              <Radio className="w-3 h-3 text-indigo-500" />
              {espConnected ? 'ESP32 WebSocket Connected' : 'ESP32 Offline'}
            </span>
          </div>

          {/* Wi-Fi Signal Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300">
            {espConnected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span>{wifiSignal}% Signal</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-400">Disconnected</span>
              </>
            )}
          </div>

          {/* Voice Announcement Toggle & Volume Popover */}
          <div className="relative">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowVoiceControls(!showVoiceControls);
              }}
              title={voiceEnabled ? 'Voice Output Active (Right-click for Volume)' : 'Voice Output Muted'}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center border ${
                voiceEnabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Quick volume popover */}
            {showVoiceControls && (
              <div className="absolute right-0 top-12 z-40 w-56 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-xl space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Voice Output Volume</span>
                  <span className="text-emerald-500 font-mono">{Math.round(volume * 100)}%</span>
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
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Automatic text-to-speech output for coin insertions & slot ejection warnings.
                </p>
              </div>
            )}
          </div>

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-40 w-80 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-2xl space-y-3 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">Recent Hardware Logs</h4>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-semibold">
                    WebSocket Feed
                  </span>
                </div>
                <div className="space-y-2">
                  {activityFeed.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start gap-2.5 text-xs"
                    >
                      <div className="p-1.5 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200 mt-0.5">
                        {item.severity === 'error' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        ) : item.severity === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.title}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title="Toggle Light / Dark Mode"
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-md">
              <div className="w-full h-full bg-gray-900 rounded-[10px] flex items-center justify-center text-white font-bold text-xs">
                FR
              </div>
            </div>
            <div className="hidden xl:block text-left text-xs">
              <div className="font-bold text-gray-900 dark:text-white leading-tight">Fareed Rasheeth</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">IoT Operator</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
