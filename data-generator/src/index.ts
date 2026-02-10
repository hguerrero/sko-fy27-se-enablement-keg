import { Kafka, logLevel } from "kafkajs";

// ---------------------------------------------------------------------------
// Config — two virtual clusters, two topics
// ---------------------------------------------------------------------------
const NY_BROKER = process.env.NY_BROKER ?? "localhost:19192";
const LA_BROKER = process.env.LA_BROKER ?? "localhost:19292";
const LA_USERNAME = process.env.LA_USERNAME ?? "redpill-rebels";
const LA_PASSWORD = process.env.LA_PASSWORD ?? "secret";
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS ?? "3000", 10);

// Topics (prefix hidden by KEG namespace)
const CAB_TOPIC = "yellow_cab_dispatch";
const EV_TOPIC = "ev_charging_logs";

// ---------------------------------------------------------------------------
// Kafka clients — one per virtual cluster
// ---------------------------------------------------------------------------
const kafkaNY = new Kafka({
  clientId: "data-gen-ny",
  brokers: [NY_BROKER],
  logLevel: logLevel.WARN,
});

const kafkaLA = new Kafka({
  clientId: "data-gen-la",
  brokers: [LA_BROKER],
  // sasl: { mechanism: "plain", username: LA_USERNAME, password: LA_PASSWORD },
  logLevel: logLevel.WARN,
});

const producerNY = kafkaNY.producer();
const producerLA = kafkaLA.producer();

// ---------------------------------------------------------------------------
// Random data generators
// ---------------------------------------------------------------------------
const ZONES = [
  "Manhattan-Midtown", "Manhattan-Downtown", "Manhattan-Uptown",
  "Brooklyn-Heights", "Queens-Astoria", "Bronx-Fordham",
  "Staten-Island-Ferry", "JFK-Airport", "LaGuardia-Airport",
];
const CAB_STATUS = ["dispatched", "en_route", "arrived", "completed", "cancelled"];

function randomCabEvent() {
  const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
  return {
    cab_id: `NYC-${Math.floor(1000 + Math.random() * 9000)}`,
    zone,
    status: CAB_STATUS[Math.floor(Math.random() * CAB_STATUS.length)],
    passengers: Math.floor(1 + Math.random() * 4),
    fare_usd: parseFloat((5 + Math.random() * 45).toFixed(2)),
    distance_miles: parseFloat((0.5 + Math.random() * 15).toFixed(1)),
    timestamp: new Date().toISOString(),
  };
}

const STATIONS = [
  "Venice-Beach-Supercharger", "Santa-Monica-Pier", "Hollywood-Blvd",
  "Downtown-LA-Hub", "Pasadena-Central", "Long-Beach-Marina",
  "LAX-Terminal-3", "Griffith-Observatory", "Silver-Lake-Station",
];
const CONNECTOR_TYPES = ["CCS", "CHAdeMO", "Tesla-NACS", "J1772"];
const EV_STATUS = ["charging", "completed", "waiting", "error", "disconnected"];

function randomEvEvent() {
  const station = STATIONS[Math.floor(Math.random() * STATIONS.length)];
  const connector = CONNECTOR_TYPES[Math.floor(Math.random() * CONNECTOR_TYPES.length)];
  return {
    session_id: `LA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    station,
    connector_type: connector,
    status: EV_STATUS[Math.floor(Math.random() * EV_STATUS.length)],
    vehicle_make: ["Tesla", "Rivian", "Lucid", "BMW", "Ford", "Hyundai"][Math.floor(Math.random() * 6)],
    kwh_delivered: parseFloat((Math.random() * 80).toFixed(2)),
    cost_usd: parseFloat((2 + Math.random() * 25).toFixed(2)),
    battery_pct: Math.floor(10 + Math.random() * 90),
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main loop — produce to both topics on a timer
// ---------------------------------------------------------------------------
async function main() {
  console.log("🔴 Data Generator initializing...");
  console.log(`   NY broker : ${NY_BROKER} → ${CAB_TOPIC}`);
  console.log(`   LA broker : ${LA_BROKER} → ${EV_TOPIC}`);
  console.log(`   Interval  : ${INTERVAL_MS}ms\n`);

  await producerNY.connect();
  await producerLA.connect();
  console.log("🟢 Connected to both virtual clusters. Generating events...\n");

  let count = 0;

  setInterval(async () => {
    count++;
    try {
      const cab = randomCabEvent();
      const ev = randomEvEvent();

      await producerNY.send({
        topic: CAB_TOPIC,
        messages: [{ key: cab.cab_id, value: JSON.stringify(cab) }],
      });

      await producerLA.send({
        topic: EV_TOPIC,
        messages: [{ key: ev.session_id, value: JSON.stringify(ev) }],
      });

      console.log(`#${count} 🚕 ${cab.cab_id} ${cab.status} in ${cab.zone} ($${cab.fare_usd})`);
      console.log(`#${count} ⚡ ${ev.vehicle_make} ${ev.status} at ${ev.station} (${ev.kwh_delivered} kWh)`);
      console.log();
    } catch (err) {
      console.error("❌ Error producing events:", err);
    }
  }, INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

