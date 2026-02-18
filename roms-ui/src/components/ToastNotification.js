import React, { useState, useEffect, useCallback } from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/50',
    warning: 'from-amber-500/20 to-amber-600/10 border-amber-500/50',
    error: 'from-red-500/20 to-red-600/10 border-red-500/50',
    info: 'from-purple-500/20 to-purple-600/10 border-purple-500/50',
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: '📦',
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border bg-gradient-to-r backdrop-blur-xl shadow-2xl
        ${colors[type]}
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0 animate-slide-up'}`}
    >
      <span className="text-lg mt-0.5">{icons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90">{message}</p>
      </div>
      <button
        onClick={() => { setIsExiting(true); setTimeout(onClose, 300); }}
        className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-80 max-w-[90vw]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

export default ToastContainer;
