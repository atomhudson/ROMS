import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ isConnected }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

          <div className="flex items-center gap-3">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800/60 border border-dark-700/40">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase
                  ${user.role === 'ADMIN'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  }`}>
                  {user.role}
                </span>
                <span className="text-xs text-dark-200 font-medium">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="ml-1 p-1 rounded-md hover:bg-dark-700/50 text-dark-400 hover:text-rose-400 transition-all"
                  title="Logout"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            )}

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
      </div>
    </nav>
  );
};

export default Navbar;
