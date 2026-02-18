import React, { useState, useEffect } from 'react';
import { fetchMetricsSummary } from '../services/api';

const NodeGraph = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const load = () => {
      fetchMetricsSummary()
        .then(setMetrics)
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeWs = metrics?.activeWebSocketConnections || 0;
  const totalWs = metrics?.totalWebSocketConnections || 0;
  const webhookCalls = metrics?.totalWebhookCalls || 0;
  const webhookErrors = metrics?.totalWebhookErrors || 0;
  const ordersCreated = metrics?.totalOrdersCreated || 0;

  // Generate client nodes around the backend hub
  const clientNodes = [];
  const count = Math.min(activeWs, 12); // cap visual nodes at 12
  for (let i = 0; i < count; i++) {
    const angle = (i / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2;
    const rx = 150, ry = 100;
    clientNodes.push({
      x: 250 + rx * Math.cos(angle),
      y: 140 + ry * Math.sin(angle),
      label: `Client ${i + 1}`,
    });
  }

  return (
    <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
      <h3 className="text-base font-semibold text-white/90 mb-4 flex items-center gap-2">
        <span className="text-lg">🌐</span> Live Connection Map
      </h3>

      <div className="flex justify-center">
        <svg viewBox="0 0 500 280" className="w-full max-w-lg">
          {/* Connection lines from clients to backend */}
          {clientNodes.map((node, i) => (
            <line
              key={`line-${i}`}
              x1={node.x} y1={node.y}
              x2={250} y2={140}
              stroke="url(#lineGrad)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.6"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
            </line>
          ))}

          {/* Webhook line */}
          <line x1={420} y1={260} x2={250} y2={155} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.5">
            <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="2s" repeatCount="indefinite" />
          </line>

          {/* Prometheus scrape line */}
          <line x1={80} y1={260} x2={250} y2={155} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.5">
            <animate attributeName="stroke-dashoffset" from="0" to="12" dur="3s" repeatCount="indefinite" />
          </line>

          {/* Gradient defs */}
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
            </linearGradient>
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Backend hub glow */}
          <circle cx={250} cy={140} r={50} fill="url(#hubGlow)">
            <animate attributeName="r" values="45;55;45" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Backend hub node */}
          <circle cx={250} cy={140} r={32} fill="#1e1b4b" stroke="#a855f7" strokeWidth="2" />
          <text x={250} y={136} textAnchor="middle" fill="white" fontSize="10" fontWeight="600">Backend</text>
          <text x={250} y={150} textAnchor="middle" fill="#c4b5fd" fontSize="8">:8080</text>

          {/* Client nodes */}
          {clientNodes.map((node, i) => (
            <g key={`node-${i}`}>
              <circle cx={node.x} cy={node.y} r={14} fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.9">
                <animate attributeName="opacity" values="0.7;1;0.7" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
              <text x={node.x} y={node.y + 3} textAnchor="middle" fill="#e2e8f0" fontSize="7" fontWeight="500">
                C{i + 1}
              </text>
            </g>
          ))}

          {/* Webhook node */}
          <rect x={388} y={240} width={64} height={32} rx={8} fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <text x={420} y={259} textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="600">Webhook</text>

          {/* Prometheus node */}
          <rect x={48} y={240} width={64} height={32} rx={8} fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
          <text x={80} y={259} textAnchor="middle" fill="#22d3ee" fontSize="8" fontWeight="600">Prometheus</text>
        </svg>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="text-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="text-xl font-bold text-purple-400">{activeWs}</div>
          <div className="text-[10px] text-white/50 uppercase tracking-wider">Active WS</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-xl font-bold text-blue-400">{totalWs}</div>
          <div className="text-[10px] text-white/50 uppercase tracking-wider">Total WS</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-xl font-bold text-amber-400">{webhookCalls}</div>
          <div className="text-[10px] text-white/50 uppercase tracking-wider">Webhooks</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="text-xl font-bold text-green-400">{ordersCreated}</div>
          <div className="text-[10px] text-white/50 uppercase tracking-wider">Orders</div>
        </div>
      </div>
    </div>
  );
};

export default NodeGraph;
