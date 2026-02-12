import { Activity, Database, Globe, Key, Network, Server, Settings, Shield, Users } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface VirtualCluster {
  id: string;
  name: string;
  displayName: string;
  ports: string;
  authentication: string;
  prefix: string;
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
  theme: string;
  topics: string[];
  connections: number;
  eventsPerSec: number;
  acl: {
    enabled: boolean;
    policies: string[];
  };
}

const VirtualClusters: React.FC = () => {
  const [clusters, setClusters] = useState<VirtualCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Fetch cluster data from API
  const fetchClusters = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clusters');
      if (response.ok) {
        const apiClusters = await response.json();
        
        // Static configuration to merge with API data
        const staticConfig = {
          'ny_1999': {
            ports: '19192-19290',
            authentication: 'anonymous',
            prefix: 'WORLD_NY_1999',
            description: 'Matrix simulation layer representing New York City in 1999',
            theme: '🏙️ Urban Matrix',
            topics: [
              'WORLD_NY_1999.yellow_cab_dispatch',
              'WORLD_NY_1999.subway_commuter_density',
              'WORLD_NY_1999.stock_exchange_ticker',
              'WORLD_NY_1999.system_machine_status',
              'WORLD_NY_1999.weather_pattern_emulation'
            ],
            acl: {
              enabled: false,
              policies: ['anonymous_access']
            }
          },
          'la_2024': {
            ports: '19292-19390',
            authentication: 'SASL/PLAIN',
            prefix: 'WORLD_LA_2024',
            description: 'Matrix simulation layer representing Los Angeles in 2024',
            theme: '🌴 Future Matrix',
            topics: [
              'WORLD_LA_2024.ev_charging_logs',
              'WORLD_LA_2024.daily_commute_stats',
              'WORLD_LA_2024.social_media_sentiment',
              'WORLD_LA_2024.system_machine_status',
              'WORLD_LA_2024.weather_pattern_emulation'
            ],
            acl: {
              enabled: true,
              policies: ['redpill_rebels_access', 'authenticated_users']
            }
          },
          'machine_core': {
            ports: '19092-19190',
            authentication: 'anonymous (passthru)',
            prefix: '',
            description: 'Core machine intelligence processing hub',
            theme: '🤖 Machine Intelligence',
            topics: [
              'anomaly_detection_pings',
              'knowledge_ingestion',
              'bio_electric_yield',
              'biomass_efficiency_logs',
              'system_update_protocol',
              'tactical_strike_command'
            ],
            acl: {
              enabled: true,
              policies: ['machine_core_access', 'agent_smith_override', 'architect_level_clearance']
            }
          }
        };

        // Merge API data with static configuration
        const mergedClusters = apiClusters.map((apiCluster: any) => ({
          ...apiCluster,
          ...staticConfig[apiCluster.id as keyof typeof staticConfig]
        }));

        setClusters(mergedClusters);
        if (mergedClusters.length > 0) {
          setSelectedCluster(mergedClusters[0].id);
        }
      } else {
        console.error('Failed to fetch clusters');
        // Fallback to static data
        setFallbackClusters();
      }
    } catch (error) {
      console.error('Error fetching clusters:', error);
      // Fallback to static data
      setFallbackClusters();
    } finally {
      setLoading(false);
    }
  }, []);

  // Fallback static clusters
  const setFallbackClusters = () => {
    const virtualClusters: VirtualCluster[] = [
      {
        id: 'ny_1999',
        name: 'Sim_1999_NY',
        displayName: 'New York 1999 Simulation',
        ports: '19192-19290',
        authentication: 'anonymous',
        prefix: 'WORLD_NY_1999',
        status: 'active',
        description: 'Matrix simulation layer representing New York City in 1999',
        theme: '🏙️ Urban Matrix',
        topics: [
          'WORLD_NY_1999.yellow_cab_dispatch',
          'WORLD_NY_1999.subway_commuter_density',
          'WORLD_NY_1999.stock_exchange_ticker',
          'WORLD_NY_1999.system_machine_status',
          'WORLD_NY_1999.weather_pattern_emulation'
        ],
        connections: 12,
        eventsPerSec: 47,
        acl: {
          enabled: false,
          policies: ['anonymous_access']
        }
      },
      {
        id: 'la_2024',
        name: 'Sim_2024_LA',
        displayName: 'Los Angeles 2024 Simulation',
        ports: '19292-19390',
        authentication: 'SASL/PLAIN',
        prefix: 'WORLD_LA_2024',
        status: 'active',
        description: 'Matrix simulation layer representing Los Angeles in 2024',
        theme: '🌴 Future Matrix',
        topics: [
          'WORLD_LA_2024.ev_charging_logs',
          'WORLD_LA_2024.daily_commute_stats',
          'WORLD_LA_2024.social_media_sentiment',
          'WORLD_LA_2024.system_machine_status',
          'WORLD_LA_2024.weather_pattern_emulation'
        ],
        connections: 8,
        eventsPerSec: 23,
        acl: {
          enabled: true,
          policies: ['redpill_rebels_access', 'authenticated_users']
        }
      },
      {
        id: 'machine_core',
        name: 'Machine_City_Core',
        displayName: 'Machine City Core Processing',
        ports: '19092-19190',
        authentication: 'anonymous (passthru)',
        prefix: '',
        status: 'active',
        description: 'Core machine intelligence processing hub',
        theme: '🤖 Machine Intelligence',
        topics: [
          'anomaly_detection_pings',
          'knowledge_ingestion',
          'bio_electric_yield',
          'biomass_efficiency_logs',
          'system_update_protocol',
          'tactical_strike_command'
        ],
        connections: 15,
        eventsPerSec: 89,
        acl: {
          enabled: true,
          policies: ['machine_core_access', 'agent_smith_override', 'architect_level_clearance']
        }
      }
    ];

    setClusters(virtualClusters);
    setSelectedCluster(virtualClusters[0].id);
  };

  // Fetch topics for a specific cluster
  const fetchClusterTopics = useCallback(async (clusterId: string) => {
    if (!clusterId) return;
    
    try {
      setTopicsLoading(true);
      const response = await fetch(`http://localhost:3001/api/clusters/${clusterId}/topics`);
      if (response.ok) {
        const topics = await response.json();

        // Update the cluster with live topic data
        setClusters(prev => prev.map(cluster => {
          if (cluster.id === clusterId) {
            return {
              ...cluster,
              topics: topics.map((topic: any) => topic.name)
            };
          }
          return cluster;
        }));
      } else {
        console.error('Failed to fetch topics for cluster:', clusterId);
      }
    } catch (error) {
      console.error('Error fetching cluster topics:', error);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClusters();

    // Real-time updates for connections and events per second
    const interval = setInterval(() => {
      setClusters(prev => prev.map(cluster => ({
        ...cluster,
        connections: Math.max(0, cluster.connections + Math.floor(Math.random() * 3) - 1),
        eventsPerSec: Math.max(0, cluster.eventsPerSec + Math.floor(Math.random() * 10) - 5)
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchClusters]);

  useEffect(()=> {
if (selectedCluster) {
      fetchClusterTopics(selectedCluster);
    }
  }, [selectedCluster, fetchClusterTopics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-matrix-green';
      case 'inactive': return 'text-gray-500';
      case 'maintenance': return 'text-yellow-400';
      default: return 'text-matrix-green';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'maintenance': return 'status-indicator bg-yellow-400';
      default: return 'status-active';
    }
  };

  const selectedClusterData = clusters.find(c => c.id === selectedCluster);

  return (
    <div className="p-6 pb-16 space-y-6 min-h-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Network className="w-12 h-12 text-matrix-green animate-glow" />
          <div>
            <h1 className="text-4xl font-bold text-matrix-green">VIRTUAL CLUSTERS</h1>
            <p className="text-matrix-darkgreen text-lg">Multi-tenant Kafka governance & isolation</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-matrix-green border-t-transparent"></div>
            <span className="text-matrix-green text-lg">Loading cluster information...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Cluster Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {clusters.map((cluster, index) => (
          <div 
            key={cluster.id} 
            className={`terminal-window cursor-pointer transition-all ${
              selectedCluster === cluster.id ? 'ring-2 ring-matrix-green' : ''
            }`}
            onClick={() => setSelectedCluster(cluster.id)}
          >
            <div className="terminal-header">
              <div className={`status-indicator ${getStatusIndicator(cluster.status)}`}></div>
              <span className="ml-2 font-semibold">{cluster.name}</span>
            </div>
            <div className="terminal-content">
              <div className="space-y-3">
                <div>
                  <div className="text-lg font-semibold text-matrix-green">{cluster.displayName}</div>
                  <div className="text-sm text-matrix-darkgreen">{cluster.theme}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-matrix-darkgreen">Ports:</div>
                    <div className="text-matrix-green font-mono">{cluster.ports}</div>
                  </div>
                  <div>
                    <div className="text-matrix-darkgreen">Auth:</div>
                    <div className="text-matrix-green text-xs">{cluster.authentication}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-matrix-darkgreen">Connections:</div>
                    <div className="text-matrix-green">{cluster.connections}</div>
                  </div>
                  <div>
                    <div className="text-matrix-darkgreen">Events/sec:</div>
                    <div className="text-matrix-green">{cluster.eventsPerSec}</div>
                  </div>
                </div>
                
                <div className={`text-sm font-semibold uppercase ${getStatusColor(cluster.status)}`}>
                  {cluster.status}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed View */}
      {selectedClusterData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cluster Details */}
          <div className="terminal-window">
            <div className="terminal-header">
              <Server className="w-4 h-4 text-matrix-green" />
              <span className="ml-2">CLUSTER DETAILS - {selectedClusterData.name}</span>
            </div>
            <div className="terminal-content space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-matrix-green mb-2">Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">Display Name:</span>
                    <span className="text-matrix-green">{selectedClusterData.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">Port Range:</span>
                    <span className="text-matrix-green font-mono">{selectedClusterData.ports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">Authentication:</span>
                    <span className="text-matrix-green">{selectedClusterData.authentication}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">Topic Prefix:</span>
                    <span className="text-matrix-green font-mono">{selectedClusterData.prefix || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-darkgreen">Status:</span>
                    <div className="flex items-center gap-2">
                      <div className={`status-indicator ${getStatusIndicator(selectedClusterData.status)}`}></div>
                      <span className={`uppercase ${getStatusColor(selectedClusterData.status)}`}>
                        {selectedClusterData.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-matrix-green mb-2">Description</h3>
                <p className="text-sm text-matrix-darkgreen">{selectedClusterData.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-matrix-green mb-2">Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border border-matrix-darkgreen rounded">
                    <div className="text-2xl font-bold text-matrix-green">{selectedClusterData.connections}</div>
                    <div className="text-xs text-matrix-darkgreen">Active Connections</div>
                  </div>
                  <div className="text-center p-3 border border-matrix-darkgreen rounded">
                    <div className="text-2xl font-bold text-matrix-green">{selectedClusterData.eventsPerSec}</div>
                    <div className="text-xs text-matrix-darkgreen">Events/sec</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACL & Security */}
          <div className="terminal-window">
            <div className="terminal-header">
              <Shield className="w-4 h-4 text-matrix-green" />
              <span className="ml-2">ACCESS CONTROL</span>
            </div>
            <div className="terminal-content space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-matrix-green mb-2">ACL Configuration</h3>
                <div className="flex items-center justify-between p-3 border border-matrix-darkgreen rounded">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-matrix-green" />
                    <span>ACL Enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`status-indicator ${selectedClusterData.acl.enabled ? 'status-active' : 'status-inactive'}`}></div>
                    <span className={selectedClusterData.acl.enabled ? 'text-matrix-green' : 'text-gray-500'}>
                      {selectedClusterData.acl.enabled ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-matrix-green mb-2">Security Policies</h3>
                <div className="space-y-2">
                  {selectedClusterData.acl.policies.map((policy, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-matrix-darkgray/20 rounded">
                      <Users className="w-4 h-4 text-matrix-green" />
                      <span className="text-sm font-mono text-matrix-green">{policy}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-matrix-green mb-2">Security Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-matrix-green" />
                    <span>Schema Registry Integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-matrix-green" />
                    <span>Topic Namespace Isolation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-matrix-green" />
                    <span>Multi-tenant Data Governance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-matrix-green" />
                    <span>Real-time Monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topics Overview */}
      {selectedClusterData && (
        <div className="terminal-window">
          <div className="terminal-header">
            <Database className="w-4 h-4 text-matrix-green" />
            <span className="ml-2">DATA STREAMS - {selectedClusterData.name}</span>
            {topicsLoading && (
              <div className="ml-auto">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-matrix-green border-t-transparent"></div>
              </div>
            )}
          </div>
          <div className="terminal-content">
            {topicsLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-matrix-green">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-matrix-green border-t-transparent"></div>
                  <span>Loading topics...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedClusterData.topics.map((topic, index) => (
                  <div key={index} className="border border-matrix-darkgreen rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-matrix-green truncate" title={topic}>{topic}</div>
                      <div className="status-indicator status-active"></div>
                    </div>
                    <div className="text-xs text-matrix-darkgreen">
                      Active | Schema Validated | Monitored
                    </div>
                  </div>
                ))}
                {selectedClusterData.topics.length === 0 && !topicsLoading && (
                  <div className="col-span-full text-center py-8 text-matrix-darkgreen">
                    No topics found for this cluster
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cluster Architecture */}
      <div className="terminal-window">
        <div className="terminal-header">
          <Settings className="w-4 h-4 text-matrix-green" />
          <span className="ml-2">KEG ARCHITECTURE</span>
        </div>
        <div className="terminal-content">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-matrix-green mb-2">Kong Event Gateway Multi-Tenant Architecture</h3>
            <p className="text-matrix-darkgreen">Virtual clusters provide secure, isolated access to the same Kafka infrastructure</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 border border-matrix-darkgreen rounded">
              <Network className="w-8 h-8 text-matrix-green mx-auto mb-2" />
              <div className="text-sm font-semibold text-matrix-green">Virtual Clusters</div>
              <div className="text-xs text-matrix-darkgreen">Isolated tenant environments</div>
            </div>
            
            <div className="p-4 border border-matrix-darkgreen rounded">
              <Shield className="w-8 h-8 text-matrix-green mx-auto mb-2" />
              <div className="text-sm font-semibold text-matrix-green">ACL Policies</div>
              <div className="text-xs text-matrix-darkgreen">Fine-grained access control</div>
            </div>
            
            <div className="p-4 border border-matrix-darkgreen rounded">
              <Globe className="w-8 h-8 text-matrix-green mx-auto mb-2" />
              <div className="text-sm font-semibold text-matrix-green">Topic Namespaces</div>
              <div className="text-xs text-matrix-darkgreen">Automatic prefix management</div>
            </div>
            
            <div className="p-4 border border-matrix-darkgreen rounded">
              <Server className="w-8 h-8 text-matrix-green mx-auto mb-2" />
              <div className="text-sm font-semibold text-matrix-green">Shared Infrastructure</div>
              <div className="text-xs text-matrix-darkgreen">3-node Kafka cluster</div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default VirtualClusters;