import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Database, Play, Pause, Shield, Zap, Server, Send, X, Brain, Activity, FileText, ChevronRight } from 'lucide-react';

interface Cluster {
  id: string;
  name: string;
  displayName: string;
  status: string;
  connections: number;
  eventsPerSec: number;
}

interface Topic {
  name: string;
  cluster: string;
  clusterId: string;
  eventsPerSec: number;
  totalEvents: number;
  status: string;
  description: string;
}

interface StreamEvent {
  id: string;
  topic: string;
  timestamp: string;
  partition: number;
  offset: number;
  key: string | null;
  value: any;
}

interface ProcessingEvent {
  id: string;
  step: 'received' | 'analyzing' | 'analyzed' | 'enriched';
  topic: string;
  partition?: number;
  offset?: string;
  timestamp: string;
  status: string;
  rawEvent?: string;
  isAnomaly?: boolean;
  severity?: string;
}

interface ActivePipeline {
  id: string;
  received: boolean;
  analyzing: boolean;
  analyzed: boolean;
  enriched: boolean;
  isAnomaly?: boolean;
  severity?: string;
  rawEvent?: string;
  topic: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [dataGenStatus, setDataGenStatus] = useState<'stopped' | 'running' | 'starting' | 'stopping' | 'error'>('stopped');
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [, setProcessingHistory] = useState<ProcessingEvent[]>([]);
  const [activePipelines, setActivePipelines] = useState<Map<string, ActivePipeline>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  
  const [streamingTopic, setStreamingTopic] = useState<Topic | null>(null);
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const [showProducer, setShowProducer] = useState(false);
  const [producerTopic, setProducerTopic] = useState<Topic | null>(null);
  const [customPayload, setCustomPayload] = useState('');
  const [isProducing, setIsProducing] = useState(false);
  const [produceStatus, setProduceStatus] = useState<string>('');

  // WebSocket for real-time processing events
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//localhost:3001`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'processing_event') {
          const procEvent = message.data as ProcessingEvent;
          
          // Update active pipelines
          setActivePipelines(prev => {
            const updated = new Map(prev);
            const pipeline = updated.get(procEvent.id) || {
              id: procEvent.id,
              received: false,
              analyzing: false,
              analyzed: false,
              enriched: false,
              topic: procEvent.topic,
              timestamp: procEvent.timestamp
            };

            switch (procEvent.step) {
              case 'received':
                pipeline.received = true;
                pipeline.timestamp = procEvent.timestamp;
                pipeline.rawEvent = procEvent.rawEvent;
                break;
              case 'analyzing':
                pipeline.analyzing = true;
                pipeline.timestamp = procEvent.timestamp;
                break;
              case 'analyzed':
                pipeline.analyzed = true;
                pipeline.isAnomaly = procEvent.isAnomaly;
                pipeline.severity = procEvent.severity;
                pipeline.timestamp = procEvent.timestamp;
                break;
              case 'enriched':
                pipeline.enriched = true;
                pipeline.timestamp = procEvent.timestamp;
                break;
            }

            updated.set(procEvent.id, pipeline);
            return updated;
          });

          // Add to history
          setProcessingHistory(prev => [procEvent, ...prev.slice(0, 49)]);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    // Fetch initial processing events
    fetch('http://localhost:3001/api/processing-events')
      .then(res => res.json())
      .then(data => setProcessingHistory(data))
      .catch(console.error);

