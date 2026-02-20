import React, { useState, useEffect, useCallback } from 'react';
import { fetchOrderStats } from '../services/api';

const CARDS = [
  {
    key: 'total',
    label: 'Total Orders',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/20',
    statusGroup: null,
  },
  {
    key: 'created',
    label: 'Created',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/20',
    statusGroup: ['CREATED'],
  },
  {
    key: 'processing',
    label: 'Processing',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.5 3.5l1.5-1m13-7l1.5-1M7.5 4.5l-1-1.5M19.5 19.5l-1-1.5" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20',
    statusGroup: ['PROCESSING', 'PROCESSED'],
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h-.375m0 0V6.375a1.125 1.125 0 011.125-1.125h13.5a1.125 1.125 0 011.125 1.125v8.25M3 14.25h.375m13.5 0h3.375m-3.375 0V6.375" />
      </svg>
    ),
    gradient: 'from-indigo-500 to-violet-500',
    shadow: 'shadow-indigo-500/20',
    statusGroup: ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVER'],
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/20',
    statusGroup: ['DELIVERED'],
  },
  {
    key: 'canceled',
    label: 'Canceled',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-rose-500 to-pink-500',
    shadow: 'shadow-rose-500/20',
    statusGroup: ['CANCELED'],
  },
];

/**
 * Dashboard stats cards.
 * Props:
 *   refreshKey — bump this counter to trigger an immediate re-fetch (e.g. on WebSocket event)
 */
const Dashboard = ({ refreshKey = 0 }) => {
  const [stats, setStats] = useState({ total: 0, statusCounts: {} });

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchOrderStats();
      setStats(data);
    } catch (err) {
      // silently ignore
    }
  }, []);

  // Refresh whenever refreshKey changes (WebSocket event) or on mount
  useEffect(() => {
    loadStats();
  }, [loadStats, refreshKey]);

  // Also poll every 5s as a safety net
  useEffect(() => {
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARDS.map((card) => {
        let count;
        if (!card.statusGroup) {
          count = stats.total || 0;
        } else {
          count = card.statusGroup.reduce(
            (sum, s) => sum + (stats.statusCounts[s] || 0),
            0,
          );
        }
        return (
          <div
            key={card.key}
            className={`
              group relative overflow-hidden rounded-2xl
              bg-dark-800/50 border border-dark-700/40
              backdrop-blur-sm p-4
              hover:border-dark-600/60 hover:bg-dark-800/70
              transition-all duration-300 cursor-default
              animate-slide-up
            `}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-lg flex items-center justify-center text-white`}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-xs font-medium text-dark-300 mt-0.5">{card.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Dashboard;
