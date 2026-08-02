'use client';
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import {
  Settings,
  Volume2,
  VolumeX,
  Radio,
  Cpu,
  Monitor,
  Play,
  CheckCircle2,
  Info,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  Activity,
  Terminal,
  Server,
  Link,
  Unlink,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    esp32Ip,
    setEsp32Ip,
    websocketUrl,
    wsStatus,
    wifiSignal,
    diagnostics,
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
    handleConnectESP32,
    handleDisconnectESP32,
    handleTestConnection,
  } = useCoinFlow();

  const [inputIp, setInputIp] = useState(esp32Ip);
  const [testingHttp, setTestingHttp] = useState(false);
  const [httpResult, setHttpResult] = useState(null);
  const [isHttps, setIsHttps] = useState(false);

  useEffect(() => {
    setInputIp(esp32Ip);
  }, [esp32Ip]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHttps(window.location.protocol === 'https:');
    }
  }, []);

  const handleApplyIp = () => {
    setEsp32Ip(inputIp);
    speakText('ESP32 IP address updated.');
  };

  const handleTestBtnClick = async () => {
    setTestingHttp(true);
    setHttpResult(null);
    const res = await handleTestConnection();
    setTestingHttp(false);
    setHttpResult(res);
  };

  const isConnected = wsStatus === 'connected';
  const isConnecting = wsStatus === 'connecting' || wsStatus === 'reconnecting';

  return (
    <AppShell pageTitle="System Settings">
      <div className="space-y-6 max-w-5xl">
        {/* Page Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-500" />
            <span>CoinFlow Hardware & App Settings</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure native WebSocket transmission endpoints, ESP32 local IP parameters, voice announcements, and diagnostic logging.
          </p>
        </div>

        {/* HTTPS Mixed-Content Warning Banner */}
        {isHttps && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">HTTPS Mixed-Content Security Warning</div>
              <p>
                This website is running over <strong>HTTPS</strong>. Most web browsers strictly block direct unencrypted{' '}
                <code>ws://</code> connections from an HTTPS page.
              </p>
              <p className="text-[11px] opacity-90">
                Run the web application locally over <code>http://localhost:3000</code> or <code>http://localhost:5173</code> to connect directly to <code>{websocketUrl}</code>.
              </p>
            </div>
          </div>
        )}

        {/* 1. ESP32 Native WebSocket Connection Panel */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <span>ESP32 Connection Panel</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-500 font-semibold border border-indigo-500/20">
                    Native Browser WebSocket
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Target Endpoint: <code className="font-mono text-indigo-500 font-semibold">{websocketUrl}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono border flex items-center gap-1.5 ${
                  wsStatus === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : wsStatus === 'connecting' || wsStatus === 'reconnecting'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-red-500/20 text-red-500 border-red-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    wsStatus === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : wsStatus === 'connecting' || wsStatus === 'reconnecting'
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-red-500'
                  }`}
                ></span>
                {wsStatus.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* IP Address & Port Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-gray-700 dark:text-gray-300 block mb-1 font-semibold">
                  ESP32 Wi-Fi Local IP Address:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputIp}
                    onChange={(e) => setInputIp(e.target.value)}
                    placeholder="192.168.43.120"
                    className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white outline-none font-mono text-sm focus:border-indigo-500"
                  />
                  <button
                    onClick={handleApplyIp}
                    className="px-3.5 py-2.5 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold text-xs transition-all"
                  >
                    Save IP
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 block mb-1 font-semibold">WebSocket Port:</label>
                <input
                  type="text"
                  readOnly
                  value="81"
                  className="w-full bg-gray-200 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-500 dark:text-gray-400 font-mono text-sm cursor-not-allowed font-semibold"
                />
              </div>
            </div>

            {/* Generated WebSocket URL Preview */}
            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Generated WebSocket URL:</span>
              <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-xs">{websocketUrl}</code>
            </div>

            {/* Action Control Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleConnectESP32}
                disabled={isConnected || isConnecting}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 ${
                  isConnected || isConnecting
                    ? 'bg-gray-200 dark:bg-white/5 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-white/5'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
                }`}
              >
                <Link className="w-3.5 h-3.5" /> Connect
              </button>

              <button
                onClick={handleDisconnectESP32}
                disabled={!isConnected && !isConnecting}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 border ${
                  !isConnected && !isConnecting
                    ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed border-gray-200 dark:border-white/5'
                    : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                }`}
              >
                <Unlink className="w-3.5 h-3.5" /> Disconnect
              </button>

              <button
                onClick={() => {
                  handleDisconnectESP32();
                  setTimeout(() => handleConnectESP32(), 400);
                }}
                className="px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reconnect
              </button>

              <button
                onClick={handleTestBtnClick}
                disabled={testingHttp}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 ml-auto"
              >
                {testingHttp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Test Connection
              </button>
            </div>

            {/* HTTP Reachability Pre-flight Result */}
            {httpResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                  httpResult.reachable
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-500'
                }`}
              >
                <span className="font-semibold">
                  {httpResult.reachable
                    ? `✅ HTTP Pre-flight Check Successful: http://${esp32Ip}/api/status responded`
                    : `⚠️ HTTP Check Failed: ${httpResult.message || 'ESP32 not reachable'}`}
                </span>
                <span className="text-[11px] font-mono opacity-80">{new Date().toLocaleTimeString()}</span>
              </div>
            )}

            {/* Network Requirement Notice */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 text-[11px] text-gray-700 dark:text-gray-300 space-y-1">
              <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Network Requirement Notice
              </div>
              <p>
                The web application device (computer/phone) and ESP32 hardware <strong>must be connected to the same Wi-Fi network</strong> (e.g., <code>Aathif's Galaxy J6</code>).
              </p>
            </div>
          </div>
        </div>

        {/* 2. Developer WebSocket Diagnostic Panel */}
        <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Developer WebSocket Diagnostic Panel</h3>
            </div>
            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
              Live Real-Time Telemetry Metrics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="text-[10px] text-gray-500 dark:text-gray-400">Native readyState</div>
              <div className="font-mono font-bold text-indigo-500 mt-0.5">{diagnostics.readyStateLabel}</div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="text-[10px] text-gray-500 dark:text-gray-400">Connection State</div>
              <div className="font-bold text-emerald-500 capitalize mt-0.5">{diagnostics.status}</div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="text-[10px] text-gray-500 dark:text-gray-400">Reconnect Attempts</div>
              <div className="font-mono font-bold text-amber-500 mt-0.5">{diagnostics.reconnectAttempts}</div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="text-[10px] text-gray-500 dark:text-gray-400">Messages Received</div>
              <div className="font-mono font-bold text-purple-500 mt-0.5">{diagnostics.messagesReceivedCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Timestamps</div>
              <div className="flex justify-between text-[11px]">
                <span>Last Connected:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">{diagnostics.lastConnectedTime || 'None'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Last Message:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">{diagnostics.lastMessageTime || 'None'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Last Ping / Pong:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">
                  {diagnostics.lastPingTime || '--'} / {diagnostics.lastPongTime || '--'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Disconnect Diagnostics</div>
              <div className="flex justify-between text-[11px]">
                <span>Close Code:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">{diagnostics.lastCloseCode ?? 'None'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Close Reason:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{diagnostics.lastCloseReason || 'None'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Last Error:</span>
                <span className="font-mono text-red-400 truncate max-w-[180px]">{diagnostics.lastError || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Raw WebSocket Message & Parsed JSON Inspector */}
          <div className="space-y-2 text-xs pt-1">
            <label className="text-gray-600 dark:text-gray-400 font-semibold block">Last Received WebSocket Raw Telemetry:</label>
            <pre className="p-3 rounded-2xl bg-gray-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-32 border border-gray-800">
              {diagnostics.lastRawMessage ? diagnostics.lastRawMessage : '// No incoming WebSocket messages received yet...'}
            </pre>
          </div>
        </div>

        {/* 3. Automatic Voice Output Settings */}
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
                  Browser SpeechSynthesis text-to-speech output system. (No microphone/voice input)
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
              <span>Sample: "Rs.2 Big coin inserted."</span>
            </div>

            <button
              onClick={() => speakText('Rs.2 Big coin inserted. Testing automatic voice output announcement.')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5" /> Test Speech Output
            </button>
          </div>
        </div>

        {/* 4. Display & Theme Settings */}
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
