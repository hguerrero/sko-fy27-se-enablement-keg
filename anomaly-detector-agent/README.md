# 🔴 Anomaly Detector Agent

> *"There is a difference between knowing the path and walking the path."*

A Kafka-native AI agent that monitors machine status events flowing through the Kong Event Gateway, enriches them with LLM-powered anomaly analysis, and produces results to downstream topics — one for triggering other agents and one for vector database ingestion (RAG context).

## How It Works

```
                         ┌──────────────────────┐
                         │   Volcano SDK + LLM   │
                         │  (anomaly analysis)   │
                         └───────┬──────────────┘
                                 │
  Kafka (KEG)                    │                    Kafka (KEG)
┌─────────────────┐    consume   │   produce    ┌──────────────────────┐
│ WORLD_NY_1999.  │ ──────────▶  │  ──────────▶ │ anomaly_detection_   │
│ subway_commuter │              │              │ pings (triggers)     │
│ _density        │              │              ├──────────────────────┤
└─────────────────┘              └────────────▶ │ knowledge_ingestion  │
                                                │ (enriched for RAG)  │
                                                └──────────────────────┘
```

1. **Consumes** from `WORLD_NY_1999.subway_commuter_density` via KEG's Machine City Core virtual cluster (port `19092`)
2. **Analyzes** each message using Volcano SDK — the LLM classifies anomaly severity and generates recommendations
3. **Produces** to two output topics:
   - **`anomaly_detection_pings`** — lightweight trigger payload with anomaly flag, severity, and recommended action for downstream agents
   - **`knowledge_ingestion`** — fully enriched event with analysis metadata (`_analysis`, `_severity`, `_is_anomaly`, `_analyzed_at`) for vector DB storage and RAG retrieval

## Quick Start

```bash
# Install dependencies
npm install

# Run the agent
OPENAI_API_KEY=sk-... npm start
```

The agent connects to KEG and begins listening. Send a message to the input topic to trigger analysis:

```bash
# Example: produce a test event via KEG machine-city-core (port 19092)
echo '{"protocol_id":"PROTO-7","machine_id":42,"status":"PURGING"}' | \
  kafkactl produce WORLD_NY_1999.subway_commuter_density -b localhost:19092
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key |
| `OPENAI_MODEL` | — | `gpt-4o-mini` | Model to use for analysis |
| `KAFKA_BROKER` | — | `localhost:19092` | KEG gateway bootstrap server |

## Output Schemas

### `anomaly_detection_pings` (trigger topic)

```json
{
  "source": "anomaly-detector-agent",
  "timestamp": "2026-02-06T20:00:00.000Z",
  "is_anomaly": true,
  "severity": "high",
  "recommended_action": "Dispatch sentinel to sector 7",
  "original_event": { "protocol_id": "PROTO-7", "machine_id": 42, "status": "PURGING" }
}
```

### `knowledge_ingestion` (enriched topic for RAG)

```json
{
  "protocol_id": "PROTO-7",
  "machine_id": 42,
  "status": "PURGING",
  "_analysis": "Machine 42 entering PURGING state indicates potential pod failure",
  "_severity": "high",
  "_is_anomaly": true,
  "_analyzed_at": "2026-02-06T20:00:00.000Z",
  "_agent": "anomaly-detector-agent"
}
```

## Project Structure

```
anomaly-detector-agent/
├── src/
│   └── index.ts      # Kafka consumer → LLM analysis → Kafka producer
├── package.json
└── tsconfig.json
```

## Scripts

| Command | Description |
|---|---|
| `npm start` | Run the agent (via `tsx`) |
| `npm run dev` | Run with file watching (auto-restart on changes) |
| `npm run build` | Compile TypeScript to `dist/` |

## Tech Stack

- **[Volcano SDK](https://volcano.dev)** — multi-provider AI agent framework
- **[KafkaJS](https://kafka.js.org/)** — Node.js Kafka client
- **[Kong Event Gateway](https://docs.konghq.com/event-gateway/)** — Kafka proxy with multi-tenancy and policy enforcement
- **OpenAI** — LLM provider (via Volcano SDK)
- **TypeScript** — type-safe implementation

