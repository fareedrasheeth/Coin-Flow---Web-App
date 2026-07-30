'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { SIDEBAR_MENU } from '@/lib/constants';
import {
  LayoutDashboard,
  Grid,
  Activity,
  BarChart3,
  Sliders,
  Cpu,
  Zap,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Coins,
  Wifi,
  WifiOff,
  User,
  ShieldCheck,
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  Grid,
  Activity,
  BarChart3,
  Sliders,
  Cpu,
  Zap,
  History,
  Settings,
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { espConnected, machineState } = useCoinFlow();

  return (
    <aside
      className={`relative z-40 flex flex-col h-screen bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-2xl border-r border-white/10 text-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-50 p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-white/20 text-white shadow-lg transition-transform"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 p-0.5 shadow-lg shrink-0">
          <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
            <Coins className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="font-extrabold text-lg tracking-wider text-white leading-tight">CoinFlow</h2>
            <p className="text-[10px] text-gray-400 font-medium truncate">Smart Coin Sorter IoT</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {SIDEBAR_MENU.map((item) => {
          const IconComponent = iconMap[item.icon] || Grid;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <IconComponent
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-400'
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status & Profile Area */}
      <div className="p-3 border-t border-white/10 space-y-3 bg-gray-950/50">
        {/* Machine Connection Status Card */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            {espConnected ? (
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">ESP32 Status</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      espConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {espConnected ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 truncate">State: {machineState}</div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        {!collapsed && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              FR
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">Fareed Rasheeth</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
