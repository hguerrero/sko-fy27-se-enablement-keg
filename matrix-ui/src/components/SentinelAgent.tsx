import React, { useState, useEffect } from 'react';
import { Eye, Brain, Play, Pause, Terminal, MessageSquare, Clock, Target } from 'lucide-react';

interface ScanResult {
  id: string;
  timestamp: string;
  query: string;
  response: string;
  anomalyDetected: boolean;
  details?: string;
  confidence: number;
}

const SentinelAgent: React.FC = () => {
  const [isActive, setIsActive] = useState(true);
  const [scanInterval, setScanInterval] = useState(10);
  const [customPrompt, setCustomPrompt] = useState('Have you detected an anomaly? Reply YES or NO');
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<string>('');
  
  // Simulated LLM responses
  const generateResponse = (prompt: string): { response: string; hasAnomaly: boolean; details?: string; confidence: number } => {
    const responses = [
      {
        response: 'No current anomaly detected.',
        hasAnomaly: false,
        confidence: 0.95
      },
      {
        response: 'YES - Anomaly detected in subway commuter density data.',
        hasAnomaly: true,
        details: 'Target Entity: NYC Subway System, Times Square Station\nLocation: Manhattan, New York\nDetails: Unusual passenger density spike detected at 15:47 UTC. Density levels 340% above normal rush hour patterns. Possible emergency evacuation or system malfunction requiring immediate attention.',
        confidence: 0.92
      },
      {
        response: 'YES - Irregular pattern identified in EV charging network.',
        hasAnomaly: true,
        details: 'Target Entity: Venice Beach Supercharger Network\nLocation: Los Angeles, California\nDetails: Multiple charging sessions exceeding normal duration thresholds. Potential payment system malfunction or vehicle charging anomalies detected.',
        confidence: 0.78
      },
      {
        response: 'No immediate threats detected in current data streams.',
        hasAnomaly: false,
        confidence: 0.88
      },
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Simulate scanning process
  const performScan = async () => {
    setIsScanning(true);
    setCurrentScan('Initiating scan sequence...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setCurrentScan('Analyzing data patterns...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentScan('Querying AI model...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setCurrentScan('Processing response...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = generateResponse(customPrompt);
    
    const newScanResult: ScanResult = {
      id: `scan_${Date.now()}`,
      timestamp: new Date().toISOString(),
      query: customPrompt,
      response: result.response,
      anomalyDetected: result.hasAnomaly,
      details: result.details,
      confidence: result.confidence
    };
    
    setScanHistory(prev => [newScanResult, ...prev.slice(0, 9)]); // Keep last 10
    setIsScanning(false);
    setCurrentScan('');
  };

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      performScan();
    }, scanInterval * 1000);

    return () => clearInterval(interval);
  }, [isActive, scanInterval, customPrompt]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (anomaly: boolean) => {
    return anomaly ? 'text-red-400' : 'text-matrix-green';
  };

  const getStatusIcon = (anomaly: boolean) => {
    return anomaly ? '🚨' : '✅';
  };

  return (
    <div className="p-6 pb-16 space-y-6 min-h-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Eye className="w-12 h-12 text-matrix-red animate-glow" />
          <div>
            <h1 className="text-4xl font-bold text-matrix-green">SENTINEL AGENT</h1>
            <p className="text-matrix-darkgreen text-lg">AI-powered threat detection & reasoning</p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-button bg-matrix-red"></div>
          <div className="terminal-button bg-yellow-500"></div>
          <div className="terminal-button bg-matrix-green"></div>
          <span className="ml-2 font-semibold">SENTINEL CONTROL PANEL</span>
        </div>
        <div className="terminal-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-matrix-green">Status & Control</h3>
              <div className="flex items-center gap-3">
                <div className={`status-indicator ${isActive ? 'status-active' : 'status-inactive'}`} />
                <span className="text-matrix-green font-semibold">
                  {isActive ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 px-4 py-2 rounded border transition-all ${
                  isActive 
                    ? 'border-matrix-red bg-matrix-red/20 text-matrix-red' 
                    : 'border-matrix-green bg-matrix-green/20 text-matrix-green'
                }`}
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isActive ? 'DEACTIVATE' : 'ACTIVATE'}
              </button>
              <button
                onClick={performScan}
                className="matrix-button flex items-center gap-2 w-full"
                disabled={isScanning}
              >
                <Eye className="w-4 h-4" />
                {isScanning ? 'SCANNING...' : 'MANUAL SCAN'}
              </button>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-matrix-green">Configuration</h3>
              <div>
                <label className="block text-sm text-matrix-darkgreen mb-2">
                  Scan Interval (seconds)
                </label>
                <input
                  type="number"
                  value={scanInterval}
                  onChange={(e) => setScanInterval(Number(e.target.value))}
                  className="matrix-input w-full"
                  min="5"
                  max="60"
                />
              </div>
              <div>
                <label className="block text-sm text-matrix-darkgreen mb-2">
                  Custom Query Prompt
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="matrix-input w-full h-20 resize-none"
                  placeholder="Enter your custom prompt..."
                />
              </div>
            </div>

            {/* Current Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-matrix-green">Current Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Next Scan:</span>
                  <span className="text-matrix-green">
                    {isActive ? `${scanInterval}s` : 'PAUSED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Scans:</span>
                  <span className="text-matrix-green">{scanHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Anomalies Found:</span>
                  <span className="text-red-400">
                    {scanHistory.filter(s => s.anomalyDetected).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LLM Model:</span>
                  <span className="text-matrix-green font-mono">gpt-4o-mini</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Scanning Status */}
      {isScanning && (
        <div className="terminal-window">
          <div className="terminal-header">
            <Brain className="w-4 h-4 text-matrix-green animate-glow" />
            <span className="ml-2">LIVE SCAN IN PROGRESS</span>
          </div>
          <div className="terminal-content">
            <div className="flex items-center gap-3">
              <div className="status-indicator status-active animate-pulse"></div>
              <span className="text-matrix-green animate-glow">{currentScan}</span>
            </div>
            <div className="mt-4 bg-matrix-darkgray/20 rounded p-3">
              <div className="text-sm text-matrix-darkgreen">Current Query:</div>
              <div className="text-sm text-matrix-green font-mono mt-1">{customPrompt}</div>
            </div>
          </div>
        </div>
      )}

      {/* Scan History */}
      <div className="terminal-window">
        <div className="terminal-header">
          <Terminal className="w-4 h-4 text-matrix-green" />
          <span className="ml-2">SCAN HISTORY</span>
        </div>
        <div className="terminal-content">
          <div className="space-y-4">
            {scanHistory.length === 0 ? (
              <div className="text-center py-8 text-matrix-darkgreen">
                No scans performed yet. Activate the agent to begin monitoring.
              </div>
            ) : (
              scanHistory.map((scan, index) => (
                <div 
                  key={scan.id} 
                  className={`border rounded p-4 ${
                    scan.anomalyDetected 
                      ? 'border-red-400/50 bg-red-400/5' 
                      : 'border-matrix-darkgreen bg-matrix-darkgreen/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStatusIcon(scan.anomalyDetected)}</span>
                      <div>
                        <div className={`font-semibold ${getStatusColor(scan.anomalyDetected)}`}>
                          {scan.anomalyDetected ? 'ANOMALY DETECTED' : 'NO ANOMALY DETECTED'}
                        </div>
                        <div className="text-xs text-matrix-darkgreen flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(scan.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-matrix-green">Confidence: {Math.round(scan.confidence * 100)}%</div>
                      <div className="text-xs text-matrix-darkgreen">Scan #{scanHistory.length - index}</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm text-matrix-darkgreen mb-1">Query:</div>
                    <div className="text-sm text-matrix-green font-mono bg-matrix-darkgray/20 p-2 rounded">
                      {scan.query}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm text-matrix-darkgreen mb-1">🤖 Response:</div>
                    <div className={`text-sm p-2 rounded font-mono ${
                      scan.anomalyDetected 
                        ? 'bg-red-400/10 text-red-200' 
                        : 'bg-matrix-darkgray/20 text-matrix-green'
                    }`}>
                      {scan.response}
                    </div>
                  </div>
                  
                  {scan.details && (
                    <div className="mt-3">
                      <div className="text-sm text-matrix-darkgreen mb-1 flex items-center gap-2">
                        <Target className="w-3 h-3" />
                        Detailed Analysis:
                      </div>
                      <div className="text-sm text-matrix-green bg-matrix-darkgray/30 p-3 rounded font-mono whitespace-pre-line">
                        {scan.details}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Agent Architecture */}
      <div className="terminal-window">
        <div className="terminal-header">
          <MessageSquare className="w-4 h-4 text-matrix-green" />
          <span className="ml-2">AGENT ARCHITECTURE</span>
        </div>
        <div className="terminal-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <Eye className="w-8 h-8 text-matrix-green mx-auto mb-2" />
              <div className="text-matrix-green font-semibold mb-2">OBSERVATION</div>
              <div className="text-sm text-matrix-darkgreen">
                Continuously monitors data streams and system state
              </div>
            </div>
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <Brain className="w-8 h-8 text-matrix-green mx-auto mb-2 animate-glow" />
              <div className="text-matrix-green font-semibold mb-2">REASONING</div>
              <div className="text-sm text-matrix-darkgreen">
                LLM-powered analysis via Volcano SDK branching logic
              </div>
            </div>
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <Target className="w-8 h-8 text-matrix-green mx-auto mb-2" />
              <div className="text-matrix-green font-semibold mb-2">ACTION</div>
              <div className="text-sm text-matrix-darkgreen">
                Adaptive response based on anomaly detection results
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentinelAgent;