'use client';
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { SRI_LANKAN_COINS } from '@/lib/constants';
import { History, Search, Download, Filter, FileText } from 'lucide-react';

export default function HistoryPage() {
  const { coinHistory } = useCoinFlow();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoinFilter, setSelectedCoinFilter] = useState('all');

  const filteredHistory = coinHistory.filter((item) => {
    const matchesSearch =
      item.eventId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.coinType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sensorId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCoin = selectedCoinFilter === 'all' || item.coinType === selectedCoinFilter;
    return matchesSearch && matchesCoin;
  });

  const exportCSV = () => {
    const headers = ['Event ID', 'Coin Type', 'Value (Rs)', 'Slot', 'Detection Time', 'Sensor ID', 'ESP32 Device', 'Status'];
    const rows = filteredHistory.map((item) => [
      item.eventId,
      item.coinType,
      item.coinValue,
      item.slotName,
      item.detectionTime,
      item.sensorId,
      item.espDevice,
      item.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CoinFlow_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell pageTitle="Coin Insertion History">
      <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-500" />
              <span>Historical Coin Telemetry Audit Log</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Searchable log of all processed Sri Lankan coins with GPIO pin sensor tags and timestamps.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Event ID, Coin Type, or Sensor GPIO Pin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedCoinFilter}
              onChange={(e) => setSelectedCoinFilter(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            >
              <option value="all">All Coin Categories</option>
              {SRI_LANKAN_COINS.map((c) => (
                <option key={c.id} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-gray-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="p-3">Event ID</th>
                <th className="p-3">Coin Type</th>
                <th className="p-3">Value</th>
                <th className="p-3">Slot</th>
                <th className="p-3">Sensor Pin</th>
                <th className="p-3">Detection Time</th>
                <th className="p-3">Device ID</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No matching history records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((row) => (
                  <tr
                    key={row.eventId}
                    className="bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <td className="p-3 font-mono font-semibold text-indigo-500 dark:text-indigo-400 rounded-l-xl">
                      {row.eventId}
                    </td>
                    <td className="p-3 font-bold text-gray-900 dark:text-white">{row.coinType}</td>
                    <td className="p-3 font-semibold text-emerald-500">Rs. {row.coinValue}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{row.slotName}</td>
                    <td className="p-3 font-mono text-gray-400">{row.sensorId}</td>
                    <td className="p-3 text-gray-400 font-mono">
                      {new Date(row.detectionTime).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-3 font-mono text-gray-400">{row.espDevice}</td>
                    <td className="p-3 rounded-r-xl">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
