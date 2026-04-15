import { Eye, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import SentinelAgent from './components/SentinelAgent';

type ViewType = 'dashboard' | 'sentinel';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/status');
        if (response.ok) {
          setIsConnected(true);
        }
      } catch {
        setIsConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { id: 'dashboard', label: 'Kafka Agents', icon: Zap },
    { id: 'sentinel', label: 'Sentinel Agent', icon: Eye },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'sentinel':
        return <SentinelAgent />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green">
      <header className="relative z-10 border-b border-matrix-darkgreen bg-matrix-black/80 backdrop-blur">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-matrix-red animate-glow" />
              <div>
                <h1 className="text-xl font-bold">KEG CONTROL</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`status-indicator ${isConnected ? 'status-active' : 'status-inactive'}`} />
                <span className="text-sm">
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        <nav className="w-56 bg-matrix-black/90 border-r border-matrix-darkgreen flex-shrink-0">
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
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto bg-matrix-black">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;