import { ChevronDown, ChevronRight, Database, Eye, MapPin, Pause, Play, TrendingUp, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DataPoint {
  timestamp: string;
  value: number;
  category?: string;
}

interface RawEvent {
  id: string;
  topic: string;
  timestamp: string;
  partition: number;
  offset: number;
  key: string;
  value: any;
}

const DataStreams: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [cabData, setCabData] = useState<DataPoint[]>([]);
  const [evData, setEvData] = useState<DataPoint[]>([]);
  const [subwayData, setSubwayData] = useState<DataPoint[]>([]);
  const [dataGeneratorStatus, setDataGeneratorStatus] = useState<'stopped' | 'starting' | 'running' | 'stopping' | 'error'>('stopped');
  const [dataGeneratorLogs, setDataGeneratorLogs] = useState<string[]>([]);
  
  // Event monitoring state
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  
  // Topics state
  const [topics, setTopics] = useState<any[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

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

  // Check data generator status on component mount
  useEffect(() => {
    checkDataGeneratorStatus();
    fetchTopics();
  }, []);

  // Fetch topics from API
  const fetchTopics = async () => {
    try {
      setTopicsLoading(true);
      const response = await fetch('http://localhost:3001/api/topics');
      if (response.ok) {
        const topicsData = await response.json();
        setTopics(topicsData);
      } else {
        console.error('Failed to fetch topics');
        // Fallback to mock data
        setTopics(getMockTopics());
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      // Fallback to mock data
      setTopics(getMockTopics());
    } finally {
      setTopicsLoading(false);
    }
  };

  const getMockTopics = () => [
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
      name: 'anomaly_detection_pings',
      description: 'AI anomaly detection output',
      cluster: 'Machine_City_Core',
      eventsPerSec: 2,
      totalEvents: 234,
      schema: 'anomaly_detection.json',
      status: 'monitoring'
    }
  ];

  const checkDataGeneratorStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/data-generator/status');
      const data = await response.json();
      setDataGeneratorStatus(data.status);
    } catch (error) {
      console.error('Failed to check data generator status:', error);
    }
  };

  const startDataGenerator = async () => {
    try {
      setDataGeneratorStatus('starting');
      const response = await fetch('http://localhost:3001/api/data-generator/start', {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setDataGeneratorStatus(data.status);
        setDataGeneratorLogs(prev => [...prev, `Started: ${data.message}`]);
      } else {
        setDataGeneratorStatus('error');
        setDataGeneratorLogs(prev => [...prev, `Error: ${data.error}`]);
      }
    } catch (error) {
      setDataGeneratorStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDataGeneratorLogs(prev => [...prev, `Error: ${errorMessage}`]);
      console.error('Failed to start data generator:', error);
    }
  };

  const stopDataGenerator = async () => {
    try {
      setDataGeneratorStatus('stopping');
      const response = await fetch('http://localhost:3001/api/data-generator/stop', {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setDataGeneratorStatus('stopped');
        setDataGeneratorLogs(prev => [...prev, `Stopped: ${data.message}`]);
      } else {
        setDataGeneratorStatus('error');
        setDataGeneratorLogs(prev => [...prev, `Error: ${data.error}`]);
      }
    } catch (error) {
      setDataGeneratorStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDataGeneratorLogs(prev => [...prev, `Error: ${errorMessage}`]);
      console.error('Failed to stop data generator:', error);
    }
  };

  const getGeneratorStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-matrix-green';
      case 'starting': case 'stopping': return 'text-yellow-400';
      case 'stopped': return 'text-gray-500';
      case 'error': return 'text-red-400';
      default: return 'text-matrix-green';
    }
  };

  const getGeneratorStatusIndicator = (status: string) => {
    switch (status) {
      case 'running': return 'status-active';
      case 'starting': case 'stopping': return 'status-indicator bg-yellow-400 animate-pulse';
      case 'stopped': return 'status-inactive';
      case 'error': return 'status-error';
      default: return 'status-inactive';
    }
  };

  // Generate mock events for different topics
  const generateMockEvent = (topic: string): RawEvent => {
    const baseEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic,
      timestamp: new Date().toISOString(),
      partition: Math.floor(Math.random() * 3),
      offset: Math.floor(Math.random() * 10000) + 1000,
      key: `key_${Math.floor(Math.random() * 1000)}`,
    };

    switch (topic) {
      case 'WORLD_NY_1999.yellow_cab_dispatch':
        return {
          ...baseEvent,
          value: {
            cab_id: `NYC-${Math.floor(1000 + Math.random() * 9000)}`,
            zone: ["Manhattan-Midtown", "Manhattan-Downtown", "Manhattan-Uptown", "Brooklyn-Heights", "Queens-Astoria"][Math.floor(Math.random() * 5)],
            status: ["dispatched", "en_route", "arrived", "completed", "cancelled"][Math.floor(Math.random() * 5)],
            passengers: Math.floor(1 + Math.random() * 4),
            fare_usd: parseFloat((5 + Math.random() * 45).toFixed(2)),
            distance_miles: parseFloat((0.5 + Math.random() * 15).toFixed(1)),
            timestamp: new Date().toISOString(),
          }
        };
      
      case 'WORLD_LA_2024.ev_charging_logs':
        return {
          ...baseEvent,
          value: {
            session_id: `LA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            station: ["Venice-Beach-Supercharger", "Santa-Monica-Pier", "Hollywood-Blvd", "Downtown-LA-Hub"][Math.floor(Math.random() * 4)],
            connector_type: ["CCS", "CHAdeMO", "Tesla-NACS", "J1772"][Math.floor(Math.random() * 4)],
            status: ["charging", "completed", "waiting", "error", "disconnected"][Math.floor(Math.random() * 5)],
            vehicle_make: ["Tesla", "Rivian", "Lucid", "BMW", "Ford", "Hyundai"][Math.floor(Math.random() * 6)],
            kwh_delivered: parseFloat((Math.random() * 80).toFixed(2)),
            cost_usd: parseFloat((2 + Math.random() * 25).toFixed(2)),
            battery_pct: Math.floor(10 + Math.random() * 90),
            timestamp: new Date().toISOString(),
          }
        };
      
      case 'WORLD_NY_1999.subway_commuter_density':
        return {
          ...baseEvent,
          value: {
            station: ["Times Square", "Grand Central", "Union Square", "Herald Square", "Wall Street"][Math.floor(Math.random() * 5)],
            line: ["4-5-6", "N-Q-R-W", "L", "A-C-E", "1-2-3"][Math.floor(Math.random() * 5)],
            density_pct: Math.floor(Math.random() * 100),
            passenger_count: Math.floor(Math.random() * 500) + 50,
            direction: ["uptown", "downtown"][Math.floor(Math.random() * 2)],
            rush_hour: new Date().getHours() >= 7 && new Date().getHours() <= 9,
            timestamp: new Date().toISOString(),
          }
        };
      
      case 'anomaly_detection_pings':
        return {
          ...baseEvent,
          value: {
            source_topic: "WORLD_NY_1999.subway_commuter_density",
            anomaly_type: ["density_spike", "unusual_pattern", "system_delay"][Math.floor(Math.random() * 3)],
            confidence: parseFloat((Math.random() * 0.4 + 0.6).toFixed(3)),
            severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
            detected_at: new Date().toISOString(),
            raw_value: Math.floor(Math.random() * 500) + 100,
          }
        };
      
      default:
        return {
          ...baseEvent,
          value: { message: "Sample event data", timestamp: new Date().toISOString() }
        };
    }
  };

  // Start/stop event monitoring
  const startEventMonitoring = (topic: string) => {
    setSelectedTopic(topic);
    setIsMonitoring(true);
    setRawEvents([]);
  };

  const stopEventMonitoring = () => {
    setIsMonitoring(false);
    setSelectedTopic('');
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Event monitoring effect using SSE
  useEffect(() => {
    if (!isMonitoring || !selectedTopic) return;

    // Determine cluster ID based on topic name
    let clusterId = "machine_core"; // default
    
    const eventSource = new EventSource(`http://localhost:3001/api/clusters/${clusterId}/topics/${selectedTopic}/events/stream`);
    
    eventSource.onopen = () => {
      console.log(`SSE connection opened for topic ${selectedTopic}`);
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'connected') {
          console.log(`Connected to SSE stream for topic ${selectedTopic}`);
        } else if (message.type === 'event') {
          // Add the new event to the list
          setRawEvents(prev => [
            message.data,
            ...prev.slice(0, 49) // Keep last 50 events
          ]);
        } else if (message.type === 'error') {
          console.error('SSE Error:', message.message);
          // Fallback to mock event on error
          const mockEvent = generateMockEvent(selectedTopic);
          setRawEvents(prev => [
            mockEvent,
            ...prev.slice(0, 49)
          ]);
        }
      } catch (parseError) {
        console.error('Error parsing SSE message:', parseError);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Generate mock event on connection error
      const mockEvent = generateMockEvent(selectedTopic);
      setRawEvents(prev => [
        mockEvent,
        ...prev.slice(0, 49)
      ]);
    };

    return () => {
      console.log(`Closing SSE connection for topic ${selectedTopic}`);
      eventSource.close();
    };
  }, [isMonitoring, selectedTopic]);

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
    <div className="p-6 pb-16 space-y-6 min-h-full">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-matrix-green">DATA STREAMS</h1>
        <div className="flex items-center gap-4">
          {/* Data Generator Controls */}
          <div className="flex items-center gap-3 px-4 py-2 border border-matrix-darkgreen rounded">
            <div className="flex items-center gap-2">
              <div className={`status-indicator ${getGeneratorStatusIndicator(dataGeneratorStatus)}`}></div>
              <span className={`text-sm font-semibold uppercase ${getGeneratorStatusColor(dataGeneratorStatus)}`}>
                Data Generator: {dataGeneratorStatus}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={startDataGenerator}
                disabled={dataGeneratorStatus === 'running' || dataGeneratorStatus === 'starting'}
                className="matrix-button text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                START
              </button>
              <button
                onClick={stopDataGenerator}
                disabled={dataGeneratorStatus === 'stopped' || dataGeneratorStatus === 'stopping'}
                className="matrix-button text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                STOP
              </button>
            </div>
          </div>

          {/* Stream Controls */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className="flex items-center gap-2 matrix-button"
          >
            {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isStreaming ? 'PAUSE UI' : 'RESUME UI'}
          </button>
        </div>
      </div>

      {/* Data Generator Status */}
      {(dataGeneratorStatus !== 'stopped' || dataGeneratorLogs.length > 0) && (
        <div className="terminal-window">
          <div className="terminal-header">
            <div className={`status-indicator ${getGeneratorStatusIndicator(dataGeneratorStatus)}`}></div>
            <span className="ml-2 font-semibold">DATA GENERATOR STATUS</span>
          </div>
          <div className="terminal-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-matrix-green mb-2">Current Status</h3>
                <div className={`text-lg font-semibold uppercase ${getGeneratorStatusColor(dataGeneratorStatus)}`}>
                  {dataGeneratorStatus}
                </div>
                <div className="text-sm text-matrix-darkgreen mt-1">
                  {dataGeneratorStatus === 'running' && 'Generating events to Kafka topics'}
                  {dataGeneratorStatus === 'starting' && 'Initializing data generation process...'}
                  {dataGeneratorStatus === 'stopping' && 'Shutting down gracefully...'}
                  {dataGeneratorStatus === 'stopped' && 'No data generation active'}
                  {dataGeneratorStatus === 'error' && 'Process encountered an error'}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-matrix-green mb-2">Configuration</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">NY Broker:</span>
                    <span className="font-mono">localhost:19192</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">LA Broker:</span>
                    <span className="font-mono">localhost:19292</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">Interval:</span>
                    <span className="font-mono">3000ms</span>
                  </div>
                </div>
              </div>
            </div>
            
            {dataGeneratorLogs.length > 0 && (
              <div>
                <h3 className="font-semibold text-matrix-green mb-2">Recent Activity</h3>
                <div className="bg-matrix-darkgray/20 rounded p-3 max-h-32 overflow-y-auto">
                  {dataGeneratorLogs.slice(-10).map((log, index) => (
                    <div key={index} className="text-sm text-matrix-green font-mono">
                      [{new Date().toLocaleTimeString()}] {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
          {dataGeneratorStatus === 'running' && (
            <span className="ml-auto text-xs text-matrix-green bg-matrix-green/20 px-2 py-1 rounded">
              LIVE DATA
            </span>
          )}
          {dataGeneratorStatus === 'stopped' && (
            <span className="ml-auto text-xs text-matrix-darkgreen bg-matrix-darkgray/20 px-2 py-1 rounded">
              SIMULATED DATA
            </span>
          )}
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
                  <th className="text-left py-2">Actions</th>
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
                    <td className="py-3">
                      <button
                        onClick={() => startEventMonitoring(topic.name)}
                        className="matrix-button text-xs flex items-center gap-1"
                        disabled={isMonitoring && selectedTopic !== topic.name}
                      >
                        <Eye className="w-3 h-3" />
                        MONITOR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Real-time Event Monitor */}
      {isMonitoring && selectedTopic && (
        <div className="terminal-window">
          <div className="terminal-header">
            <Eye className="w-4 h-4 text-matrix-green" />
            <span className="ml-2 font-semibold">LIVE EVENT MONITOR - {selectedTopic}</span>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-matrix-green">
                {rawEvents.length} events captured
              </span>
              <button
                onClick={stopEventMonitoring}
                className="matrix-button text-xs"
              >
                STOP MONITORING
              </button>
            </div>
          </div>
          <div className="terminal-content">
            <div className="mb-4 p-3 bg-matrix-darkgray/20 rounded">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-matrix-green font-semibold">Event Stream</h3>
                <div className="flex items-center gap-2">
                  <div className="status-indicator status-active animate-pulse"></div>
                  <span className="text-xs text-matrix-green">LIVE</span>
                </div>
              </div>
              <div className="text-sm text-matrix-darkgreen">
                Monitoring real-time events from topic: <span className="font-mono text-matrix-green">{selectedTopic}</span>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rawEvents.length === 0 ? (
                <div className="text-center py-8 text-matrix-darkgreen">
                  <div className="status-indicator status-active animate-pulse mx-auto mb-2"></div>
                  Waiting for events...
                </div>
              ) : (
                rawEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className="border border-matrix-darkgreen rounded p-3 bg-matrix-darkgray/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleEventExpansion(event.id)}
                          className="text-matrix-green hover:text-matrix-darkgreen transition-colors"
                        >
                          {expandedEvents.has(event.id) ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                        </button>
                        <div className="text-sm">
                          <span className="text-matrix-green font-semibold">Event #{rawEvents.length - index}</span>
                          <span className="text-matrix-darkgreen ml-2">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-matrix-darkgreen">
                        <span>Partition: {event.partition}</span>
                        <span>Offset: {event.offset}</span>
                        <span>Key: {event.key}</span>
                      </div>
                    </div>
                    
                    {expandedEvents.has(event.id) && (
                      <div className="ml-7 mt-3">
                        <div className="text-sm text-matrix-darkgreen mb-2">Event Payload:</div>
                        <pre className="text-xs text-matrix-green bg-matrix-black/50 p-3 rounded overflow-x-auto border border-matrix-darkgreen">
{JSON.stringify(event.value, null, 2)}
                        </pre>
                        
                        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-matrix-darkgreen">Topic:</div>
                            <div className="text-matrix-green font-mono">{event.topic}</div>
                          </div>
                          <div>
                            <div className="text-matrix-darkgreen">Timestamp:</div>
                            <div className="text-matrix-green font-mono">{event.timestamp}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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