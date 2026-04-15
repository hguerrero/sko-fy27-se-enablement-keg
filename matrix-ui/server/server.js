const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const { spawn } = require("child_process");
const path = require("path");
const { Kafka, logLevel } = require("kafkajs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Kafka connections for different virtual clusters
const kafkaConnections = {
  ny_1999: new Kafka({
    clientId: "matrix-ui-ny",
    brokers: [process.env.NY_BROKER || "localhost:19192"],
    logLevel: logLevel.ERROR,
  }),
  la_2024: new Kafka({
    clientId: "matrix-ui-la",
    brokers: [process.env.LA_BROKER || "localhost:19292"],
    logLevel: logLevel.ERROR,
  }),
  machine_core: new Kafka({
    clientId: "matrix-ui-core",
    brokers: [process.env.MACHINE_BROKER || "localhost:19092"],
    logLevel: logLevel.ERROR,
  }),
};

// Data generator process management
let dataGeneratorProcess = null;
let dataGeneratorStatus = "stopped";

// Simulated data storage
let systemStatus = {
  kafkaCluster: "online",
  kegGateway: "active",
  aiAgents: "running",
};

let anomalies = [
  {
    id: "anom_001",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    source: "WORLD_NY_1999.subway_commuter_density",
    severity: "high",
    description: "Unusual spike in commuter density at Times Square station",
    aiAnalysis:
      "Detected 340% increase in passenger density compared to normal rush hour patterns.",
    confidence: 0.92,
    resolved: false,
  },
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
    systemLoad: Math.random() * 100,
  };
};

// WebSocket connections for real-time updates
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  // Send initial data
  ws.send(JSON.stringify({ type: "init", data: generateRealtimeData() }));

  // Send real-time updates every 2 seconds
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "update",
          data: generateRealtimeData(),
        }),
      );
    }
  }, 2000);

  ws.on("close", () => {
    clearInterval(interval);
    console.log("WebSocket connection closed");
  });
});

// Fetch real events from Kafka topics
async function fetchKafkaEvents(clusterId, topicName, limit = 10) {
  const kafka = kafkaConnections[clusterId];
  if (!kafka) {
    throw new Error(`Invalid cluster ID: ${clusterId}`);
  }

  const consumer = kafka.consumer({
    groupId: `matrix-ui-events-${clusterId}-${Date.now()}`, // Unique group ID to avoid conflicts
  });

  const events = [];

  try {
    console.log(`Connecting to cluster ${clusterId} for topic ${topicName}`);
    await consumer.connect();
    console.log(`Connected! Subscribing to topic ${topicName}`);
    await consumer.subscribe({ topic: topicName, fromBeginning: false });
    console.log(`Subscribed! Starting consumer for ${topicName}`);

    // Create a promise that resolves when we have enough messages or timeout
    const messagePromise = new Promise((resolve) => {
      let messageCount = 0;
      let timeoutHandle;
      let consumerStarted = false;

      const stopConsumer = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        consumer.stop().then(() => resolve());
      };

      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          // Start timeout only after first message is received or 2 seconds after consumer starts
          if (!consumerStarted) {
            consumerStarted = true;
            console.log(`Consumer started receiving messages for ${topicName}`);
            // Set timeout after consumer actually starts receiving messages
            timeoutHandle = setTimeout(() => {
              console.log(`Timeout reached for topic ${topicName}, collected ${events.length} events`);
              consumer.stop().then(() => resolve());
            }, 8000); // 8 second timeout after first message
          }

          try {
            const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
            console.log(`- ${prefix} ${message.key}#${message.value}`);
            
            const event = {
              id: `kafka_${topic}_${partition}_${message.offset}`,
              topic: topic,
              timestamp: message.timestamp
                ? new Date(parseInt(message.timestamp)).toISOString()
                : new Date().toISOString(),
              partition: partition,
              offset: parseInt(message.offset),
              key: message.key ? message.key.toString() : null,
              value: message.value ? JSON.parse(message.value.toString()) : null,
              source: "kafka",
            };

            events.push(event);
            messageCount++;

            // Stop consuming once we have enough messages
            if (messageCount >= limit) {
              console.log(`Collected ${messageCount} events for topic ${topicName}`);
              stopConsumer();
            }
          } catch (parseError) {
            // If JSON parsing fails, treat as plain text
            console.error(`JSON parse error for message in ${topicName}:`, parseError);
            const event = {
              id: `kafka_${topic}_${partition}_${message.offset}`,
              topic: topic,
              timestamp: message.timestamp
                ? new Date(parseInt(message.timestamp)).toISOString()
                : new Date().toISOString(),
              partition: partition,
              offset: parseInt(message.offset),
              key: message.key ? message.key.toString() : null,
              value: { raw: message.value ? message.value.toString() : null },
              source: "kafka",
            };

            events.push(event);
            messageCount++;

            if (messageCount >= limit) {
              console.log(`Collected ${messageCount} events for topic ${topicName}`);
              stopConsumer();
            }
          }
        },
      });

      // Fallback timeout if no messages are received at all within 10 seconds
      const fallbackTimeout = setTimeout(() => {
        console.log(`No messages received within 10 seconds for topic ${topicName}`);
        consumer.stop().then(() => resolve());
      }, 10000);

      // Clear the fallback timeout if the main timeout is set
      const originalSetTimeout = timeoutHandle;
      if (timeoutHandle) {
        clearTimeout(fallbackTimeout);
      }
    });

    // Wait for messages to be collected or timeout
    await messagePromise;

    // Log results
    if (events.length === 0) {
      console.log(`No messages found in topic ${topicName} on cluster ${clusterId}`);
    } else {
      console.log(`Successfully collected ${events.length} events from topic ${topicName}`);
    }

  } catch (error) {
    console.error(`Error fetching events from ${topicName}:`, error);
  } finally {
    await consumer.disconnect();
    console.log(`Disconnected from cluster ${clusterId} for topic ${topicName}`);
  }

  // Sort events by timestamp/offset and return most recent
  return events
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}

