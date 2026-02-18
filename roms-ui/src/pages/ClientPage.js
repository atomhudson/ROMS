import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/api';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge';
import ToastContainer, { useToast } from '../components/ToastNotification';

const ORDER_FLOW = ['CREATED', 'PROCESSING', 'PROCESSED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVER', 'DELIVERED'];

const ClientPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('place'); // 'place' or 'track'
  const [isConnected, setIsConnected] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Place Order state
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [error, setError] = useState('');

  // Track Order state
  const [trackId, setTrackId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);

  // WebSocket — listen for real-time updates
  const handleOrderUpdate = useCallback((updatedOrder) => {
    // Update placed order if it matches
    setPlacedOrder((prev) => prev && prev.id === updatedOrder.id ? updatedOrder : prev);
    // Update tracked order if it matches
    setTrackedOrder((prev) => prev && prev.id === updatedOrder.id ? updatedOrder : prev);
    // Update recent orders list
    setRecentOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === updatedOrder.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = updatedOrder;
        return updated;
      }
      return prev;
    });

    // Toast notification
    const statusLabel = STATUS_LABELS[updatedOrder.status] || updatedOrder.status;
    addToast(
      `${updatedOrder.id} → ${statusLabel}`,
      updatedOrder.status === 'DELIVERED' ? 'success'
        : updatedOrder.status === 'CANCELLED' ? 'error'
        : updatedOrder.status === 'CREATED' ? 'info'
        : 'warning'
    );
  }, [addToast]);

  useEffect(() => {
    connectWebSocket(handleOrderUpdate, () => setIsConnected(true), () => setIsConnected(false));
    return () => disconnectWebSocket();
  }, [handleOrderUpdate]);

  // Place Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!productName.trim() || !price) return;
    setLoading(true);
    setError('');
    try {
      const order = await createOrder({ productName: productName.trim(), price: parseFloat(price) });
      setPlacedOrder(order);
      setRecentOrders((prev) => [order, ...prev]);
      setProductName('');
      setPrice('');
    } catch (err) {
      setError('Failed to place order. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  // Track Order
  const handleTrackOrder = (e) => {
    e.preventDefault();
    const found = recentOrders.find((o) => o.id === trackId.trim().toUpperCase());
    if (found) {
      setTrackedOrder(found);
      setTrackError('');
    } else {
      setTrackError('Order not found in current session. Try placing an order first.');
      setTrackedOrder(null);
    }
  };

  const getStepIndex = (status) => {
    const idx = ORDER_FLOW.indexOf(status);
    return idx >= 0 ? idx : -1;
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-dark-900/80 border-b border-dark-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
            </div>
            Client Portal
          </h1>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-dark-800/60 border border-dark-700/40">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse-slow' : 'bg-rose-400'}`} />
            <span className={`text-[10px] font-medium ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-dark-800/40 border border-dark-700/30 w-fit">
          {[
            { key: 'place', label: 'Place Order', icon: 'M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
            { key: 'track', label: 'Track Order', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${tab === t.key
                  ? 'bg-gradient-to-r from-accent-blue to-accent-cyan text-white shadow-lg shadow-accent-blue/20'
                  : 'text-dark-300 hover:text-white hover:bg-dark-700/40'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════ PLACE ORDER TAB ═══════════ */}
        {tab === 'place' && (
          <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Form */}
            <div className="rounded-2xl bg-dark-800/50 border border-dark-700/40 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-accent-blue to-accent-cyan" />
              <div className="p-6">
                <h2 className="text-lg font-bold text-white mb-1">Place an Order</h2>
                <p className="text-sm text-dark-400 mb-6">Your order will be processed in real-time</p>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">Product Name</label>
                    <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required
                      placeholder="e.g. Wireless Headphones"
                      className="w-full px-4 py-2.5 rounded-xl bg-dark-900/60 border border-dark-600/40 text-white placeholder-dark-400 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">Price ($)</label>
                    <input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl bg-dark-900/60 border border-dark-600/40 text-white placeholder-dark-400 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all" />
                  </div>
                  {error && (
                    <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>
                  )}
                  <button type="submit" disabled={loading || !productName.trim() || !price}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold
                      hover:shadow-lg hover:shadow-accent-blue/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Placing...
                      </span>
                    ) : 'Place Order'}
                  </button>
                </form>
              </div>
            </div>

            {/* Order Confirmation */}
            <div className="rounded-2xl bg-dark-800/50 border border-dark-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Order Status</h2>
              {placedOrder ? (
                <div className="space-y-4 animate-slide-up">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900/40 border border-dark-700/30">
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Order ID</p>
                      <p className="text-lg font-mono font-bold text-accent-blue">{placedOrder.id}</p>
                    </div>
                    <StatusBadge status={placedOrder.status} animate />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-dark-900/40 border border-dark-700/30">
                      <p className="text-xs text-dark-400 mb-0.5">Product</p>
                      <p className="text-sm font-medium text-white">{placedOrder.productName}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-dark-900/40 border border-dark-700/30">
                      <p className="text-xs text-dark-400 mb-0.5">Price</p>
                      <p className="text-sm font-semibold text-emerald-400">${placedOrder.price?.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Live Progress Tracker */}
                  <div className="mt-2">
                    <p className="text-xs text-dark-400 mb-3 uppercase tracking-wider font-semibold">Live Tracking</p>
                    <div className="space-y-1">
                      {ORDER_FLOW.map((step, i) => {
                        const currentIdx = getStepIndex(placedOrder.status);
                        const isCompleted = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={step} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                              ${isCompleted ? 'bg-gradient-to-br from-accent-blue to-accent-cyan shadow-lg shadow-accent-blue/30' : 'bg-dark-700/40 border border-dark-600/30'}
                              ${isCurrent ? 'ring-2 ring-accent-cyan/40 animate-pulse-slow' : ''}`}>
                              {isCompleted && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm font-medium transition-colors duration-300 ${isCompleted ? 'text-white' : 'text-dark-500'}`}>
                              {step.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {placedOrder.status === 'CANCELED' && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium text-center animate-fade-in">
                      ✕ This order has been canceled
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-dark-500">
                  <svg className="w-12 h-12 mb-3 text-dark-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-sm">Place an order to see live tracking</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ TRACK ORDER TAB ═══════════ */}
        {tab === 'track' && (
          <div className="animate-fade-in space-y-6">
            {/* Search */}
            <div className="rounded-2xl bg-dark-800/50 border border-dark-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Track Your Order</h2>
              <form onSubmit={handleTrackOrder} className="flex gap-3">
                <input type="text" value={trackId} onChange={(e) => setTrackId(e.target.value)}
                  placeholder="Enter Order ID (e.g. ORD1A2B3C4D)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-dark-900/60 border border-dark-600/40 text-white placeholder-dark-400 font-mono
                    focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all" />
                <button type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold
                    hover:shadow-lg hover:shadow-accent-blue/25 transition-all duration-200">
                  Track
                </button>
              </form>
              {trackError && (
                <p className="mt-3 text-sm text-amber-400">{trackError}</p>
              )}
            </div>

            {/* Tracked Order Result */}
            {trackedOrder && (
              <div className="rounded-2xl bg-dark-800/50 border border-dark-700/40 p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-dark-400 mb-1">Order ID</p>
                    <p className="text-xl font-mono font-bold text-accent-blue">{trackedOrder.id}</p>
                  </div>
                  <StatusBadge status={trackedOrder.status} animate />
                </div>
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 p-3 rounded-xl bg-dark-900/40 border border-dark-700/30">
                    <p className="text-xs text-dark-400 mb-0.5">Product</p>
                    <p className="text-sm font-medium text-white">{trackedOrder.productName}</p>
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-dark-900/40 border border-dark-700/30">
                    <p className="text-xs text-dark-400 mb-0.5">Price</p>
                    <p className="text-sm font-semibold text-emerald-400">${trackedOrder.price?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between gap-1">
                  {ORDER_FLOW.map((step, i) => {
                    const currentIdx = getStepIndex(trackedOrder.status);
                    const isCompleted = i <= currentIdx;
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-500
                          ${isCompleted ? 'bg-gradient-to-br from-accent-blue to-accent-cyan shadow-lg shadow-accent-blue/30' : 'bg-dark-700/40 border border-dark-600/30'}`}>
                          {isCompleted ? (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <span className="text-[10px] font-bold text-dark-500">{i + 1}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium text-center leading-tight ${isCompleted ? 'text-white' : 'text-dark-500'}`}>
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Orders From This Session */}
            {recentOrders.length > 0 && (
              <div className="rounded-2xl bg-dark-800/50 border border-dark-700/40 p-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Your Recent Orders</h3>
                <div className="space-y-2">
                  {recentOrders.map((order) => (
                    <button key={order.id} onClick={() => { setTrackId(order.id); setTrackedOrder(order); setTrackError(''); }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-dark-900/40 border border-dark-700/30
                        hover:bg-dark-700/30 hover:border-dark-600/40 transition-all duration-200 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-semibold text-accent-blue">{order.id}</span>
                        <span className="text-sm text-dark-300">{order.productName}</span>
                      </div>
                      <StatusBadge status={order.status} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientPage;
