import React, { useState } from 'react';
import StatusBadge, { STATUS_LABELS } from './StatusBadge';
import { updateOrderStatus } from '../services/api';

const ALL_STATUSES = Object.keys(STATUS_LABELS);

const OrderTable = ({ orders, updatedOrderIds }) => {
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-dark-800/30 border border-dark-700/30 p-12 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-700/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-dark-200 mb-1">No orders yet</h3>
        <p className="text-sm text-dark-400">Create your first order to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-dark-800/30 border border-dark-700/30 overflow-hidden animate-fade-in">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/30">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-300 uppercase tracking-wider">Order ID</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-300 uppercase tracking-wider">Product</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-300 uppercase tracking-wider">Price</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-300 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-300 uppercase tracking-wider">Created</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/20">
            {orders.map((order) => (
              <tr
                key={order.id}
                className={`
                  hover:bg-dark-700/20 transition-all duration-300
                  ${updatedOrderIds.has(order.id) ? 'animate-flash' : ''}
                `}
              >
                <td className="px-5 py-3.5">
                  <span className="text-sm font-mono font-semibold text-accent-purple">{order.id}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-medium text-white">{order.productName}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-semibold text-emerald-400">{formatPrice(order.price)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={order.status} animate={updatedOrderIds.has(order.id)} />
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm text-dark-300">{formatDate(order.createdTime)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="relative">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      className="appearance-none w-full pl-3 pr-8 py-1.5 rounded-lg bg-dark-900/60 border border-dark-600/40 
                        text-xs font-medium text-dark-200
                        focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/25
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 cursor-pointer"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      {updatingId === order.id ? (
                        <svg className="w-3 h-3 animate-spin text-accent-purple" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-dark-700/20">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`
              p-4 hover:bg-dark-700/20 transition-all duration-300
              ${updatedOrderIds.has(order.id) ? 'animate-flash' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-mono font-semibold text-accent-purple">{order.id}</span>
              <StatusBadge status={order.status} animate={updatedOrderIds.has(order.id)} />
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">{order.productName}</span>
              <span className="text-sm font-semibold text-emerald-400">{formatPrice(order.price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-400">{formatDate(order.createdTime)}</span>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                disabled={updatingId === order.id}
                className="appearance-none pl-2 pr-6 py-1 rounded-lg bg-dark-900/60 border border-dark-600/40 
                  text-xs font-medium text-dark-200
                  focus:outline-none focus:border-accent-purple/50
                  disabled:opacity-50
                  transition-all duration-200 cursor-pointer"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTable;