// API Routes
app.get("/api/status", (req, res) => {
  res.json({
    system: systemStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    metrics: {
      eventsPerSec: Math.floor(Math.random() * 100) + 50,
      totalEvents: Math.floor(Math.random() * 10000) + 50000,
      activeConnections: Math.floor(Math.random() * 20) + 10,
      anomaliesDetected: anomalies.filter((a) => !a.resolved).length,
    },
  });
});

// API Routes
app.get("/api/status", (req, res) => {
  res.json({
    system: systemStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    metrics: {
      eventsPerSec: Math.floor(Math.random() * 100) + 50,
      totalEvents: Math.floor(Math.random() * 10000) + 50000,
      activeConnections: Math.floor(Math.random() * 20) + 10,
      anomaliesDetected: anomalies.filter((a) => !a.resolved).length,
    },
  });
});

// Fetch topics from Kafka clusters
async function fetchKafkaTopics() {
  // Default to machine_core for backward compatibility
  return await fetchKafkaTopicsForCluster("machine_core");
}

// Fetch topics from a specific Kafka cluster
async function fetchKafkaTopicsForCluster(clusterId) {
  const allTopics = [];

  try {
    const kafka = kafkaConnections[clusterId];
    if (!kafka) {
      throw new Error(`Invalid cluster ID: ${clusterId}`);
    }

    const admin = kafka.admin();
    await admin.connect();

    const topicMetadata = await admin.fetchTopicMetadata();

    // Get cluster display name
    const clusterName = getClusterDisplayName(clusterId);

    topicMetadata.topics.forEach((topic) => {
      //   console.log(topic)

      // filter __consumer_offsets
      if (topic.name.startsWith("__")) {
        return;
      }

      const description = getTopicDescription(topic.name);
      const schema = getTopicSchema(topic.name);

      console.log(topic.name);

      allTopics.push({
        name: topic.name,
        cluster: clusterName,
        clusterId: clusterId,
        eventsPerSec:
          Math.floor(Math.random() * 20) +
          (dataGeneratorStatus === "running" ? 5 : 1),
        totalEvents: Math.floor(Math.random() * 5000) + 1000,
        schema: schema,
        status: "active",
        description: description,
        partitions: topic.partitions?.length || 1,
      });
    });

    await admin.disconnect();
  } catch (error) {
    console.warn(`Failed to fetch topics from ${clusterId}:`, error.message);

    // Fallback to mock data for this cluster if connection fails
    const mockTopics = getMockTopicsForCluster(clusterId);
    allTopics.push(...mockTopics);
  }

  // Sort topics by name
  allTopics.sort((a, b) => a.name.localeCompare(b.name));

  return allTopics;
}

// Helper function to get cluster display name
function getClusterDisplayName(clusterId) {
  const clusterNames = {
    ny_1999: "Sim_1999_NY",
    la_2024: "Sim_2024_LA",
    machine_core: "Machine_City_Core",
  };
  return clusterNames[clusterId] || "Unknown_Cluster";
}

