import React from 'react';
import { Server, Database, Shield, Eye, Network, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const architectureComponents = [
    {
      name: 'Sim_1999_NY',
      port: '19192-19290',
      auth: 'anonymous',
      prefix: 'WORLD_NY_1999',
      status: 'active',
      description: 'New York 1999 simulation layer'
    },
    {
      name: 'Sim_2024_LA',
      port: '19292-19390',
      auth: 'SASL/PLAIN',
      prefix: 'WORLD_LA_2024',
      status: 'active',
      description: 'Los Angeles 2024 simulation layer'
    },
    {
      name: 'Machine_City_Core',
      port: '19092-19190',
      auth: 'anonymous (passthru)',
      prefix: '',
      status: 'active',
      description: 'Core machine city processing'
    },
  ];

  const agents = [
    {
      name: 'Anomaly Detector Agent',
      description: 'Kafka → LLM → Kafka enrichment pipeline',
      status: 'running',
      lastActivity: '2s ago',
      icon: Shield
    },
    {
      name: 'Sentinel Agent',
      description: 'LLM reasoning via Volcano SDK',
      status: 'scanning',
      lastActivity: '5s ago',
      icon: Eye
    },
  ];

  const metrics = [
    { label: 'Events/sec', value: '847', trend: '+12%' },
    { label: 'Virtual Clusters', value: '3', trend: 'stable' },
    { label: 'Active Topics', value: '21', trend: '+2' },
    { label: 'Anomalies Detected', value: '4', trend: '+1' },
  ];

  return (
    <div className="p-6 pb-12 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 animate-glow">THE MATRIX</h1>
        <p className="text-matrix-darkgreen text-lg">
          "The Matrix is everywhere. It is all around us. Even now, in this very room."
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="terminal-window">
            <div className="terminal-content">
              <div className="text-2xl font-bold text-matrix-green">{metric.value}</div>
              <div className="text-sm text-matrix-darkgreen">{metric.label}</div>
              <div className="text-xs mt-1 text-matrix-green">{metric.trend}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Overview */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-button bg-matrix-red"></div>
          <div className="terminal-button bg-yellow-500"></div>
          <div className="terminal-button bg-matrix-green"></div>
          <span className="ml-2 font-semibold">KONG EVENT GATEWAY ARCHITECTURE</span>
        </div>
        <div className="terminal-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {architectureComponents.map((component, index) => (
              <div key={index} className="border border-matrix-darkgreen rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-matrix-green">{component.name}</h3>
                  <div className="flex items-center gap-1">
                    <div className="status-indicator status-active"></div>
                    <span className="text-xs text-matrix-darkgreen">ACTIVE</span>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-matrix-darkgreen">
                  <div>Port: {component.port}</div>
                  <div>Auth: {component.auth}</div>
                  {component.prefix && <div>Prefix: {component.prefix}</div>}
                  <div className="text-xs mt-2">{component.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 border border-matrix-darkgreen rounded bg-matrix-darkgray/20">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-matrix-green" />
              <span className="font-semibold">Source-Zero-Mainframe</span>
            </div>
            <div className="text-sm text-matrix-darkgreen">
              Backend Kafka Cluster (3-node KRaft configuration)
            </div>
          </div>
        </div>
      </div>

      {/* AI Agents Status */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-button bg-matrix-red"></div>
          <div className="terminal-button bg-yellow-500"></div>
          <div className="terminal-button bg-matrix-green"></div>
          <span className="ml-2 font-semibold">AI AGENTS STATUS</span>
        </div>
        <div className="terminal-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent, index) => (
              <div key={index} className="border border-matrix-darkgreen rounded p-4">
                <div className="flex items-center gap-3 mb-3">
                  <agent.icon className="w-6 h-6 text-matrix-green" />
                  <div>
                    <h3 className="font-semibold text-matrix-green">{agent.name}</h3>
                    <div className="text-xs text-matrix-darkgreen">{agent.description}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="status-indicator status-active"></div>
                    <span className="text-sm text-matrix-green uppercase">{agent.status}</span>
                  </div>
                  <div className="text-xs text-matrix-darkgreen">{agent.lastActivity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-button bg-matrix-red"></div>
          <div className="terminal-button bg-yellow-500"></div>
          <div className="terminal-button bg-matrix-green"></div>
          <span className="ml-2 font-semibold">RECENT ACTIVITY</span>
        </div>
        <div className="terminal-content">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-matrix-darkgreen">[{new Date().toLocaleTimeString()}]</span>
              <Activity className="w-4 h-4 text-matrix-green" />
              <span>Data generator producing to WORLD_NY_1999.yellow_cab_dispatch</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-matrix-darkgreen">[{new Date(Date.now() - 5000).toLocaleTimeString()}]</span>
              <Shield className="w-4 h-4 text-matrix-red" />
              <span>Anomaly detected in subway commuter density</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-matrix-darkgreen">[{new Date(Date.now() - 10000).toLocaleTimeString()}]</span>
              <Network className="w-4 h-4 text-matrix-green" />
              <span>KEG virtual cluster sync completed</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-matrix-darkgreen">[{new Date(Date.now() - 15000).toLocaleTimeString()}]</span>
              <Eye className="w-4 h-4 text-matrix-green" />
              <span>Sentinel agent performing routine scan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;