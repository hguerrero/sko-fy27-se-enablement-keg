import { Kafka, logLevel } from "kafkajs";
import { agent, llmOpenAI } from "volcano-sdk";

// ---------------------------------------------------------------------------
// Config – connects through KEG machine-city-core virtual cluster
// ---------------------------------------------------------------------------
const BROKER = process.env.KAFKA_BROKER ?? "localhost:19092";
// const USERNAME = process.env.KAFKA_USERNAME ?? "redpill-rebels";
// const PASSWORD = process.env.KAFKA_PASSWORD ?? "secret";

const INPUT_TOPIC = "WORLD_NY_1999.subway_commuter_density";
const TRIGGER_TOPIC = "anomaly_detection_pings";
const ENRICHED_TOPIC = "knowledge_ingestion";

// ---------------------------------------------------------------------------
// AI Gateway RAG Injector – ingest enriched data into vector store
// ---------------------------------------------------------------------------
const KONG_ADMIN_URL = process.env.KONG_ADMIN_URL ?? "http://localhost:8001";
const RAG_COLLECTION = process.env.RAG_COLLECTION ?? "anomaly-reports";

// ---------------------------------------------------------------------------
// LLM – uses OpenAI via Volcano SDK (set OPENAI_API_KEY env var)
// ---------------------------------------------------------------------------
const llm = llmOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
});

// ---------------------------------------------------------------------------
// Kafka client (KafkaJS) with SASL/PLAIN through KEG gateway
// ---------------------------------------------------------------------------
const kafka = new Kafka({
  clientId: "sko-anomaly-detector-agent",
  brokers: [BROKER],
  // sasl: { mechanism: "plain", username: USERNAME, password: PASSWORD },
  logLevel: logLevel.WARN
});

const consumer = kafka.consumer({ groupId: "sko-anomaly-detector-agent" });
const producer = kafka.producer();

// ---------------------------------------------------------------------------
// RAG Injector – discover plugin ID and ingest enriched data
// ---------------------------------------------------------------------------
let ragIngestUrl: string | null = null;

async function discoverRagPluginId(): Promise<string | null> {
  try {
    const res = await fetch(`${KONG_ADMIN_URL}/plugins`);
    if (!res.ok) {
      console.warn(`⚠️  Could not reach Kong Admin API (${res.status}). RAG ingestion disabled.`);
      return null;
    }
    const body = await res.json() as { data: Array<{ id: string; name: string }> };
    const plugin = body.data.find((p) => p.name === "ai-rag-injector");
    if (!plugin) {
      console.warn("⚠️  ai-rag-injector plugin not found. RAG ingestion disabled.");
      return null;
    }
    return plugin.id;
  } catch (err) {
    console.warn("⚠️  Kong Admin API unreachable. RAG ingestion disabled.", err);
    return null;
  }
}

async function ingestToRag(enrichedPayload: string, ragSnippet: string): Promise<void> {
  if (!ragIngestUrl) return;

  const enriched = JSON.parse(enrichedPayload);

  console.log(ragSnippet)

  const chunk = {
    content: ragSnippet,
    metadata: {
      collection: RAG_COLLECTION,
      source: "anomaly-detector-agent",
      date: enriched._analyzed_at,
      severity: enriched._severity,
      is_anomaly: String(enriched._is_anomaly),
      tags: ["machine-status", "subway", "ny-1999", "anomaly-detection"],
    },
  };

  try {
    const res = await fetch(ragIngestUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ RAG ingest failed (${res.status}): ${text}`);
      return;
    }

    console.log(`📦 RAG ingest OK → vector store updated`);
  } catch (err) {
    console.error("❌ RAG ingest request failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Anomaly analysis agent – single LLM step powered by Volcano SDK
// ---------------------------------------------------------------------------
async function analyzeMessage(raw: string): Promise<{
  triggerPayload: string;
  enrichedPayload: string;
  ragSnippet: string;
}> {
  const results = await agent({ llm, hideProgress: true })
    .then({
      prompt: `You are a Matrix anomaly-detection sentinel. Analyze the following machine
status event and determine if it represents an anomaly or noteworthy pattern.

Event payload:
${raw}

Respond STRICTLY as JSON with these fields:
{
  "is_anomaly": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "analysis": "<one-sentence explanation>",
  "recommended_action": "<what other agents should do>",
  "enriched_event": { <original fields plus your added context fields> },
  "rag_snippet": "<a concise human-readable text paragraph summarizing this event for a knowledge base. Include: what the target system or entity is, its last known location or zone, the anomaly status and severity, and the key observations. Write it as a self-contained intelligence briefing that can be retrieved later by a RAG system.>"
}`,
    })
    .run();

  const llmOutput = results[results.length - 1]?.llmOutput ?? "{}";

  // Parse the LLM JSON response (strip markdown fences if present)
  const cleaned = llmOutput.replace(/```json\n?/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  // Build the trigger message for other agents
  const trigger = {
    source: "anomaly-detector-agent",
    timestamp: new Date().toISOString(),
    is_anomaly: parsed.is_anomaly,
    severity: parsed.severity,
    recommended_action: parsed.recommended_action,
    original_event: JSON.parse(raw),
  };

  // Build the enriched message for vector DB / RAG storage
  const enriched = {
    ...parsed.enriched_event,
    _analysis: parsed.analysis,
    _severity: parsed.severity,
    _is_anomaly: parsed.is_anomaly,
    _analyzed_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    _agent: "anomaly-detector-agent",
  };

  return {
    triggerPayload: JSON.stringify(trigger),
    enrichedPayload: JSON.stringify(enriched),
    ragSnippet: parsed.rag_snippet ?? `Anomaly report: ${parsed.analysis}`,
  };
}

// ---------------------------------------------------------------------------
// Main loop – consume → analyze → produce
// ---------------------------------------------------------------------------
async function main() {
  console.log("🔴 Anomaly Detector Agent initializing...");
  console.log(`   Broker : ${BROKER}`);
  console.log(`   Input  : ${INPUT_TOPIC}`);
  console.log(`   Outputs: ${TRIGGER_TOPIC}, ${ENRICHED_TOPIC}`);

  // Discover RAG Injector plugin for vector store ingestion
  const pluginId = await discoverRagPluginId();
  if (pluginId) {
    ragIngestUrl = `${KONG_ADMIN_URL}/ai-rag-injector/${pluginId}/ingest_chunk`;
    console.log(`   RAG    : ${ragIngestUrl}`);
  }

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: INPUT_TOPIC, fromBeginning: true });

  console.log("🟢 Listening for machine status events...\n");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      console.log(`⚡ Received event: ${raw}`);

      try {
        const { triggerPayload, enrichedPayload, ragSnippet } = await analyzeMessage(raw);

        await producer.send({
          topic: TRIGGER_TOPIC,
          messages: [{ key: message.key, value: triggerPayload }],
        });

        await producer.send({
          topic: ENRICHED_TOPIC,
          messages: [{ key: message.key, value: enrichedPayload }],
        });

        // Ingest enriched data into AI Gateway vector store (RAG)
        await ingestToRag(enrichedPayload, ragSnippet);

        console.log(`✅ Processed → trigger + enriched + RAG ingested\n`);
      } catch (err) {
        console.error("❌ Failed to process event:", err);
      }
    },
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