    return () => {
      ws.close();
    };
  }, []);

  // Clean up completed pipelines after a delay
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePipelines(prev => {
        const updated = new Map(prev);
        const now = Date.now();
        updated.forEach((pipeline, id) => {
          if (pipeline.enriched && now - new Date(pipeline.timestamp).getTime() > 5000) {
            updated.delete(id);
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getDefaultPayload = () => {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      source: "AGENT_JONES",
      anomaly_type: "PHYSICS_VIOLATION",
      coordinates: "40.7128° N, 74.0060° W",
      target_alias: "MORPHEUS"
    }, null, 2);
  };

  const openProducer = (topic: Topic) => {
    setProducerTopic(topic);
    setCustomPayload(getDefaultPayload());
    setProduceStatus('');
    setShowProducer(true);
  };

  const sendEvent = async () => {
    if (!producerTopic) return;
    
    setIsProducing(true);
    setProduceStatus('Sending...');
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/clusters/${producerTopic.clusterId}/topics/${producerTopic.name}/produce`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: customPayload
        }
      );
      
      if (response.ok) {
        setProduceStatus('Event sent successfully');
        setTimeout(() => setShowProducer(false), 1500);
      } else {
        const error = await response.text();
        setProduceStatus(`Error: ${error}`);
      }
    } catch (err) {
      setProduceStatus('Failed to send event');
    } finally {
      setIsProducing(false);
    }
  };

  const fetchClusters = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clusters');
      if (response.ok) {
        const data = await response.json();
        setClusters(data);
        if (data.length > 0 && !selectedCluster) {
          setSelectedCluster(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch clusters:', error);
    }
  }, [selectedCluster]);

  const fetchTopics = useCallback(async (clusterId: string) => {
    if (!clusterId) return;
    setTopicsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/clusters/${clusterId}/topics`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  const fetchDataGenStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/data-generator/status');
      if (response.ok) {
        const data = await response.json();
        setDataGenStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch data generator status:', error);
    }
  }, []);

  const fetchAnomalies = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/anomalies');
      if (response.ok) {
        const data = await response.json();
        setLastEvent(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchClusters();
      await fetchDataGenStatus();
      await fetchAnomalies();
      setLoading(false);
    };
    init();

    const interval = setInterval(() => {
      fetchDataGenStatus();
      fetchAnomalies();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchClusters, fetchDataGenStatus, fetchAnomalies]);

  useEffect(() => {
    if (selectedCluster) {
      fetchTopics(selectedCluster);
    }
  }, [selectedCluster, fetchTopics]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startDataGen = async () => {
    try {
      setDataGenStatus('starting');
      await fetch('http://localhost:3001/api/data-generator/start', { method: 'POST' });
    } catch (error) {
      console.error('Failed to start data generator:', error);
      setDataGenStatus('error');
    }
  };

  const stopDataGen = async () => {
    try {
      setDataGenStatus('stopping');
      await fetch('http://localhost:3001/api/data-generator/stop', { method: 'POST' });
    } catch (error) {
      console.error('Failed to stop data generator:', error);
      setDataGenStatus('error');
    }
  };

  const startStreaming = (topic: Topic) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setStreamingTopic(topic);
    setStreamEvents([]);

    const url = `http://localhost:3001/api/clusters/${topic.clusterId}/topics/${topic.name}/events/stream`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`Connected to ${topic.name}`);
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'event') {
          setStreamEvents(prev => [message.data, ...prev.slice(0, 49)]);
        }
      } catch (e) {
        console.error('Failed to parse event:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      stopStreaming();
    };
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStreamingTopic(null);
    setStreamEvents([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-matrix-green';
      case 'starting': case 'stopping': return 'text-yellow-400';
      case 'stopped': return 'text-gray-500';
      case 'error': return 'text-red-400';
      default: return 'text-gray-500';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'running': return 'status-active';
      case 'starting': case 'stopping': return 'status-indicator bg-yellow-400 animate-pulse';
      case 'stopped': return 'status-inactive';
      case 'error': return 'status-error';
      default: return 'status-inactive';
    }
  };

  const renderEventData = (topicName: string, value: any) => {
    if (topicName.includes('yellow_cab_dispatch')) {
      return (
        <div className="flex flex-wrap gap-4 text-xs">
          <span><span className="text-matrix-darkgreen">ID:</span> <span className="text-matrix-green font-mono">{value.cab_id}</span></span>
          <span><span className="text-matrix-darkgreen">Zone:</span> <span className="text-matrix-green">{value.zone}</span></span>
          <span><span className="text-matrix-darkgreen">Status:</span> <span className={`font-mono ${
            value.status === 'completed' ? 'text-matrix-green' :
            value.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'
          }`}>{value.status}</span></span>
          <span><span className="text-matrix-darkgreen">Passengers:</span> <span className="text-matrix-green">{value.passengers}</span></span>
          <span><span className="text-matrix-darkgreen">Fare:</span> <span className="text-matrix-green">${value.fare_usd}</span></span>
          <span><span className="text-matrix-darkgreen">Distance:</span> <span className="text-matrix-green">{value.distance_miles} mi</span></span>
        </div>
      );
    }
    
    if (topicName.includes('ev_charging_logs')) {
      return (
        <div className="flex flex-wrap gap-4 text-xs">
          <span><span className="text-matrix-darkgreen">Vehicle:</span> <span className="text-matrix-green">{value.vehicle_make}</span></span>
          <span><span className="text-matrix-darkgreen">Station:</span> <span className="text-matrix-green truncate max-w-[150px]" title={value.station}>{value.station}</span></span>
          <span><span className="text-matrix-darkgreen">Status:</span> <span className={`font-mono ${
            value.status === 'completed' ? 'text-matrix-green' :
            value.status === 'error' ? 'text-red-400' : 'text-yellow-400'
          }`}>{value.status}</span></span>
          <span><span className="text-matrix-darkgreen">Energy:</span> <span className="text-matrix-green">{value.kwh_delivered} kWh</span></span>
          <span><span className="text-matrix-darkgreen">Cost:</span> <span className="text-matrix-green">${value.cost_usd}</span></span>
          <span><span className="text-matrix-darkgreen">Battery:</span> <span className="text-matrix-green">{value.battery_pct}%</span></span>
          <span><span className="text-matrix-darkgreen">Connector:</span> <span className="text-matrix-green">{value.connector_type}</span></span>
        </div>
      );
    }
    
    return null;
  };

  const totalEventsPerSec = topics.reduce((sum, t) => sum + t.eventsPerSec, 0);

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-matrix-green animate-glow">KAFKA AGENTS</h1>
        <p className="text-matrix-darkgreen">Event-driven AI processing pipeline</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-matrix-green border-t-transparent"></div>
            <span className="text-matrix-green">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="terminal-window">
              <div className="terminal-content text-center">
                <div className="text-3xl font-bold text-matrix-green">{totalEventsPerSec}</div>
                <div className="text-sm text-matrix-darkgreen">Events/sec</div>
              </div>
            </div>
            <div className="terminal-window">
              <div className="terminal-content text-center">
                <div className="text-3xl font-bold text-matrix-green">{topics.length}</div>
                <div className="text-sm text-matrix-darkgreen">Active Topics</div>
              </div>
            </div>
            <div className="terminal-window">
              <div className="terminal-content text-center">
                <div className="text-3xl font-bold text-red-400">{lastEvent ? 1 : 0}</div>
                <div className="text-sm text-matrix-darkgreen">Anomalies</div>
              </div>
            </div>
          </div>

          <div className="terminal-window">
            <div className="terminal-header">
              <div className={`status-indicator ${getStatusIndicator(dataGenStatus)}`}></div>
              <span className="ml-2 font-semibold">DATA GENERATOR</span>
              <div className="ml-auto flex items-center gap-3">
                <span className={`text-sm uppercase ${getStatusColor(dataGenStatus)}`}>{dataGenStatus}</span>
                {dataGenStatus === 'stopped' || dataGenStatus === 'error' ? (
                  <button onClick={startDataGen} className="matrix-button text-xs flex items-center gap-1">
                    <Play className="w-3 h-3" /> START
                  </button>
                ) : (
                  <button onClick={stopDataGen} className="matrix-button text-xs flex items-center gap-1">
                    <Pause className="w-3 h-3" /> STOP
                  </button>
                )}
              </div>
            </div>
            <div className="terminal-content">
              <p className="text-sm text-matrix-darkgreen">
                {dataGenStatus === 'running' 
                  ? 'Producing events to Kafka topics...' 
                  : dataGenStatus === 'stopped'
                    ? 'Start the generator to produce events to Kafka.'
                    : 'Processing...'}
              </p>
            </div>
          </div>

          <div className="terminal-window">
            <div className="terminal-header">
              <Server className="w-4 h-4 text-matrix-green" />
              <span className="ml-2 font-semibold">VIRTUAL CLUSTERS</span>
            </div>
            <div className="terminal-content">
              <div className="flex flex-wrap gap-2 mb-6">
                {clusters.map(cluster => (
                  <button
                    key={cluster.id}
                    onClick={() => setSelectedCluster(cluster.id)}
                    className={`flex items-center gap-3 px-4 py-3 border rounded transition-all ${
                      selectedCluster === cluster.id
                        ? 'border-matrix-green bg-matrix-green/20 text-matrix-green'
                        : 'border-matrix-darkgreen/50 hover:border-matrix-darkgreen text-matrix-darkgreen hover:text-matrix-green'
                    }`}
                  >
                    <div className={`status-indicator ${getStatusIndicator(cluster.status)}`}></div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{cluster.displayName}</div>
                      <div className="text-xs opacity-70">{cluster.eventsPerSec} events/s</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">TOPICS</span>
                  {topicsLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border border-matrix-green border-t-transparent"></div>
                  )}
                </div>
                {dataGenStatus === 'running' && (
                  <span className="text-xs text-matrix-green bg-matrix-green/20 px-2 py-1 rounded">
                    LIVE DATA
                  </span>
                )}
              </div>
              {topicsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-matrix-green border-t-transparent mx-auto"></div>
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-8 text-matrix-darkgreen border border-matrix-darkgreen/30 rounded">
                  No topics available. Start the data generator.
                </div>
              ) : (
                <div className="space-y-2">
                  {topics.map((topic, index) => (
                    <div key={index} className="space-y-2">
                      <div 
                        className={`flex items-center justify-between p-3 border rounded transition-all ${
                          streamingTopic?.name === topic.name 
                            ? 'border-matrix-green bg-matrix-green/10' 
                            : 'border-matrix-darkgreen/50 hover:border-matrix-darkgreen'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-mono text-matrix-green">{topic.name}</div>
                          <div className="text-xs text-matrix-darkgreen">{topic.description}</div>
                        </div>
                        <div className="text-right ml-4 flex items-center gap-2">
                          <div>
                            <div className="text-sm text-matrix-green">{topic.eventsPerSec}/s</div>
                            <div className="text-xs text-matrix-darkgreen">{topic.cluster}</div>
                          </div>
                          <button 
                            onClick={() => openProducer(topic)}
                            className="matrix-button text-xs border-matrix-yellow text-matrix-yellow hover:bg-matrix-yellow/20"
                            title="Produce custom event"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                          {streamingTopic?.name === topic.name ? (
                            <button 
                              onClick={stopStreaming}
                              className="matrix-button text-xs text-red-400 border-red-400 hover:bg-red-400/20 flex items-center gap-1"
                            >
                              <div className="status-indicator status-active animate-pulse"></div>
                              STOP
                            </button>
                          ) : (
                            <button 
                              onClick={() => startStreaming(topic)}
                              className="matrix-button text-xs"
                            >
                              STREAM
                            </button>
                          )}
                        </div>
                      </div>

                      {streamingTopic?.name === topic.name && (
                        <div className="border border-matrix-darkgreen/30 rounded bg-matrix-black/50 ml-4">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-matrix-darkgreen/30 text-xs">
                            <div className="flex items-center gap-3">
                              <Zap className="w-3 h-3 text-matrix-green animate-pulse" />
                              <span className="text-matrix-green">{streamEvents.length} events</span>
                              <span className="text-matrix-darkgreen">Partition: {streamEvents[0]?.partition ?? '-'} | Offset: {streamEvents[0]?.offset ?? '-'}</span>
                            </div>
                            <span className="text-matrix-darkgreen">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {streamEvents.length === 0 ? (
                              <div className="px-3 py-4 text-center text-matrix-darkgreen text-xs">
                                Waiting for events...
                              </div>
                            ) : (
                              <div className="divide-y divide-matrix-darkgreen/20">
                                {streamEvents.slice(0, 10).map((event, idx) => (
                                  <div key={event.id} className="px-3 py-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="text-matrix-darkgreen">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                      </span>
                                      <span className="text-matrix-green/50">
                                        #{streamEvents.length - idx}
                                      </span>
                                    </div>
                                    <div className="mb-1">
                                      {renderEventData(topic.name, event.value)}
                                    </div>
                                    <details className="mt-1">
                                      <summary className="text-[10px] text-matrix-darkgreen/60 cursor-pointer hover:text-matrix-green">
                                        Raw JSON
                                      </summary>
                                      <pre className="mt-1 text-[10px] text-matrix-green/50 overflow-x-auto whitespace-pre-wrap bg-matrix-black/50 p-1 rounded">
                                        {JSON.stringify(event.value, null, 2)}
                                      </pre>
                                    </details>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="terminal-window">
            <div className="terminal-header">
              <Brain className="w-4 h-4 text-matrix-green" />
              <span className="ml-2 font-semibold">ANOMALY DETECTOR AGENT</span>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-matrix-darkgreen">
                  {activePipelines.size > 0 ? `${activePipelines.size} active` : 'idle'}
                </span>
                <div className={`status-indicator ${dataGenStatus === 'running' ? 'status-active' : 'status-inactive'}`}></div>
              </div>
            </div>
            <div className="terminal-content">
              {activePipelines.size === 0 ? (
                <div className="text-center py-8 text-matrix-darkgreen">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Start the data generator to see event processing</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from(activePipelines.values()).reverse().slice(0, 5).map((pipeline) => (
                    <div 
                      key={pipeline.id} 
                      className={`border rounded p-3 ${
                        pipeline.isAnomaly 
                          ? 'border-red-400/50 bg-red-400/5' 
                          : 'border-matrix-darkgreen bg-matrix-darkgreen/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-matrix-darkgreen font-mono">
                            {pipeline.topic.split('.').pop()}
                          </span>
                          <span className="text-xs text-matrix-darkgreen">
                            {new Date(pipeline.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {pipeline.isAnomaly !== undefined && (
                          <span className={`text-xs uppercase font-bold ${
                            pipeline.isAnomaly 
                              ? 'text-red-400' 
                              : 'text-matrix-green'
                          }`}>
                            {pipeline.isAnomaly ? `ANOMALY ${pipeline.severity?.toUpperCase()}` : 'NORMAL'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                          pipeline.received ? 'bg-matrix-green/20 text-matrix-green' : 'bg-matrix-darkgreen/20 text-matrix-darkgreen'
                        }`}>
                          <Database className="w-3 h-3" />
                          RECEIVED
                        </div>
                        <ChevronRight className="w-3 h-3 text-matrix-darkgreen" />
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                          pipeline.analyzing ? 'bg-matrix-yellow/20 text-matrix-yellow animate-pulse' : 
                          pipeline.analyzed ? 'bg-matrix-green/20 text-matrix-green' :
                          'bg-matrix-darkgreen/20 text-matrix-darkgreen'
                        }`}>
                          <Brain className="w-3 h-3" />
                          ANALYZING
                        </div>
                        <ChevronRight className="w-3 h-3 text-matrix-darkgreen" />
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                          pipeline.analyzed ? 'bg-matrix-green/20 text-matrix-green' :
                          'bg-matrix-darkgreen/20 text-matrix-darkgreen'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {pipeline.isAnomaly ? 'TRIGGER' : 'LOG'}
                        </div>
                        <ChevronRight className="w-3 h-3 text-matrix-darkgreen" />
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                          pipeline.enriched ? 'bg-matrix-green/20 text-matrix-green' :
                          'bg-matrix-darkgreen/20 text-matrix-darkgreen'
                        }`}>
                          <FileText className="w-3 h-3" />
                          ENRICHED
                        </div>
                      </div>

                      {pipeline.rawEvent && (
                        <details className="mt-2">
                          <summary className="text-[10px] text-matrix-darkgreen/60 cursor-pointer hover:text-matrix-green">
                            Raw Event
                          </summary>
                          <pre className="mt-1 text-[10px] text-matrix-green/50 overflow-x-auto whitespace-pre-wrap bg-matrix-black/50 p-1 rounded max-h-24">
                            {pipeline.rawEvent}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {lastEvent && (
            <div className="terminal-window">
              <div className="terminal-header">
                <Shield className="w-4 h-4 text-red-400" />
                <span className="ml-2 font-semibold text-red-400">LATEST ANOMALY</span>
              </div>
              <div className="terminal-content">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">Source:</span>
                    <span className="text-matrix-green font-mono text-sm">{lastEvent.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">Severity:</span>
                    <span className={`uppercase ${
                      lastEvent.severity === 'high' ? 'text-red-400' : 
                      lastEvent.severity === 'medium' ? 'text-yellow-400' : 'text-matrix-green'
                    }`}>{lastEvent.severity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">Confidence:</span>
                    <span className="text-matrix-green">{Math.round(lastEvent.confidence * 100)}%</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-matrix-darkgreen text-xs mb-1">Description:</div>
                    <div className="text-sm text-matrix-green">{lastEvent.description}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showProducer && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="terminal-window w-full max-w-2xl mx-4">
                <div className="terminal-header">
                  <Send className="w-4 h-4 text-matrix-yellow" />
                  <span className="ml-2 font-semibold text-matrix-yellow">PRODUCE EVENT</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-matrix-darkgreen font-mono">{producerTopic?.name}</span>
                    <button 
                      onClick={() => setShowProducer(false)}
                      className="text-matrix-darkgreen hover:text-matrix-green"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="terminal-content space-y-4">
                  <div>
                    <label className="block text-sm text-matrix-darkgreen mb-2">
                      Custom JSON Payload
                    </label>
                    <textarea
                      value={customPayload}
                      onChange={(e) => setCustomPayload(e.target.value)}
                      className="matrix-input w-full h-64 font-mono text-xs resize-none"
                      spellCheck={false}
                    />
                  </div>
                  
                  {produceStatus && (
                    <div className={`text-sm ${produceStatus.includes('Error') || produceStatus.includes('Failed') ? 'text-red-400' : 'text-matrix-green'}`}>
                      {produceStatus}
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowProducer(false)}
                      className="matrix-button text-xs"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={sendEvent}
                      disabled={isProducing || !customPayload.trim()}
                      className="matrix-button text-xs bg-matrix-green/20 border-matrix-green text-matrix-green hover:bg-matrix-green hover:text-matrix-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-3 h-3" />
                      {isProducing ? 'SENDING...' : 'PRODUCE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
