import { Activity, Database, Eye, Network, Shield, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import AnomalyDetector from './components/AnomalyDetector';
import Dashboard from './components/Dashboard';
import DataStreams from './components/DataStreams';
import SentinelAgent from './components/SentinelAgent';
import VirtualClusters from './components/VirtualClusters';

type ViewType = 'dashboard' | 'streams' | 'anomaly' | 'sentinel' | 'clusters';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate connection status
    const timer = setTimeout(() => setIsConnected(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const navigation = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'streams', label: 'Data Streams', icon: Database },
    { id: 'anomaly', label: 'Anomaly Detector', icon: Shield },
    { id: 'sentinel', label: 'Sentinel Agent', icon: Eye },
    { id: 'clusters', label: 'Virtual Clusters', icon: Network },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'streams':
        return <DataStreams />;
      case 'anomaly':
        return <AnomalyDetector />;
      case 'sentinel':
        return <SentinelAgent />;
      case 'clusters':
        return <VirtualClusters />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green">
      {/* <MatrixBackground /> */}
      
      {/* Header */}
      <header className="relative z-10 border-b border-matrix-darkgreen bg-matrix-black/80 backdrop-blur">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-matrix-red animate-glow" />
              <div>
                <h1 className="text-2xl font-bold">🔴 KONG EVENT GATEWAY</h1>
                <p className="text-sm text-matrix-darkgreen">Matrix Control Interface</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`status-indicator ${isConnected ? 'status-active' : 'status-inactive'}`} />
                <span className="text-sm">
                  {isConnected ? 'CONNECTED' : 'CONNECTING...'}
                </span>
              </div>
              <div className="text-sm text-matrix-darkgreen">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-matrix-black/90 border-r border-matrix-darkgreen backdrop-blur flex-shrink-0">
          <div className="p-4 h-full overflow-y-auto">
            <div className="space-y-2">
              {navigation.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id as ViewType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all ${
                    currentView === id
                      ? 'bg-matrix-darkgreen text-matrix-black'
                      : 'hover:bg-matrix-darkgreen/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* System Status */}
            <div className="mt-8 p-4 border border-matrix-darkgreen rounded">
              <h3 className="font-semibold mb-3">SYSTEM STATUS</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Kafka Cluster</span>
                  <div className="flex items-center gap-1">
                    <div className="status-indicator status-active" />
                    <span>ONLINE</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>KEG Gateway</span>
                  <div className="flex items-center gap-1">
                    <div className="status-indicator status-active" />
                    <span>ACTIVE</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>AI Agents</span>
                  <div className="flex items-center gap-1">
                    <div className="status-indicator status-active" />
                    <span>RUNNING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-matrix-black">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;