function getTopicDescription(topicName) {
  if (topicName.includes("yellow_cab_dispatch"))
    return "NYC taxi dispatch events";
  if (topicName.includes("ev_charging_logs"))
    return "Electric vehicle charging session data";
  if (topicName.includes("subway_commuter_density"))
    return "Subway system passenger density metrics";
  if (topicName.includes("anomaly_detection_pings"))
    return "AI anomaly detection output";
  if (topicName.includes("knowledge_ingestion"))
    return "RAG vector store ingestion";
  if (topicName.includes("stock_exchange_ticker"))
    return "NYSE stock ticker data";
  if (topicName.includes("social_media_sentiment"))
    return "Social media sentiment analysis";
  if (topicName.includes("weather_pattern_emulation"))
    return "Weather simulation data";
  if (topicName.includes("system_machine_status"))
    return "System status monitoring";
  if (topicName.includes("daily_commute_stats"))
    return "Daily commute statistics";
  if (topicName.includes("bio_electric_yield"))
    return "Bioelectric energy extraction metrics";
  if (topicName.includes("biomass_efficiency_logs"))
    return "Biomass processing efficiency data";
  if (topicName.includes("tactical_strike_command"))
    return "Machine tactical operations";
  return "Event stream data";
}

function getTopicSchema(topicName) {
  if (topicName.includes("yellow_cab_dispatch"))
    return "yellow_cab_dispatch.json";
  if (topicName.includes("ev_charging_logs")) return "ev_charging_logs.json";
  if (
    topicName.includes("subway_commuter_density") ||
    topicName.includes("system_machine_status")
  )
    return "machine_status.json";
  return "generic_event.json";
}

function getMockTopicsForCluster(clusterId) {
  const clusterName =
    clusterId === "ny_1999"
      ? "Sim_1999_NY"
      : clusterId === "la_2024"
        ? "Sim_2024_LA"
        : "Machine_City_Core";

  const mockTopics = {
    ny_1999: [
      {
        name: "WORLD_NY_1999.yellow_cab_dispatch",
        description: "NYC taxi dispatch events",
        schema: "yellow_cab_dispatch.json",
      },
      {
        name: "WORLD_NY_1999.subway_commuter_density",
        description: "Subway system passenger density metrics",
        schema: "machine_status.json",
      },
    ],
    la_2024: [
      {
        name: "WORLD_LA_2024.ev_charging_logs",
        description: "Electric vehicle charging session data",
        schema: "ev_charging_logs.json",
      },
    ],
    machine_core: [
      {
        name: "anomaly_detection_pings",
        description: "AI anomaly detection output",
        schema: "anomaly_detection.json",
      },
      {
        name: "knowledge_ingestion",
        description: "RAG vector store ingestion",
        schema: "knowledge_ingestion.json",
      },
    ],
  };

  return (mockTopics[clusterId] || []).map((topic) => ({
    ...topic,
    cluster: clusterName,
    clusterId: clusterId,
    eventsPerSec: Math.floor(Math.random() * 20) + 1,
    totalEvents: Math.floor(Math.random() * 5000) + 1000,
    status: "active",
    partitions: 1,
  }));
}

app.get("/api/topics", async (req, res) => {
  try {
    const topics = await fetchKafkaTopics();
    res.json(topics);
  } catch (error) {
    console.error("Failed to fetch topics:", error);
    res.status(500).json({ error: "Failed to fetch topic information" });
  }
});

// Get topics for a specific cluster
app.get("/api/clusters/:clusterId/topics", async (req, res) => {
  try {
    const { clusterId } = req.params;

    // Validate cluster ID
    const validClusterIds = ["ny_1999", "la_2024", "machine_core"];
    if (!validClusterIds.includes(clusterId)) {
      return res.status(400).json({
        error: "Invalid cluster ID",
        validIds: validClusterIds,
      });
    }

    const topics = await fetchKafkaTopicsForCluster(clusterId);
    res.json(topics);
  } catch (error) {
    console.error(
      `Failed to fetch topics for cluster ${req.params.clusterId}:`,
      error,
    );
    res.status(500).json({ error: "Failed to fetch topic information" });
  }
});

