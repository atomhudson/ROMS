import React from 'react';

const Navbar = ({ isConnected }) => {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-dark-900/80 border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Order Management</h1>
              <p className="text-xs text-dark-300 -mt-0.5">Real-time Dashboard</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800/60 border border-dark-700/40">
            <div className={`w-2 h-2 rounded-full ${isConnected 
              ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse-slow' 
              : 'bg-rose-400 shadow-lg shadow-rose-400/50'
            }`} />
            <span className={`text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
