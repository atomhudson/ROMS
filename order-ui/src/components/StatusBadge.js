import React from 'react';

const STATUS_CONFIG = {
  PENDING:          { bg: 'bg-slate-500/15',    text: 'text-slate-400',   border: 'border-slate-500/30',   dot: 'bg-slate-400' },
  CREATED:          { bg: 'bg-blue-500/15',     text: 'text-blue-400',    border: 'border-blue-500/30',    dot: 'bg-blue-400' },
  PROCESSING:       { bg: 'bg-amber-500/15',    text: 'text-amber-400',   border: 'border-amber-500/30',   dot: 'bg-amber-400' },
  PROCESSED:        { bg: 'bg-orange-500/15',   text: 'text-orange-400',  border: 'border-orange-500/30',  dot: 'bg-orange-400' },
  SHIPPED:          { bg: 'bg-indigo-500/15',   text: 'text-indigo-400',  border: 'border-indigo-500/30',  dot: 'bg-indigo-400' },
  IN_TRANSIT:       { bg: 'bg-purple-500/15',   text: 'text-purple-400',  border: 'border-purple-500/30',  dot: 'bg-purple-400' },
  OUT_FOR_DELIVER:  { bg: 'bg-cyan-500/15',     text: 'text-cyan-400',    border: 'border-cyan-500/30',    dot: 'bg-cyan-400' },
  CANCELED:         { bg: 'bg-rose-500/15',     text: 'text-rose-400',    border: 'border-rose-500/30',    dot: 'bg-rose-400' },
  DELIVERED:        { bg: 'bg-emerald-500/15',  text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  CREATED: 'Created',
  PROCESSING: 'Processing',
  PROCESSED: 'Processed',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVER: 'Out for Delivery',
  CANCELED: 'Canceled',
  DELIVERED: 'Delivered',
};

const StatusBadge = ({ status, animate = false }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        border transition-all duration-300
        ${config.bg} ${config.text} ${config.border}
        ${animate ? 'animate-fade-in' : ''}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${animate ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
};

export { STATUS_LABELS };
export default StatusBadge;