app.get("/api/clusters", (req, res) => {
  res.json([
    {
      id: "ny_1999",
      name: "Sim_1999_NY",
      displayName: "New York 1999 Simulation",
      status: "active",
      connections: Math.floor(Math.random() * 15) + 5,
      eventsPerSec: Math.floor(Math.random() * 50) + 20,
    },
    {
      id: "la_2024",
      name: "Sim_2024_LA",
      displayName: "Los Angeles 2024 Simulation",
      status: "active",
      connections: Math.floor(Math.random() * 10) + 3,
      eventsPerSec: Math.floor(Math.random() * 30) + 10,
    },
    {
      id: "machine_core",
      name: "Machine_City_Core",
      displayName: "Machine City Core Processing",
      status: "active",
      connections: Math.floor(Math.random() * 20) + 10,
      eventsPerSec: Math.floor(Math.random() * 100) + 50,
    },
  ]);
});

app.get("/api/anomalies", (req, res) => {
  res.json(anomalies);
});

app.post("/api/anomalies/:id/resolve", (req, res) => {
  const { id } = req.params;
  const anomaly = anomalies.find((a) => a.id === id);
  if (anomaly) {
    anomaly.resolved = true;
    res.json({ message: "Anomaly resolved", anomaly });
  } else {
    res.status(404).json({ error: "Anomaly not found" });
  }
});

app.get("/api/sentinel/scans", (req, res) => {
  res.json(sentinelScans);
});

app.post("/api/sentinel/scan", (req, res) => {
  const { prompt = "Have you detected an anomaly? Reply YES or NO" } = req.body;

  // Simulate LLM processing time
  setTimeout(
    () => {
      const responses = [
        { response: "No current anomaly detected.", hasAnomaly: false },
        {
          response: "YES - Anomaly detected in system data.",
          hasAnomaly: true,
          details: "Suspicious activity in data stream...",
        },
      ];

      const result = responses[Math.floor(Math.random() * responses.length)];

      const scan = {
        id: `scan_${Date.now()}`,
        timestamp: new Date().toISOString(),
        query: prompt,
        response: result.response,
        anomalyDetected: result.hasAnomaly,
        details: result.details,
        confidence: Math.random() * 0.3 + 0.7,
      };

      sentinelScans.unshift(scan);
      if (sentinelScans.length > 10) sentinelScans.pop();

      // Broadcast to all WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "sentinel_scan", data: scan }));
        }
      });

      res.json(scan);
    },
    Math.random() * 2000 + 1000,
  ); // 1-3 second delay
});

app.get("/api/data/realtime", (req, res) => {
  res.json(generateRealtimeData());
});

// Data generator control endpoints
app.get("/api/data-generator/status", (req, res) => {
  res.json({
    status: dataGeneratorStatus,
    pid: dataGeneratorProcess ? dataGeneratorProcess.pid : null,
    uptime: dataGeneratorProcess
      ? Date.now() - (dataGeneratorProcess.startTime || Date.now())
      : 0,
  });
});

app.post("/api/data-generator/start", (req, res) => {
  if (dataGeneratorProcess) {
    return res.status(400).json({ error: "Data generator is already running" });
  }

  try {
    // Path to the data generator directory
    const dataGenPath = path.join(__dirname, "../../data-generator");

    // Spawn npm start in the data generator directory
    dataGeneratorProcess = spawn("npm", ["start"], {
      cwd: dataGenPath,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    dataGeneratorProcess.startTime = Date.now();
    dataGeneratorStatus = "starting";

    // Handle process outputs
    dataGeneratorProcess.stdout.on("data", (data) => {
      console.log(`Data Generator: ${data}`);
      // Broadcast status to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "data_generator_log",
              data: {
                message: data.toString(),
                timestamp: new Date().toISOString(),
              },
            }),
          );
        }
      });
    });

    dataGeneratorProcess.stderr.on("data", (data) => {
      console.error(`Data Generator Error: ${data}`);
    });

    dataGeneratorProcess.on("close", (code) => {
      console.log(`Data generator exited with code ${code}`);
      dataGeneratorProcess = null;
      dataGeneratorStatus = "stopped";

      // Broadcast status change
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "data_generator_status",
              data: { status: "stopped" },
            }),
          );
        }
      });
    });

    // Set status to running after a brief delay
    setTimeout(() => {
      if (dataGeneratorProcess) {
        dataGeneratorStatus = "running";
        // Broadcast status change
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "data_generator_status",
                data: { status: "running" },
              }),
            );
          }
        });
      }
    }, 3000);

    res.json({
      message: "Data generator started successfully",
      pid: dataGeneratorProcess.pid,
      status: dataGeneratorStatus,
    });
  } catch (error) {
    console.error("Failed to start data generator:", error);
    dataGeneratorStatus = "error";
    res.status(500).json({ error: "Failed to start data generator" });
  }
});

