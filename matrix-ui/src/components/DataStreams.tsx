import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Play, Pause, Database, TrendingUp, MapPin, Zap } from 'lucide-react';

interface DataPoint {
  timestamp: string;
  value: number;
  category?: string;
}

const DataStreams: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [cabData, setCabData] = useState<DataPoint[]>([]);
  const [evData, setEvData] = useState<DataPoint[]>([]);
  const [subwayData, setSubwayData] = useState<DataPoint[]>([]);

  // Simulate real-time data
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      
      // NYC Cab data
      setCabData(prev => [
        ...prev.slice(-19), // Keep last 20 points
        {
          timestamp: now,
          value: Math.floor(Math.random() * 50) + 20,
          category: 'dispatched'
        }
      ]);

      // LA EV charging data
      setEvData(prev => [
        ...prev.slice(-19),
        {
          timestamp: now,
          value: Math.floor(Math.random() * 80) + 10,
          category: 'charging'
        }
      ]);

      // NYC Subway data
      setSubwayData(prev => [
        ...prev.slice(-19),
        {
          timestamp: now,
          value: Math.floor(Math.random() * 200) + 50,
          category: 'commuters'
        }
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const topics = [
    {
      name: 'WORLD_NY_1999.yellow_cab_dispatch',
      description: 'NYC taxi dispatch events',
      cluster: 'Sim_1999_NY',
      eventsPerSec: 15,
      totalEvents: 4521,
      schema: 'yellow_cab_dispatch.json',
      status: 'active'
    },
    {
      name: 'WORLD_LA_2024.ev_charging_logs',
      description: 'Electric vehicle charging session data',
      cluster: 'Sim_2024_LA',
      eventsPerSec: 8,
      totalEvents: 2847,
      schema: 'ev_charging_logs.json',
      status: 'active'
    },
    {
      name: 'WORLD_NY_1999.subway_commuter_density',
      description: 'Subway system passenger density metrics',
      cluster: 'Sim_1999_NY',
      eventsPerSec: 12,
      totalEvents: 6043,
      schema: 'machine_status.json',
      status: 'active'
    },
    {
      name: 'anomaly_detection_pings',
      description: 'AI anomaly detection output',
      cluster: 'Machine_City_Core',
      eventsPerSec: 2,
      totalEvents: 234,
      schema: 'anomaly_detection.json',
      status: 'monitoring'
    },
    {
      name: 'knowledge_ingestion',
      description: 'RAG vector store ingestion',
      cluster: 'Machine_City_Core',
      eventsPerSec: 1,
      totalEvents: 127,
      schema: 'knowledge_ingestion.json',
      status: 'buffering'
    }
  ];

  const sampleEvents = {
    cab: {
      cab_id: 'NYC-7824',
      zone: 'Manhattan-Midtown',
      status: 'dispatched',
      passengers: 2,
      fare_usd: 24.70,
      distance_miles: 3.2,
      timestamp: new Date().toISOString()
    },
    ev: {
      session_id: 'LA-1707584947-742',
      station: 'Venice-Beach-Supercharger',
      connector_type: 'Tesla-NACS',
      status: 'charging',
      vehicle_make: 'Tesla',
      kwh_delivered: 45.2,
      cost_usd: 12.45,
      battery_pct: 67,
      timestamp: new Date().toISOString()
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-matrix-green">DATA STREAMS</h1>
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className="flex items-center gap-2 matrix-button"
        >
          {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isStreaming ? 'PAUSE' : 'RESUME'}
        </button>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* NYC Cab Dispatches */}
        <div className="terminal-window">
          <div className="terminal-header">
            <MapPin className="w-4 h-4 text-matrix-green" />
            <span className="ml-2">NYC TAXI DISPATCH</span>
          </div>
          <div className="terminal-content">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cabData}>
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
                <Line type="monotone" dataKey="value" stroke="#00ff00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-sm text-matrix-darkgreen mt-2">
              Active Cabs: {cabData.length > 0 ? cabData[cabData.length - 1]?.value : 0}
            </div>
          </div>
        </div>

        {/* LA EV Charging */}
        <div className="terminal-window">
          <div className="terminal-header">
            <Zap className="w-4 h-4 text-matrix-green" />
            <span className="ml-2">LA EV CHARGING</span>
          </div>
          <div className="terminal-content">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={evData}>
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
                <Bar dataKey="value" fill="#00ff00" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-sm text-matrix-darkgreen mt-2">
              Charging Sessions: {evData.length > 0 ? evData[evData.length - 1]?.value : 0}
            </div>
          </div>
        </div>

        {/* NYC Subway Density */}
        <div className="terminal-window">
          <div className="terminal-header">
            <TrendingUp className="w-4 h-4 text-matrix-green" />
            <span className="ml-2">SUBWAY DENSITY</span>
          </div>
          <div className="terminal-content">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={subwayData}>
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
                <Line type="monotone" dataKey="value" stroke="#00ff00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-sm text-matrix-darkgreen mt-2">
              Commuter Density: {subwayData.length > 0 ? subwayData[subwayData.length - 1]?.value : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Topic Overview */}
      <div className="terminal-window">
        <div className="terminal-header">
          <Database className="w-4 h-4 text-matrix-green" />
          <span className="ml-2">KAFKA TOPICS</span>
        </div>
        <div className="terminal-content">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-matrix-darkgreen">
                  <th className="text-left py-2">Topic Name</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Cluster</th>
                  <th className="text-left py-2">Events/sec</th>
                  <th className="text-left py-2">Total Events</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic, index) => (
                  <tr key={index} className="border-b border-matrix-darkgreen/30">
                    <td className="py-3 text-matrix-green font-mono">{topic.name}</td>
                    <td className="py-3 text-matrix-darkgreen">{topic.description}</td>
                    <td className="py-3">{topic.cluster}</td>
                    <td className="py-3">{topic.eventsPerSec}</td>
                    <td className="py-3">{topic.totalEvents.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`status-indicator ${
                          topic.status === 'active' ? 'status-active' : 
                          topic.status === 'monitoring' ? 'status-indicator bg-yellow-500' :
                          'status-indicator bg-orange-500'
                        }`} />
                        <span className="text-xs uppercase">{topic.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sample Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="terminal-window">
          <div className="terminal-header">
            <span className="font-semibold">SAMPLE: NYC CAB EVENT</span>
          </div>
          <div className="terminal-content">
            <pre className="text-xs text-matrix-green whitespace-pre-wrap">
              {JSON.stringify(sampleEvents.cab, null, 2)}
            </pre>
          </div>
        </div>

        <div className="terminal-window">
          <div className="terminal-header">
            <span className="font-semibold">SAMPLE: LA EV EVENT</span>
          </div>
          <div className="terminal-content">
            <pre className="text-xs text-matrix-green whitespace-pre-wrap">
              {JSON.stringify(sampleEvents.ev, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataStreams;