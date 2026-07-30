'use client';
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, Coins, DollarSign, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const { slots, totalValue, totalCoins } = useCoinFlow();
  const [dateFilter, setDateFilter] = useState('7d');

  // Chart data formatting
  const barData = slots.map((s) => ({
    name: s.label,
    count: s.count,
    color: s.color,
  }));

  const pieData = slots.map((s) => ({
    name: s.label,
    value: s.totalValue,
    color: s.color,
  }));

  // Hourly insertion trend data
  const areaData = [
    { time: '08:00', total: 120 },
    { time: '10:00', total: 450 },
    { time: '12:00', total: 890 },
    { time: '14:00', total: 1340 },
    { time: '16:00', total: 1820 },
    { time: '18:00', total: 2150 },
    { time: '20:00', total: totalValue || 2450 },
  ];

  // Most frequent coin
  const sortedByCount = [...slots].sort((a, b) => b.count - a.count);
  const topCoin = sortedByCount[0];

  return (
    <AppShell pageTitle="Analytics & Reports">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            <span>Coin Collection Insights & Telemetry Charts</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Visual breakdown of coin distribution, monetary collection velocity, and insertion patterns.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-white/10">
          <Calendar className="w-4 h-4 text-gray-400 ml-2" />
          {['today', '7d', '30d', 'custom'].map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all ${
                dateFilter === f
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {f === 'today' ? 'Today' : f === '7d' ? '7 Days' : f === '30d' ? '30 Days' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 uppercase font-semibold">Most Frequent Coin</span>
            <div className="text-xl font-bold text-indigo-400 mt-1">{topCoin?.label}</div>
            <span className="text-[11px] text-gray-400">{topCoin?.count} Inserted</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 uppercase font-semibold">Avg Collection Speed</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">4.2 Coins/min</div>
            <span className="text-[11px] text-gray-400">Active Sorting Mode</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 uppercase font-semibold">Avg Reset Duration</span>
            <div className="text-xl font-bold text-amber-400 mt-1">48 Seconds</div>
            <span className="text-[11px] text-gray-400">Compartment Ejection</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Coin Counts by Category */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg">
          <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">
            Coin Count Breakdown by Category
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#6C63FF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Monetary Distribution */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg">
          <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">
            Monetary Value Share (Rs.)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6C63FF'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Full-width Area Chart: Value Growth over Time */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 shadow-lg">
          <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">
            Cumulative Collection Trend (Rs.) Today
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="time" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#10B981" fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
