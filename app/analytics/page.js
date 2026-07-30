'use client';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { INSIGHTS } from '@/lib/constants';
import {
  generateMockDailyData,
  generateMockWeeklyData,
  generateMockMonthlyData,
  generateMockSlotData,
  generateMockDenominationData,
} from '@/lib/mockData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(10, 10, 15, 0.9)',
      borderColor: 'rgba(108, 99, 255, 0.3)',
      borderWidth: 1,
      titleFont: { family: 'Space Grotesk', size: 13 },
      bodyFont: { family: 'Inter', size: 12 },
      padding: 12,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'Inter', size: 10 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'Inter', size: 10 } },
    },
  },
};

export default function AnalyticsPage() {
  const [dailyData, setDailyData] = useState(() => generateMockDailyData());
  const [weeklyData, setWeeklyData] = useState(() => generateMockWeeklyData());
  const [monthlyData, setMonthlyData] = useState(() => generateMockMonthlyData());
  const [denomData, setDenomData] = useState(() => {
    const slots = generateMockSlotData();
    return generateMockDenominationData(slots);
  });
  const [insightIndex, setInsightIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % INSIGHTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!dailyData) return <AppShell><LoadingSkeleton /></AppShell>;

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Analytics</h1>
        <p className="text-text-secondary text-sm">Deep dive into your coin collection patterns</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Most Inserted" value="Rs.10" icon="🏆" color="#FFB800" delay={0} />
        <StatCard label="Avg Daily" value="Rs.342" icon="📊" color="#6C63FF" delay={0.1} />
        <StatCard label="Servos Released" value="14" icon="⚙️" color="#00D4FF" delay={0.2} />
        <StatCard label="Total Coins" value="2,847" icon="🪙" color="#00FF94" delay={0.3} />
      </div>

      {/* Smart Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card glow-border p-5 mb-6 relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💡</span>
          <h3 className="font-heading font-bold text-sm">Smart Insights</h3>
          <span className="badge badge-active text-[10px] ml-auto">AI-Powered</span>
        </div>
        <motion.p
          key={insightIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="text-sm text-text-secondary"
        >
          {INSIGHTS[insightIndex]}
        </motion.p>
        <div className="flex gap-1 mt-3">
          {INSIGHTS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === insightIndex ? 'w-6 bg-primary' : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Daily Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h3 className="font-heading font-bold text-sm mb-4">Daily Collection (30 Days)</h3>
          <div className="h-64">
            <Line
              data={{
                labels: dailyData.map((d) => d.date),
                datasets: [
                  {
                    data: dailyData.map((d) => d.amount),
                    borderColor: '#6C63FF',
                    backgroundColor: 'rgba(108,99,255,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#6C63FF',
                    borderWidth: 2,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </motion.div>

        {/* Weekly Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-5"
        >
          <h3 className="font-heading font-bold text-sm mb-4">Weekly Comparison</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: weeklyData.map((d) => d.week),
                datasets: [
                  {
                    data: weeklyData.map((d) => d.amount),
                    backgroundColor: weeklyData.map(
                      (_, i) => `rgba(108, 99, 255, ${0.3 + (i / weeklyData.length) * 0.7})`
                    ),
                    borderRadius: 8,
                    borderSkipped: false,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </motion.div>

        {/* Monthly Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-5"
        >
          <h3 className="font-heading font-bold text-sm mb-4">Monthly Trend</h3>
          <div className="h-64">
            <Line
              data={{
                labels: monthlyData.map((d) => d.month),
                datasets: [
                  {
                    data: monthlyData.map((d) => d.amount),
                    borderColor: '#00D4FF',
                    backgroundColor: 'rgba(0,212,255,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#00D4FF',
                    borderWidth: 2,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </motion.div>

        {/* Denomination Doughnut */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-5"
        >
          <h3 className="font-heading font-bold text-sm mb-4">Coin Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={{
                labels: denomData.map((d) => d.label),
                datasets: [
                  {
                    data: denomData.map((d) => d.value),
                    backgroundColor: denomData.map((d) => d.color),
                    borderColor: 'transparent',
                    borderWidth: 2,
                    hoverOffset: 8,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: 'rgba(255,255,255,0.6)',
                      font: { family: 'Inter', size: 11 },
                      padding: 12,
                      usePointStyle: true,
                      pointStyleWidth: 10,
                    },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(10, 10, 15, 0.9)',
                    borderColor: 'rgba(108, 99, 255, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 10,
                  },
                },
              }}
            />
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          </svg>
        </div>
      </div>
      <p className="text-text-secondary text-[10px] uppercase tracking-wider">{label}</p>
      <p className="font-heading font-bold text-lg mt-1" style={{ color }}>{value}</p>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-4 w-64" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
