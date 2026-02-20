import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import OrderTable from '../components/OrderTable';
import OrderForm from '../components/OrderForm';
import NodeGraph from '../components/NodeGraph';
import ToastContainer, { useToast } from '../components/ToastNotification';
import { STATUS_LABELS } from '../components/StatusBadge';
import { fetchOrders, simulateWebhook } from '../services/api';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';

const AdminPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedOrderIds, setUpdatedOrderIds] = useState(new Set());
  const { toasts, addToast, removeToast } = useToast();
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 20;

  // Webhook simulator state
  const [webhookOrderId, setWebhookOrderId] = useState('');
  const [webhookStatus, setWebhookStatus] = useState('PROCESSING');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);
  const [webhookLog, setWebhookLog] = useState([]);

  // Fetch orders (paginated)
  const loadOrders = useCallback(async (page = 0) => {
    try {
      setLoading(true);
      const data = await fetchOrders({ page, size: PAGE_SIZE });
      setOrders(data.content || []);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setError('');
    } catch (err) {
      setError('Unable to connect to server. Ensure backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handlePageChange = (page) => {
    loadOrders(page);
  };

  // WebSocket updates with toast notifications
  const handleOrderUpdate = useCallback((updatedOrder) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === updatedOrder.id);
      if (idx >= 0) {
        // Order is on the current page → update in-place
        const newOrders = [...prev];
        newOrders[idx] = updatedOrder;
        return newOrders;
      }
      // Order is NOT on the current page → don't prepend (would break pagination)
      return prev;
    });
    // Bump refresh key so Dashboard re-fetches stats instantly
    setStatsRefreshKey((k) => k + 1);
    setUpdatedOrderIds((prev) => new Set(prev).add(updatedOrder.id));
    setTimeout(() => {
      setUpdatedOrderIds((prev) => { const n = new Set(prev); n.delete(updatedOrder.id); return n; });
    }, 1500);

    // Toast notification on status change
    const statusLabel = STATUS_LABELS[updatedOrder.status] || updatedOrder.status;
    addToast(
      `${updatedOrder.id} → ${statusLabel}`,
      updatedOrder.status === 'DELIVERED' ? 'success'
        : updatedOrder.status === 'CANCELLED' ? 'error'
        : updatedOrder.status === 'CREATED' ? 'info'
        : 'warning'
    );

    // Log WebSocket event
    setWebhookLog((prev) => [{
      time: new Date().toLocaleTimeString(),
      type: 'ws',
      message: `Order ${updatedOrder.id} → ${updatedOrder.status}`,
    }, ...prev].slice(0, 50));
  }, [addToast]);

  useEffect(() => {
    connectWebSocket(handleOrderUpdate, () => setIsConnected(true), () => setIsConnected(false));
    return () => disconnectWebSocket();
  }, [handleOrderUpdate]);

  // Webhook simulator
  const handleWebhookSend = async () => {
    if (!webhookOrderId.trim()) return;
    setWebhookLoading(true);
    setWebhookResult(null);
    try {
      const result = await simulateWebhook(webhookOrderId.trim(), webhookStatus);
      setWebhookResult({ success: true, message: result });
      setWebhookLog((prev) => [{
        time: new Date().toLocaleTimeString(),
        type: 'webhook',
        message: `Webhook → ${webhookOrderId.trim()} → ${webhookStatus}`,
      }, ...prev].slice(0, 50));
    } catch (err) {
      setWebhookResult({ success: false, message: err.response?.data || 'Webhook failed' });
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-purple/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-accent-indigo/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-dark-900/80 border-b border-dark-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-purple to-accent-indigo flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12" />
                </svg>
              </div>
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-dark-800/60 border border-dark-700/40">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse-slow' : 'bg-rose-400'}`} />
                <span className={`text-[10px] font-medium ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isConnected ? 'WS Live' : 'WS Offline'}
                </span>
              </div>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-indigo text-white text-xs font-semibold
                  hover:shadow-lg hover:shadow-accent-purple/25 transition-all duration-200">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Order
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          {/* Dashboard Cards */}
          <Dashboard refreshKey={statsRefreshKey} />

          {/* Live Connection Map */}
          <NodeGraph />

          {/* Main Content — Table + Webhook Panel */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders Table — 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">All Orders</h2>
                  <p className="text-xs text-dark-400 mt-0.5">{totalElements} total — page {currentPage + 1} of {totalPages} — updates in real-time via WebSocket</p>
                </div>
              </div>
              {loading ? (
                <div className="rounded-2xl bg-dark-800/30 border border-dark-700/30 p-12 text-center">
                  <svg className="w-8 h-8 mx-auto mb-3 animate-spin text-accent-purple" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-dark-400">Loading orders...</p>
                </div>
              ) : (
                <OrderTable
                  orders={orders}
                  updatedOrderIds={updatedOrderIds}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={PAGE_SIZE}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Right Panel — Webhook Simulator + Event Log */}
            <div className="space-y-4">
              {/* Webhook Simulator */}
              <div className="rounded-2xl bg-dark-800/50 border border-dark-700/40 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.06a4.5 4.5 0 006.364 6.364L13.19 8.688z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Webhook Simulator</h3>
                      <p className="text-[10px] text-dark-400">POST /webhook/payment</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-dark-300 mb-1">Order ID</label>
                      <input type="text" value={webhookOrderId} onChange={(e) => setWebhookOrderId(e.target.value)}
                        placeholder="ORD1A2B3C4D"
                        className="w-full px-3 py-2 rounded-lg bg-dark-900/60 border border-dark-600/40 text-white text-sm font-mono
                          placeholder-dark-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dark-300 mb-1">New Status</label>
                      <select value={webhookStatus} onChange={(e) => setWebhookStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-dark-900/60 border border-dark-600/40 text-white text-sm
                          focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer">
                        {Object.keys(STATUS_LABELS).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>

                    <button onClick={handleWebhookSend} disabled={webhookLoading || !webhookOrderId.trim()}
                      className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold
                        hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
                      {webhookLoading ? 'Sending...' : 'Send Webhook'}
                    </button>

                    {webhookResult && (
                      <div className={`px-3 py-2 rounded-lg text-xs font-medium animate-fade-in
                        ${webhookResult.success 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                        {webhookResult.success ? '✓' : '✕'} {typeof webhookResult.message === 'string' ? webhookResult.message : JSON.stringify(webhookResult.message)}
                      </div>
                    )}
                  </div>

                  {/* Payload Preview */}
                  <div className="mt-4 p-3 rounded-lg bg-dark-950/60 border border-dark-700/20">
                    <p className="text-[10px] text-dark-500 mb-1.5 uppercase tracking-wider font-semibold">Payload Preview</p>
                    <pre className="text-xs text-dark-300 font-mono leading-relaxed">
{`{
  "orderId": "${webhookOrderId || 'ORD...'}",
  "status": "${webhookStatus}"
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Event Log */}
              <div className="rounded-2xl bg-dark-800/50 border border-dark-700/40 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-accent-purple to-accent-blue" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white">Event Log</h3>
                    <span className="text-[10px] text-dark-500">{webhookLog.length} events</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {webhookLog.length === 0 ? (
                      <p className="text-xs text-dark-500 text-center py-4">No events yet — updates appear here in real-time</p>
                    ) : (
                      webhookLog.map((log, i) => (
                        <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-dark-900/30 animate-slide-down">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 mt-0.5
                            ${log.type === 'ws' 
                              ? 'bg-accent-blue/15 text-accent-blue' 
                              : 'bg-amber-500/15 text-amber-400'}`}>
                            {log.type === 'ws' ? 'WS' : 'WH'}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs text-dark-200 truncate">{log.message}</p>
                            <p className="text-[10px] text-dark-500">{log.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Order Form Modal */}
      <OrderForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onOrderCreated={(order) => {
          // Re-fetch page 0 to show the new order at the top
          loadOrders(0);
          addToast(`Order ${order.id} created successfully!`, 'success');
        }}
      />
    </div>
  );
};

export default AdminPage;
