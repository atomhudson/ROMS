import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [presets, setPresets] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState('CLIENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'ADMIN' ? '/admin' : '/client');
    }
  }, [user, navigate]);

  // Fetch preset users
  useEffect(() => {
    api.get('/dev/presets')
      .then(res => setPresets(res.data))
      .catch(() => setPresets([]));
  }, []);

  const handleLogin = async (name, email, role) => {
    setLoading(true);
    setError('');
    try {
      const userData = await login(name, email, role);
      navigate(userData.role === 'ADMIN' ? '/admin' : '/client');
    } catch (err) {
      setError('Login failed. Is the backend running with dev profile?');
    } finally {
      setLoading(false);
    }
  };

  const roleIcons = {
    ADMIN: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    CLIENT: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
      </svg>
    ),
  };

  const roleColors = {
    ADMIN: 'from-amber-500 to-orange-600',
    CLIENT: 'from-accent-blue to-accent-cyan',
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-blue/30">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">OMS Login</h1>
          <p className="text-sm text-dark-400 mt-1">Development Mode — Choose a test identity</p>
        </div>

        {/* Preset Users */}
        {presets.length > 0 && (
          <div className="rounded-2xl bg-dark-800/50 border border-dark-700/40 p-5">
            <h2 className="text-xs font-bold text-dark-300 uppercase tracking-wider mb-3">Quick Login</h2>
            <div className="grid gap-2">
              {presets.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handleLogin(preset.name, preset.email, preset.role)}
                  disabled={loading}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all duration-200
                    bg-dark-900/40 border-dark-700/30 hover:bg-dark-700/40 hover:border-dark-600/40
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${roleColors[preset.role] || roleColors.CLIENT} flex items-center justify-center shadow-lg`}>
                    {roleIcons[preset.role] || roleIcons.CLIENT}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-white">{preset.name}</p>
                    <p className="text-xs text-dark-400">{preset.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                    ${preset.role === 'ADMIN' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'}`}>
                    {preset.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Login */}
        <div className="rounded-2xl bg-dark-800/50 border border-dark-700/40 p-5">
          <h2 className="text-xs font-bold text-dark-300 uppercase tracking-wider mb-3">Custom Login</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(customName, customEmail, customRole); }} className="space-y-3">
            <input
              type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
              placeholder="Name" required
              className="w-full px-4 py-2.5 rounded-xl bg-dark-900/60 border border-dark-600/40 text-white placeholder-dark-400
                focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all text-sm"
            />
            <input
              type="email" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="Email" required
              className="w-full px-4 py-2.5 rounded-xl bg-dark-900/60 border border-dark-600/40 text-white placeholder-dark-400
                focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all text-sm"
            />
            <select
              value={customRole} onChange={(e) => setCustomRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-dark-900/60 border border-dark-600/40 text-white
                focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all text-sm"
            >
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading || !customName || !customEmail}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold
                hover:shadow-lg hover:shadow-accent-blue/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-dark-500">
          ⚠️ Dev mode only — uses <code className="text-dark-400">/dev/token</code> endpoint
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