app.post("/api/data-generator/stop", (req, res) => {
  if (!dataGeneratorProcess) {
    return res.status(400).json({ error: "Data generator is not running" });
  }

  try {
    dataGeneratorProcess.kill("SIGTERM");
    dataGeneratorStatus = "stopping";

    // Force kill after 5 seconds if it doesn't stop gracefully
    setTimeout(() => {
      if (dataGeneratorProcess) {
        dataGeneratorProcess.kill("SIGKILL");
      }
    }, 5000);

    res.json({
      message: "Data generator stop signal sent",
      status: dataGeneratorStatus,
    });
  } catch (error) {
    console.error("Failed to stop data generator:", error);
    res.status(500).json({ error: "Failed to stop data generator" });
  }
});

// SSE endpoint for streaming events
app.get("/api/clusters/:clusterId/topics/:topic/events/stream", async (req, res) => {
  const { topic, clusterId } = req.params;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  console.log(`SSE client connected for topic ${topic} on cluster ${clusterId}`);

  // Send initial connection message
  res.write('data: {"type":"connected","topic":"' + topic + '"}\n\n');

  // Create a streaming consumer
  const kafka = kafkaConnections[clusterId];
  if (!kafka) {
    res.write('data: {"type":"error","message":"Invalid cluster ID"}\n\n');
    res.end();
    return;
  }

  const consumer = kafka.consumer({
    groupId: `matrix-ui-stream-${clusterId}-${Date.now()}`,
  });

  let isConnected = true;

  const cleanup = async () => {
    if (consumer && isConnected) {
      console.log(`Cleaning up SSE consumer for topic ${topic}`);
      try {
        await consumer.stop();
        await consumer.disconnect();
      } catch (error) {
        console.error('Error during SSE cleanup:', error);
      }
    }
    isConnected = false;
  };

  // Handle client disconnect
  req.on('close', cleanup);
  req.on('aborted', cleanup);

  try {
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!isConnected) return;

        try {
          const event = {
            id: `kafka_${topic}_${partition}_${message.offset}`,
            topic: topic,
            timestamp: message.timestamp
              ? new Date(parseInt(message.timestamp)).toISOString()
              : new Date().toISOString(),
            partition: partition,
            offset: parseInt(message.offset),
            key: message.key ? message.key.toString() : null,
            value: message.value ? JSON.parse(message.value.toString()) : null,
            source: "kafka",
          };

          // Send event via SSE
          const sseData = JSON.stringify({ type: "event", data: event });
          res.write(`data: ${sseData}\n\n`);
          console.log(`SSE: Sent event for topic ${topic}`);
        } catch (parseError) {
          // If JSON parsing fails, treat as plain text
          const event = {
            id: `kafka_${topic}_${partition}_${message.offset}`,
            topic: topic,
            timestamp: message.timestamp
              ? new Date(parseInt(message.timestamp)).toISOString()
              : new Date().toISOString(),
            partition: partition,
            offset: parseInt(message.offset),
            key: message.key ? message.key.toString() : null,
            value: { raw: message.value ? message.value.toString() : null },
            source: "kafka",
          };

          const sseData = JSON.stringify({ type: "event", data: event });
          res.write(`data: ${sseData}\n\n`);
        }
      },
    });
  } catch (error) {
    console.error(`SSE Error for topic ${topic}:`, error);
    const errorData = JSON.stringify({ type: "error", message: error.message });
    res.write(`data: ${errorData}\n\n`);
    cleanup();
  }
});

