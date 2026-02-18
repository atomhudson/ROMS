import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/8 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-accent-cyan/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto animate-fade-in">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-accent-purple via-accent-blue to-accent-cyan flex items-center justify-center shadow-2xl shadow-accent-purple/30 animate-glow">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">
          Order Management
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-blue to-accent-cyan">
            System
          </span>
        </h1>
        <p className="text-dark-300 text-lg mb-12 max-w-md mx-auto">
          Real-time order tracking powered by WebSocket &amp; Webhooks
        </p>

        {/* Role Cards */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-xl mx-auto">
          {/* Client Card */}
          <button
            onClick={() => navigate('/client')}
            className="group relative overflow-hidden rounded-2xl bg-dark-800/50 border border-dark-700/40 backdrop-blur-sm p-8
              hover:border-accent-blue/40 hover:bg-dark-800/70 hover:-translate-y-1
              transition-all duration-300 text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-accent-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan shadow-lg shadow-accent-blue/25 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Client</h2>
              <p className="text-sm text-dark-300 leading-relaxed">Place orders and track them in real-time with live status updates</p>
              <div className="mt-4 flex items-center gap-1.5 text-accent-cyan text-sm font-semibold group-hover:gap-3 transition-all duration-300">
                Enter
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </button>

          {/* Admin Card */}
          <button
            onClick={() => navigate('/admin')}
            className="group relative overflow-hidden rounded-2xl bg-dark-800/50 border border-dark-700/40 backdrop-blur-sm p-8
              hover:border-accent-purple/40 hover:bg-dark-800/70 hover:-translate-y-1
              transition-all duration-300 text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-accent-indigo/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-purple to-accent-indigo shadow-lg shadow-accent-purple/25 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Admin</h2>
              <p className="text-sm text-dark-300 leading-relaxed">Monitor orders, manage statuses, and simulate webhooks</p>
              <div className="mt-4 flex items-center gap-1.5 text-accent-purple text-sm font-semibold group-hover:gap-3 transition-all duration-300">
                Enter
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Tech badges */}
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          {['WebSocket', 'STOMP', 'Webhooks', 'Spring Boot', 'React'].map((tech) => (
            <span key={tech} className="px-3 py-1 rounded-full bg-dark-800/40 border border-dark-700/30 text-xs font-medium text-dark-300">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
