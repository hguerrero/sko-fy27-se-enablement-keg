import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Brain, Play, Pause, Clock, Send } from 'lucide-react';

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
  const [isActive, setIsActive] = useState(false);
  const [scanInterval, setScanInterval] = useState(10);
  const [customPrompt, setCustomPrompt] = useState('Have you detected an anomaly? Reply YES or NO');
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sentinel/scans');
      if (response.ok) {
        const data = await response.json();
        setScanHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch scans:', err);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const performScan = useCallback(async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setCurrentScan('Sending request...');
    setError(null);

    try {
      setCurrentScan('Processing...');
      
      const response = await fetch('http://localhost:3001/api/sentinel/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt }),
      });

      if (!response.ok) {
        throw new Error('Scan request failed');
      }

      const result = await response.json();

      setScanHistory(prev => [result, ...prev.slice(0, 9)]);
      setCurrentScan('');
    } catch {
      setError('Failed to perform scan. Is the Sentinel Agent service running?');
      setCurrentScan('');
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, customPrompt]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      performScan();
    }, scanInterval * 1000);

    return () => clearInterval(interval);
  }, [isActive, scanInterval, performScan]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const activeAnomalies = scanHistory.filter(s => s.anomalyDetected).length;

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Eye className="w-10 h-10 text-matrix-red animate-glow" />
          <div>
            <h1 className="text-3xl font-bold text-matrix-green">SENTINEL AGENT</h1>
            <p className="text-matrix-darkgreen">LLM-powered threat detection</p>
          </div>
        </div>
      </div>

      <div className="terminal-window">
        <div className="terminal-header">
          <Brain className="w-4 h-4 text-matrix-green" />
          <span className="ml-2 font-semibold">CONTROL</span>
        </div>
        <div className="terminal-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`status-indicator ${isActive ? 'status-active' : 'status-inactive'}`} />
                <span className="text-matrix-green font-semibold">
                  {isActive ? 'AUTO-SCAN ACTIVE' : 'STANDBY'}
                </span>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 px-4 py-2 rounded border transition-all w-full ${
                  isActive 
                    ? 'border-matrix-red bg-matrix-red/20 text-matrix-red' 
                    : 'border-matrix-green bg-matrix-green/20 text-matrix-green'
                }`}
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isActive ? 'PAUSE' : 'AUTO-SCAN'}
              </button>
              <button
                onClick={performScan}
                disabled={isScanning}
                className="matrix-button flex items-center gap-2 w-full disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isScanning ? 'SCANNING...' : 'MANUAL SCAN'}
              </button>
            </div>

            <div className="space-y-4">
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
                  Query Prompt
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="matrix-input w-full h-20 resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border border-matrix-darkgreen rounded">
                  <div className="text-2xl font-bold text-matrix-green">{scanHistory.length}</div>
                  <div className="text-xs text-matrix-darkgreen">Total Scans</div>
                </div>
                <div className="text-center p-3 border border-matrix-darkgreen rounded">
                  <div className="text-2xl font-bold text-red-400">{activeAnomalies}</div>
                  <div className="text-xs text-matrix-darkgreen">Anomalies</div>
                </div>
              </div>
              <div className="text-sm text-matrix-darkgreen">
                Model: <span className="text-matrix-green font-mono">gpt-4o-mini</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isScanning && currentScan && (
        <div className="terminal-window">
          <div className="terminal-header">
            <Brain className="w-4 h-4 text-matrix-green animate-glow" />
            <span className="ml-2">SCANNING</span>
          </div>
          <div className="terminal-content">
            <div className="flex items-center gap-3">
              <div className="status-indicator status-active animate-pulse"></div>
              <span className="text-matrix-green">{currentScan}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="terminal-window">
          <div className="terminal-header">
            <span className="ml-2 text-red-400">ERROR</span>
          </div>
          <div className="terminal-content text-red-400">
            {error}
          </div>
        </div>
      )}

      <div className="terminal-window">
        <div className="terminal-header">
          <Clock className="w-4 h-4 text-matrix-green" />
          <span className="ml-2">SCAN HISTORY</span>
        </div>
        <div className="terminal-content">
          <div className="space-y-4">
            {scanHistory.length === 0 ? (
              <div className="text-center py-8 text-matrix-darkgreen">
                No scans yet. Click MANUAL SCAN or enable AUTO-SCAN.
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
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${scan.anomalyDetected ? 'text-red-400' : 'text-matrix-green'}`}>
                        {scan.anomalyDetected ? 'ANOMALY DETECTED' : 'CLEAR'}
                      </span>
                      <span className="text-xs text-matrix-darkgreen">
                        {formatTimestamp(scan.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-matrix-green">
                      {Math.round(scan.confidence * 100)}%
                    </div>
                  </div>
                  
                  <div className="text-sm text-matrix-green font-mono whitespace-pre-wrap">
                    {scan.response}
                  </div>
                  
                  {scan.details && (
                    <div className="mt-2 text-sm text-matrix-darkgreen">
                      {scan.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="terminal-window">
        <div className="terminal-header">
          <Brain className="w-4 h-4 text-matrix-green" />
          <span className="ml-2">AGENT ARCHITECTURE</span>
        </div>
        <div className="terminal-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <Eye className="w-6 h-6 text-matrix-green mx-auto mb-2" />
              <div className="text-matrix-green font-semibold mb-1">OBSERVE</div>
              <div className="text-xs text-matrix-darkgreen">
                Monitors data streams from Kafka
              </div>
            </div>
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <Brain className="w-6 h-6 text-matrix-green mx-auto mb-2 animate-glow" />
              <div className="text-matrix-green font-semibold mb-1">REASON</div>
              <div className="text-xs text-matrix-darkgreen">
                LLM analysis via Volcano SDK
              </div>
            </div>
            <div className="text-center p-4 border border-matrix-darkgreen rounded">
              <Send className="w-6 h-6 text-matrix-green mx-auto mb-2" />
              <div className="text-matrix-green font-semibold mb-1">ACT</div>
              <div className="text-xs text-matrix-darkgreen">
                RAG-enabled knowledge enrichment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentinelAgent;