app.get("/api/clusters/:clusterId/topics/:topic/events", async (req, res) => {
  const { topic, clusterId } = req.params;
  const { limit = 10 } = req.query;

  try {
    // Try to fetch real events from Kafka
    const events = await fetchKafkaEvents(clusterId, topic, parseInt(limit));
    res.json(events);
  } catch (error) {
    console.error(
      `Failed to fetch events from Kafka topic ${topic}:`,
      error.message,
    );

    // Fallback to mock events if Kafka fetch fails
    const events = [];
    for (let i = 0; i < parseInt(limit); i++) {
      const event = {
        id: `mock_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        topic,
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        partition: Math.floor(Math.random() * 3),
        offset: Math.floor(Math.random() * 10000) + 1000,
        key: `key_${Math.floor(Math.random() * 1000)}`,
        value: generateEventValue(topic),
        source: "mock",
      };
      events.push(event);
    }

    res.json(events);
  }
});

function generateEventValue(topic) {
  switch (topic) {
    case "WORLD_NY_1999.yellow_cab_dispatch":
      return {
        cab_id: `NYC-${Math.floor(1000 + Math.random() * 9000)}`,
        zone: [
          "Manhattan-Midtown",
          "Manhattan-Downtown",
          "Manhattan-Uptown",
          "Brooklyn-Heights",
          "Queens-Astoria",
        ][Math.floor(Math.random() * 5)],
        status: ["dispatched", "en_route", "arrived", "completed", "cancelled"][
          Math.floor(Math.random() * 5)
        ],
        passengers: Math.floor(1 + Math.random() * 4),
        fare_usd: parseFloat((5 + Math.random() * 45).toFixed(2)),
        distance_miles: parseFloat((0.5 + Math.random() * 15).toFixed(1)),
        timestamp: new Date().toISOString(),
      };

    case "WORLD_LA_2024.ev_charging_logs":
      return {
        session_id: `LA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        station: [
          "Venice-Beach-Supercharger",
          "Santa-Monica-Pier",
          "Hollywood-Blvd",
          "Downtown-LA-Hub",
        ][Math.floor(Math.random() * 4)],
        connector_type: ["CCS", "CHAdeMO", "Tesla-NACS", "J1772"][
          Math.floor(Math.random() * 4)
        ],
        status: ["charging", "completed", "waiting", "error", "disconnected"][
          Math.floor(Math.random() * 5)
        ],
        vehicle_make: ["Tesla", "Rivian", "Lucid", "BMW", "Ford", "Hyundai"][
          Math.floor(Math.random() * 6)
        ],
        kwh_delivered: parseFloat((Math.random() * 80).toFixed(2)),
        cost_usd: parseFloat((2 + Math.random() * 25).toFixed(2)),
        battery_pct: Math.floor(10 + Math.random() * 90),
        timestamp: new Date().toISOString(),
      };

    case "WORLD_NY_1999.subway_commuter_density":
      return {
        station: [
          "Times Square",
          "Grand Central",
          "Union Square",
          "Herald Square",
          "Wall Street",
        ][Math.floor(Math.random() * 5)],
        line: ["4-5-6", "N-Q-R-W", "L", "A-C-E", "1-2-3"][
          Math.floor(Math.random() * 5)
        ],
        density_pct: Math.floor(Math.random() * 100),
        passenger_count: Math.floor(Math.random() * 500) + 50,
        direction: ["uptown", "downtown"][Math.floor(Math.random() * 2)],
        rush_hour: new Date().getHours() >= 7 && new Date().getHours() <= 9,
        timestamp: new Date().toISOString(),
      };

    default:
      return {
        message: "Sample event data",
        timestamp: new Date().toISOString(),
      };
  }
}

// Produce event endpoint
app.post("/api/clusters/:clusterId/topics/:topic/produce", async (req, res) => {
  const { clusterId, topic } = req.params;
  const kafka = kafkaConnections[clusterId];
  
  if (!kafka) {
    return res.status(400).json({ error: "Invalid cluster ID" });
  }

  try {
    const producer = kafka.producer();
    await producer.connect();
    
    await producer.send({
      topic: topic,
      messages: [
        { 
          key: `manual_${Date.now()}`,
          value: typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
        }
      ]
    });

    await producer.disconnect();
    
    console.log(`Produced event to ${topic} on cluster ${clusterId}`);
    res.json({ message: "Event produced successfully", topic, clusterId });
  } catch (error) {
    console.error(`Failed to produce event:`, error);
    res.status(500).json({ error: "Failed to produce event", details: error.message });
  }
});

// Simulate new anomalies occasionally
setInterval(() => {
  if (Math.random() > 0.95) {
    // 5% chance every 10 seconds
    const newAnomaly = {
      id: `anom_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: [
        "WORLD_NY_1999.subway_commuter_density",
        "WORLD_LA_2024.ev_charging_logs",
      ][Math.floor(Math.random() * 2)],
      severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
      description: "Anomalous pattern detected in data stream",
      aiAnalysis:
        "AI analysis indicates unusual behavior requiring investigation.",
      confidence: Math.random() * 0.4 + 0.6,
      resolved: false,
    };

    anomalies.unshift(newAnomaly);
    if (anomalies.length > 10) anomalies.pop();

    // Broadcast to WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "new_anomaly", data: newAnomaly }));
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
