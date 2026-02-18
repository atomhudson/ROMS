import React, { useState } from 'react';
import { createOrder } from '../services/api';

const OrderForm = ({ isOpen, onClose, onOrderCreated }) => {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim() || !price) return;

    setLoading(true);
    setError('');
    try {
      const order = await createOrder({
        productName: productName.trim(),
        price: parseFloat(price),
      });
      if (onOrderCreated) onOrderCreated(order);
      setProductName('');
      setPrice('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="rounded-2xl bg-dark-800 border border-dark-700/50 shadow-2xl shadow-black/40 overflow-hidden">
          {/* Header gradient bar */}
          <div className="h-1 bg-gradient-to-r from-accent-purple via-accent-blue to-accent-cyan" />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">New Order</h2>
                <p className="text-sm text-dark-300">Create a new order entry</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-dark-700/50 hover:bg-dark-600 flex items-center justify-center text-dark-300 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900/60 border border-dark-600/40 text-white placeholder-dark-400
                    focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/25
                    transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900/60 border border-dark-600/40 text-white placeholder-dark-400
                    focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/25
                    transition-all duration-200"
                />
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-dark-700/50 text-dark-200 font-medium
                    hover:bg-dark-600 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !productName.trim() || !price}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white font-semibold
                    hover:shadow-lg hover:shadow-accent-purple/25 hover:-translate-y-0.5
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
                    transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create Order'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
