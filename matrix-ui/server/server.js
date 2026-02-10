const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Simulated data storage
let systemStatus = {
  kafkaCluster: 'online',
  kegGateway: 'active',
  aiAgents: 'running'
};

let anomalies = [
  {
    id: 'anom_001',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    source: 'WORLD_NY_1999.subway_commuter_density',
    severity: 'high',
    description: 'Unusual spike in commuter density at Times Square station',
    aiAnalysis: 'Detected 340% increase in passenger density compared to normal rush hour patterns.',
    confidence: 0.92,
    resolved: false
  }
];

let sentinelScans = [];

// Real-time data generation
const generateRealtimeData = () => {
  return {
    timestamp: new Date().toISOString(),
    cabData: Math.floor(Math.random() * 50) + 20,
    evData: Math.floor(Math.random() * 80) + 10,
    subwayData: Math.floor(Math.random() * 200) + 50,
    anomalyRate: Math.random() * 5,
    systemLoad: Math.random() * 100
  };
};

// WebSocket connections for real-time updates
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  // Send initial data
  ws.send(JSON.stringify({ type: 'init', data: generateRealtimeData() }));
  
  // Send real-time updates every 2 seconds
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'update', 
        data: generateRealtimeData() 
      }));
    }
  }, 2000);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket connection closed');
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    system: systemStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    metrics: {
      eventsPerSec: Math.floor(Math.random() * 100) + 50,
      totalEvents: Math.floor(Math.random() * 10000) + 50000,
      activeConnections: Math.floor(Math.random() * 20) + 10,
      anomaliesDetected: anomalies.filter(a => !a.resolved).length
    }
  });
});

app.get('/api/topics', (req, res) => {
  res.json([
    {
      name: 'WORLD_NY_1999.yellow_cab_dispatch',
      cluster: 'Sim_1999_NY',
      eventsPerSec: Math.floor(Math.random() * 20) + 10,
      totalEvents: Math.floor(Math.random() * 5000) + 1000,
      schema: 'yellow_cab_dispatch.json',
      status: 'active'
    },
    {
      name: 'WORLD_LA_2024.ev_charging_logs',
      cluster: 'Sim_2024_LA',
      eventsPerSec: Math.floor(Math.random() * 15) + 5,
      totalEvents: Math.floor(Math.random() * 3000) + 500,
      schema: 'ev_charging_logs.json',
      status: 'active'
    },
    {
      name: 'anomaly_detection_pings',
      cluster: 'Machine_City_Core',
      eventsPerSec: Math.floor(Math.random() * 5) + 1,
      totalEvents: Math.floor(Math.random() * 500) + 100,
      schema: 'anomaly_detection.json',
      status: 'monitoring'
    }
  ]);
});

app.get('/api/clusters', (req, res) => {
  res.json([
    {
      id: 'ny_1999',
      name: 'Sim_1999_NY',
      displayName: 'New York 1999 Simulation',
      status: 'active',
      connections: Math.floor(Math.random() * 15) + 5,
      eventsPerSec: Math.floor(Math.random() * 50) + 20
    },
    {
      id: 'la_2024',
      name: 'Sim_2024_LA',
      displayName: 'Los Angeles 2024 Simulation',
      status: 'active',
      connections: Math.floor(Math.random() * 10) + 3,
      eventsPerSec: Math.floor(Math.random() * 30) + 10
    },
    {
      id: 'machine_city',
      name: 'Machine_City_Core',
      displayName: 'Machine City Core Processing',
      status: 'active',
      connections: Math.floor(Math.random() * 20) + 10,
      eventsPerSec: Math.floor(Math.random() * 100) + 50
    }
  ]);
});

app.get('/api/anomalies', (req, res) => {
  res.json(anomalies);
});

app.post('/api/anomalies/:id/resolve', (req, res) => {
  const { id } = req.params;
  const anomaly = anomalies.find(a => a.id === id);
  if (anomaly) {
    anomaly.resolved = true;
    res.json({ message: 'Anomaly resolved', anomaly });
  } else {
    res.status(404).json({ error: 'Anomaly not found' });
  }
});

app.get('/api/sentinel/scans', (req, res) => {
  res.json(sentinelScans);
});

app.post('/api/sentinel/scan', (req, res) => {
  const { prompt = 'Have you detected an anomaly? Reply YES or NO' } = req.body;
  
  // Simulate LLM processing time
  setTimeout(() => {
    const responses = [
      { response: 'No current anomaly detected.', hasAnomaly: false },
      { response: 'YES - Anomaly detected in system data.', hasAnomaly: true, details: 'Suspicious activity in data stream...' }
    ];
    
    const result = responses[Math.floor(Math.random() * responses.length)];
    
    const scan = {
      id: `scan_${Date.now()}`,
      timestamp: new Date().toISOString(),
      query: prompt,
      response: result.response,
      anomalyDetected: result.hasAnomaly,
      details: result.details,
      confidence: Math.random() * 0.3 + 0.7
    };
    
    sentinelScans.unshift(scan);
    if (sentinelScans.length > 10) sentinelScans.pop();
    
    // Broadcast to all WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'sentinel_scan', data: scan }));
      }
    });
    
    res.json(scan);
  }, Math.random() * 2000 + 1000); // 1-3 second delay
});

app.get('/api/data/realtime', (req, res) => {
  res.json(generateRealtimeData());
});

// Simulate new anomalies occasionally
setInterval(() => {
  if (Math.random() > 0.95) { // 5% chance every 10 seconds
    const newAnomaly = {
      id: `anom_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: ['WORLD_NY_1999.subway_commuter_density', 'WORLD_LA_2024.ev_charging_logs'][Math.floor(Math.random() * 2)],
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      description: 'Anomalous pattern detected in data stream',
      aiAnalysis: 'AI analysis indicates unusual behavior requiring investigation.',
      confidence: Math.random() * 0.4 + 0.6,
      resolved: false
    };
    
    anomalies.unshift(newAnomaly);
    if (anomalies.length > 10) anomalies.pop();
    
    // Broadcast to WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'new_anomaly', data: newAnomaly }));
      }
    });
  }
}, 10000);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🔴 Matrix UI Server running on port ${PORT}`);
  console.log(`   HTTP API: http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
});