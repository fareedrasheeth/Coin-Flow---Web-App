'use client';
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useCoinFlow } from '@/context/CoinFlowContext';
import { Activity, Search, Filter, AlertTriangle, CheckCircle2, Info, AlertOctagon } from 'lucide-react';

export default function ActivityPage() {
  const { activityFeed } = useCoinFlow();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredFeed = activityFeed.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || item.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'error':
        return { bg: 'bg-red-500/10 text-red-500 border-red-500/30', icon: AlertOctagon };
      case 'warning':
        return { bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: AlertTriangle };
      case 'success':
        return { bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', icon: CheckCircle2 };
      default:
        return { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: Info };
    }
  };

  return (
    <AppShell pageTitle="Live Activity Feed">
      <div className="bg-white/80 dark:bg-gray-900/80 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-500" />
              <span>Real-Time ESP32 Hardware Activity Feed</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Complete stream of coin detections, IR sensor triggers, servo motor position movements & system alerts.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            ● Stream Live ({filteredFeed.length} Events)
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            >
              <option value="all">All Severity Levels</option>
              <option value="info">Information</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Critical Error</option>
            </select>
          </div>
        </div>

        {/* Feed Items List */}
        <div className="space-y-3">
          {filteredFeed.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              No matching activity events found.
            </div>
          ) : (
            filteredFeed.map((item) => {
              const { bg, icon: SevIcon } = getSeverityBadge(item.severity);
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start gap-4 transition-all hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <div className={`p-3 rounded-2xl border ${bg} shrink-0`}>
                    <SevIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.title}</h4>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
