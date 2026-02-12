import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Brain, Database, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface Anomaly {
  id: string;
  timestamp: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  aiAnalysis: string;
  confidence: number;
  resolved: boolean;
}

interface AnomalyMetrics {
  timestamp: string;
  normal: number;
  anomalies: number;
  confidence: number;
}

const AnomalyDetector: React.FC = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [metrics, setMetrics] = useState<AnomalyMetrics[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [llmModel, setLlmModel] = useState('gpt-4o-mini');

  useEffect(() => {
    // Initialize with some sample data
    const sampleAnomalies: Anomaly[] = [
      {
        id: 'anom_001',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        source: 'WORLD_NY_1999.subway_commuter_density',
        severity: 'high',
        description: 'Unusual spike in commuter density at Times Square station',
        aiAnalysis: 'Detected 340% increase in passenger density compared to normal rush hour patterns. Potential emergency evacuation or system malfunction.',
        confidence: 0.92,
        resolved: false
      },
      {
        id: 'anom_002',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        source: 'WORLD_LA_2024.ev_charging_logs',
        severity: 'medium',
        description: 'Abnormal charging session duration detected',
        aiAnalysis: 'Multiple sessions exceeding 8 hours at Venice Beach Supercharger. Possible payment system issue or vehicle malfunction.',
        confidence: 0.78,
        resolved: true
      },
      {
        id: 'anom_003',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        source: 'WORLD_NY_1999.yellow_cab_dispatch',
        severity: 'low',
        description: 'Slight delay in dispatch response time',
        aiAnalysis: 'Average response time increased by 15% in Brooklyn Heights area. Weather conditions may be affecting traffic patterns.',
        confidence: 0.65,
        resolved: false
      }
    ];

    setAnomalies(sampleAnomalies);

    // Simulate real-time metrics
    const interval = setInterval(() => {
      if (!isActive) return;

      const now = new Date().toLocaleTimeString();
      setMetrics(prev => [
        ...prev.slice(-19), // Keep last 20 points
        {
          timestamp: now,
          normal: Math.floor(Math.random() * 100) + 800,
          anomalies: Math.floor(Math.random() * 10) + 1,
          confidence: Math.random() * 0.3 + 0.7
        }
      ]);

      // Occasionally add new anomalies
      if (Math.random() > 0.95) {
        const newAnomaly: Anomaly = {
          id: `anom_${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: ['WORLD_NY_1999.subway_commuter_density', 'WORLD_LA_2024.ev_charging_logs', 'WORLD_NY_1999.yellow_cab_dispatch'][Math.floor(Math.random() * 3)],
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          description: 'Anomalous pattern detected in data stream',
          aiAnalysis: 'AI analysis in progress...',
          confidence: Math.random() * 0.4 + 0.6,
          resolved: false
        };
        setAnomalies(prev => [newAnomaly, ...prev.slice(0, 9)]); // Keep only last 10
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-matrix-green';
      default: return 'text-matrix-green';
    }
  };

  const getSeverityIcon = (severity: string, resolved: boolean) => {
    if (resolved) return <CheckCircle className="w-4 h-4 text-matrix-green" />;
    
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const activeAnomalies = anomalies.filter(a => !a.resolved).length;
  const totalProcessed = anomalies.length;
  const avgConfidence = anomalies.length > 0 ? 
    Math.round(anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length * 100) : 0;

  return (
    <div className="p-6 pb-16 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-matrix-green animate-glow" />
          <div>
            <h1 className="text-3xl font-bold text-matrix-green">ANOMALY DETECTOR</h1>
            <p className="text-matrix-darkgreen">AI-powered event stream analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <div className="text-matrix-darkgreen">LLM Model:</div>
            <div className="text-matrix-green font-mono">{llmModel}</div>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded border transition-all ${
              isActive 
                ? 'border-matrix-red bg-matrix-red/20 text-matrix-red' 
                : 'border-matrix-green bg-matrix-green/20 text-matrix-green'
            }`}
          >
            <div className={`status-indicator ${isActive ? 'status-active' : 'status-inactive'}`} />
            {isActive ? 'STOP DETECTOR' : 'START DETECTOR'}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="terminal-window">
          <div className="terminal-content">
            <div className="text-2xl font-bold text-red-400">{activeAnomalies}</div>
            <div className="text-sm text-matrix-darkgreen">Active Anomalies</div>
          </div>
        </div>
        <div className="terminal-window">
          <div className="terminal-content">
            <div className="text-2xl font-bold text-matrix-green">{totalProcessed}</div>
            <div className="text-sm text-matrix-darkgreen">Total Processed</div>
          </div>
        </div>
        <div className="terminal-window">
          <div className="terminal-content">
            <div className="text-2xl font-bold text-matrix-green">{avgConfidence}%</div>
            <div className="text-sm text-matrix-darkgreen">Avg Confidence</div>
          </div>
        </div>
        <div className="terminal-window">
          <div className="terminal-content">
            <div className="flex items-center gap-2">
              <div className={`status-indicator ${isActive ? 'status-active' : 'status-inactive'}`} />
              <div className="text-lg font-bold text-matrix-green">
                {isActive ? 'SCANNING' : 'STOPPED'}
              </div>
            </div>
            <div className="text-sm text-matrix-darkgreen">Detector Status</div>
          </div>
        </div>
      </div>

      {/* Real-time Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="terminal-window">
          <div className="terminal-header">
            <TrendingUp className="w-4 h-4 text-matrix-green" />
            <span className="ml-2">EVENT PROCESSING RATE</span>
          </div>
          <div className="terminal-content">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#008f00" />
                <XAxis dataKey="timestamp" tick={{ fill: '#00ff00', fontSize: 10 }} />
                <YAxis tick={{ fill: '#00ff00', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: '1px solid #00ff00', 
                    borderRadius: '4px',
                    color: '#00ff00'
                  }} 
                />
                <Line type="monotone" dataKey="normal" stroke="#00ff00" strokeWidth={2} name="Normal Events" />
                <Line type="monotone" dataKey="anomalies" stroke="#ff0040" strokeWidth={2} name="Anomalies" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="terminal-window">
          <div className="terminal-header">
            <Brain className="w-4 h-4 text-matrix-green" />
            <span className="ml-2">CONFIDENCE DISTRIBUTION</span>
          </div>
          <div className="terminal-content">
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart data={anomalies}>
                <CartesianGrid strokeDasharray="3 3" stroke="#008f00" />
                <XAxis 
                  type="category" 
                  dataKey="severity" 
                  tick={{ fill: '#00ff00', fontSize: 10 }} 
                  name="Severity" 
                />
                <YAxis 
                  type="number" 
                  dataKey="confidence" 
                  tick={{ fill: '#00ff00', fontSize: 10 }} 
                  name="Confidence" 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: '1px solid #00ff00', 
                    borderRadius: '4px',
                    color: '#00ff00'
                  }} 
                />
                <Scatter dataKey="confidence" fill="#00ff00" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Processing Pipeline */}
      <div className="terminal-window">
        <div className="terminal-header">
          <Database className="w-4 h-4 text-matrix-green" />
          <span className="ml-2">PROCESSING PIPELINE</span>
        </div>
        <div className="terminal-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <div className="text-matrix-green font-semibold mb-2">INPUT TOPIC</div>
              <div className="text-sm text-matrix-darkgreen">WORLD_NY_1999.subway_commuter_density</div>
            </div>
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <div className="text-matrix-green font-semibold mb-2">AI ANALYSIS</div>
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-5 h-5 text-matrix-green animate-glow" />
                <div className="text-sm text-matrix-darkgreen">LLM Processing</div>
              </div>
            </div>
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <div className="text-matrix-green font-semibold mb-2">TRIGGER TOPIC</div>
              <div className="text-sm text-matrix-darkgreen">anomaly_detection_pings</div>
            </div>
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <div className="text-matrix-green font-semibold mb-2">ENRICHED OUTPUT</div>
              <div className="text-sm text-matrix-darkgreen">knowledge_ingestion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="terminal-window">
        <div className="terminal-header">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="ml-2">DETECTED ANOMALIES</span>
        </div>
        <div className="terminal-content">
          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <div 
                key={anomaly.id} 
                className={`border rounded p-4 ${
                  anomaly.resolved ? 'border-matrix-darkgreen bg-matrix-darkgreen/10' : 'border-red-400/50 bg-red-400/5'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(anomaly.severity, anomaly.resolved)}
                    <div>
                      <div className={`font-semibold uppercase text-sm ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity} SEVERITY
                      </div>
                      <div className="text-xs text-matrix-darkgreen">
                        {new Date(anomaly.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-matrix-green">Confidence: {Math.round(anomaly.confidence * 100)}%</div>
                    <div className="text-xs text-matrix-darkgreen font-mono">{anomaly.source}</div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="text-matrix-green font-medium">{anomaly.description}</div>
                </div>
                
                <div className="bg-matrix-darkgray/20 rounded p-3">
                  <div className="text-sm text-matrix-darkgreen mb-1">🤖 AI Analysis:</div>
                  <div className="text-sm text-matrix-green">{anomaly.aiAnalysis}</div>
                </div>
                
                {!anomaly.resolved && (
                  <div className="mt-3 flex gap-2">
                    <button 
                      className="matrix-button text-xs"
                      onClick={() => {
                        setAnomalies(prev => prev.map(a => 
                          a.id === anomaly.id ? {...a, resolved: true} : a
                        ));
                      }}
                    >
                      RESOLVE
                    </button>
                    <button className="matrix-button text-xs">INVESTIGATE</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetector;